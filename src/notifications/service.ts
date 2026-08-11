/**
 * Local notification scheduling.
 *
 * Deliberately the *only* module that talks to `expo-notifications`. When the
 * app moves to a development build and swaps in Notifee for true full-screen
 * Android alarms, this file is the seam — `scheduleDose`, `cancelDose` and
 * `configure` are the whole contract the rest of the app depends on.
 *
 * Two platform realities shape the design:
 *
 * 1. iOS allows only 64 pending local notifications per app, and silently
 *    drops the rest. A patient on 4 drops x 5 doses/day burns that in three
 *    days. So we never schedule the whole future: we keep a rolling window of
 *    the soonest N doses and re-arm it whenever the app opens, a dose is acted
 *    on, or a notification fires.
 *
 * 2. Custom alarm sounds and Android full-screen intents need a native build.
 *    In Expo Go you get the system notification sound. The sound/vibration
 *    settings are still stored per reminder so they take effect as soon as the
 *    app runs as a development build, rather than being retrofitted later.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { doses as doseRepo, type Dose } from '../db/repositories';

/**
 * How many notifications we keep armed at once. iOS hard-caps at 64; we leave
 * headroom so a snooze scheduled on top of the window is never the one dropped.
 */
export const NOTIFICATION_BUDGET = 56;

export const ANDROID_CHANNEL_ID = 'dose-reminders';
export const DOSE_CATEGORY_ID = 'dose-reminder';

/** How long after a scheduled time a dose stays actionable before it is missed. */
export const MISSED_GRACE_MINUTES = 30;

let configured = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Sets up the Android channel and the Taken/Snooze/Skip action buttons. */
export async function configure(): Promise<void> {
  if (configured) return;
  configured = true;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Dose reminders',
      description: 'Alerts when it is time for an eye drop.',
      importance: Notifications.AndroidImportance.MAX,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      vibrationPattern: [0, 400, 200, 400],
      enableVibrate: true,
      bypassDnd: false,
      sound: 'default',
    });
  }

  await Notifications.setNotificationCategoryAsync(DOSE_CATEGORY_ID, [
    {
      identifier: 'taken',
      buttonTitle: 'Taken',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'snooze',
      buttonTitle: 'Snooze',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'skip',
      buttonTitle: 'Skip',
      options: { opensAppToForeground: false, isDestructive: true },
    },
  ]);
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function getPermissionState(): Promise<PermissionState> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return 'granted';
  if (settings.canAskAgain) return 'undetermined';
  return 'denied';
}

export async function requestPermission(): Promise<PermissionState> {
  const settings = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: true,
      allowBadge: false,
      // Lets a dose reminder break through Focus modes, which is the closest
      // iOS equivalent to the Android full-screen alarm.
      allowProvisional: false,
    },
  });
  if (settings.granted) return 'granted';
  if (settings.canAskAgain) return 'undetermined';
  return 'denied';
}

function body(dose: Dose): string {
  const eye =
    dose.eye === 'both' ? 'both eyes' : dose.eye === 'left' ? 'left eye' : 'right eye';
  return `${dose.dosage} — ${eye}`;
}

/**
 * Arms a single dose. Returns the platform notification id, or null when the
 * dose is already in the past (nothing to schedule).
 */
export async function scheduleDose(
  dose: Dose,
  options: { soundEnabled: boolean; vibrateEnabled: boolean },
): Promise<string | null> {
  if (dose.scheduledAt <= Date.now()) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: dose.medicationName,
      body: body(dose),
      data: { doseId: dose.id, patientId: dose.patientId },
      categoryIdentifier: DOSE_CATEGORY_ID,
      sound: options.soundEnabled ? 'default' : undefined,
      vibrate: options.vibrateEnabled ? [0, 400, 200, 400] : undefined,
      // iOS: raises the notification above normal delivery and lets it
      // through Focus. The nearest thing iOS offers to an alarm without the
      // Critical Alerts entitlement, which requires Apple approval.
      interruptionLevel: 'timeSensitive',
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(dose.scheduledAt),
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
  });
}

export async function cancelDose(dose: Dose): Promise<void> {
  if (!dose.notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(dose.notificationId);
  } catch {
    // Already fired or already cancelled — nothing to undo.
  }
  await doseRepo.setNotificationId(dose.id, null);
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export type ReminderNotificationPrefs = Map<
  string,
  { soundEnabled: boolean; vibrateEnabled: boolean }
>;

/**
 * Rebuilds the rolling window.
 *
 * Cancels everything currently armed and re-arms the soonest
 * `NOTIFICATION_BUDGET` unresolved doses. Cancel-then-rearm rather than a diff
 * because the set is small, the operation is idempotent, and a diff that drifts
 * out of sync would silently stop reminding a patient — the one failure this
 * app must not have.
 */
export async function refreshScheduledNotifications(
  prefs: ReminderNotificationPrefs,
): Promise<{ scheduled: number; truncated: boolean }> {
  await configure();

  const permission = await getPermissionState();
  if (permission !== 'granted') {
    return { scheduled: 0, truncated: false };
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  // One extra so we can tell whether we hit the cap.
  const upcoming = await doseRepo.upcoming(NOTIFICATION_BUDGET + 1);
  const truncated = upcoming.length > NOTIFICATION_BUDGET;
  const window = upcoming.slice(0, NOTIFICATION_BUDGET);

  let scheduled = 0;
  for (const dose of window) {
    const pref = prefs.get(dose.reminderId) ?? { soundEnabled: true, vibrateEnabled: true };
    try {
      const id = await scheduleDose(dose, pref);
      await doseRepo.setNotificationId(dose.id, id);
      if (id) scheduled += 1;
    } catch {
      // A single failed schedule must not abort the rest of the window.
      await doseRepo.setNotificationId(dose.id, null);
    }
  }

  return { scheduled, truncated };
}

/** Arms a one-off notification for a snoozed dose. */
export async function scheduleSnooze(
  dose: Dose,
  minutes: number,
  options: { soundEnabled: boolean; vibrateEnabled: boolean },
): Promise<{ scheduledAt: number; notificationId: string | null }> {
  const scheduledAt = Date.now() + minutes * 60_000;
  const id = await scheduleDose({ ...dose, scheduledAt }, options);
  return { scheduledAt, notificationId: id };
}

export function addResponseListener(
  handler: (doseId: string, action: string) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const doseId = response.notification.request.content.data?.doseId;
    if (typeof doseId === 'string') {
      handler(doseId, response.actionIdentifier);
    }
  });
}

export function addReceivedListener(
  handler: (doseId: string) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener((notification) => {
    const doseId = notification.request.content.data?.doseId;
    if (typeof doseId === 'string') {
      handler(doseId);
    }
  });
}

export const DEFAULT_ACTION = Notifications.DEFAULT_ACTION_IDENTIFIER;
