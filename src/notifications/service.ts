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
import { allocateFairly } from './allocation';

/**
 * How many notifications we keep armed at once. iOS hard-caps at 64; we leave
 * headroom so a snooze scheduled on top of the window is never the one dropped.
 */
export const NOTIFICATION_BUDGET = 56;

/**
 * Android notification channels are immutable after creation: importance,
 * sound and audio routing are frozen, and later edits are silently ignored so
 * the user stays in control of their own settings. Changing any of those means
 * publishing a NEW channel id and deleting the old one — which is why this has
 * a version suffix. Bump it whenever the channel configuration below changes,
 * or existing installs keep the old behaviour forever.
 */
export const ANDROID_CHANNEL_ID = 'dose-alarms-v2';
const LEGACY_ANDROID_CHANNEL_IDS = ['dose-reminders'];

export const DOSE_CATEGORY_ID = 'dose-reminder';

/**
 * Vibration strong enough to wake someone: long pulses, repeated.
 * Shared by the channel and by individual notifications.
 */
const ALARM_VIBRATION_PATTERN = [0, 800, 400, 800, 400, 800];

/**
 * iOS `critical` breaks through the silent switch and Focus at a volume the
 * app chooses — but it needs Apple's Critical Alerts entitlement, granted by
 * application, and a build that declares it. Requesting it without the
 * entitlement gets the notification rejected, so until that is approved the
 * ceiling is `timeSensitive`, which still pierces Focus.
 *
 * Flip this to true in the same change that adds the approved entitlement.
 */
const IOS_CRITICAL_ALERTS_ENTITLED = false;

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
      name: 'Dose alarms',
      description: 'Rings when an eye drop is due.',
      importance: Notifications.AndroidImportance.MAX,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      vibrationPattern: ALARM_VIBRATION_PATTERN,
      enableVibrate: true,
      // Ring through Do Not Disturb. Android only honours this once the user
      // grants notification-policy access; without it the flag is ignored
      // rather than rejected, so asking costs nothing.
      bypassDnd: true,
      sound: 'default',
      // The part that makes this loud rather than merely urgent. Routing the
      // channel to the ALARM stream means it plays at the phone's *alarm*
      // volume — the one people keep turned up to wake themselves — instead of
      // notification volume, and it is not muted by the ringer switch.
      // enforceAudibility asks the system to make it heard over other audio.
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.ALARM,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        flags: { enforceAudibility: true, requestHardwareAudioVideoSynchronization: false },
      },
    });

    // Retire superseded channels so the old, quieter settings cannot linger.
    for (const legacy of LEGACY_ANDROID_CHANNEL_IDS) {
      await Notifications.deleteNotificationChannelAsync(legacy).catch(() => {});
    }
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
 * Whose dose this is, first, then what it is.
 *
 * A caregiver managing two people sees these on a lock screen with no other
 * context, so the profile name leads: acting on the wrong person's reminder is
 * the mistake worth designing against. Single-profile users see their own name
 * here too, which is a small cost for never being ambiguous.
 */
function title(dose: Dose, patientName: string): string {
  return patientName ? `${patientName} — ${dose.medicationName}` : dose.medicationName;
}

export type DoseAlarmOptions = {
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  /** Shown first in the notification title. */
  patientName: string;
};

/**
 * Arms a single dose. Returns the platform notification id, or null when the
 * dose is already in the past (nothing to schedule).
 */
export async function scheduleDose(
  dose: Dose,
  options: DoseAlarmOptions,
): Promise<string | null> {
  if (dose.scheduledAt <= Date.now()) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: title(dose, options.patientName),
      body: body(dose),
      data: { doseId: dose.id, patientId: dose.patientId },
      categoryIdentifier: DOSE_CATEGORY_ID,
      sound: options.soundEnabled ? 'default' : undefined,
      vibrate: options.vibrateEnabled ? ALARM_VIBRATION_PATTERN : undefined,
      // `critical` pierces the silent switch and Focus, but only with Apple's
      // entitlement; `timeSensitive` is the strongest level available without
      // it and still breaks through Focus.
      interruptionLevel: IOS_CRITICAL_ALERTS_ENTITLED ? 'critical' : 'timeSensitive',
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

/** Per-reminder alarm settings plus the profile the reminder belongs to. */
export type ReminderNotificationPrefs = Map<string, DoseAlarmOptions>;

/**
 * Rebuilds the rolling window.
 *
 * Cancels everything currently armed and re-arms a fair slice of the soonest
 * unresolved doses, across every profile on the device. Cancel-then-rearm
 * rather than a diff because the set is small, the operation is idempotent,
 * and a diff that drifts out of sync would silently stop reminding a patient
 * — the one failure this app must not have.
 *
 * Note that this is deliberately profile-agnostic: it arms doses for everyone,
 * not just whoever is currently selected in the UI. Switching profiles is a
 * view change and must never silence another profile's alarms.
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

  // Pull a pool wider than the budget so the fair split has something to
  // choose between; one extra tells us whether anything was left out.
  const pool = await doseRepo.upcoming(NOTIFICATION_BUDGET * 4 + 1);
  const window = allocateFairly(pool, NOTIFICATION_BUDGET);
  const truncated = pool.length > window.length;

  let scheduled = 0;
  for (const dose of window) {
    const pref = prefs.get(dose.reminderId) ?? {
      soundEnabled: true,
      vibrateEnabled: true,
      patientName: '',
    };
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
  options: DoseAlarmOptions,
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

export { allocateFairly } from './allocation';
