/**
 * Alarm scheduling.
 *
 * Deliberately the *only* module that talks to the notification layer. The
 * rest of the app depends on `configure`, `scheduleDose`, `cancelDose` and
 * `refreshScheduledNotifications`, and nothing else.
 *
 * Built on Notifee rather than expo-notifications because the product needs an
 * **alarm**, not a notification, and on Android those are different
 * mechanisms. A notification shows a banner, plays a sound once, and can be
 * swiped away. An alarm:
 *
 *  - is scheduled through AlarmManager's `setAlarmClock`, which is exempt from
 *    Doze and battery optimisation — the same call the system clock app uses;
 *  - carries a **full-screen intent**, so it launches the dose screen over the
 *    lock screen and turns the display on;
 *  - **loops** its sound until the patient acts, instead of chiming once;
 *  - is `ongoing`, so it cannot be swiped away — only Taken, Snooze or Skip
 *    clears it.
 *
 * expo-notifications exposes none of those four. That is the entire reason for
 * the dependency.
 *
 * Two platform limits remain, and neither is an oversight:
 *
 *  - **iOS has no full-screen alarm.** No API exists. iOS gets a Time
 *    Sensitive notification, which pierces Focus but respects the silent
 *    switch. Breaking through silent mode needs Apple's Critical Alerts
 *    entitlement — see `IOS_CRITICAL_ALERTS_ENTITLED`.
 *  - **iOS caps pending local notifications at 64** and silently drops the
 *    rest, so the rolling window still matters there. Android's AlarmManager
 *    has no such cap.
 */

import notifee, {
  AlarmType,
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  EventType,
  TriggerType,
  type Event,
} from '@notifee/react-native';
import { Platform } from 'react-native';

import { doses as doseRepo, type Dose } from '../db/repositories';
import { allocateFairly } from './allocation';

/**
 * How many alarms we keep armed at once.
 *
 * An iOS constraint — 64 pending local notifications, beyond which they are
 * silently dropped. Android has no equivalent limit, but one budget for both
 * keeps a single code path and costs nothing.
 */
export const NOTIFICATION_BUDGET = 56;

/**
 * Android notification channels are immutable after creation: importance,
 * sound and audio routing are frozen, and later edits are silently ignored so
 * the user stays in control of their own settings. Changing any of those means
 * publishing a NEW channel id and deleting the old one — hence the version
 * suffix. Bump it whenever the channel configuration below changes, or
 * existing installs keep the old behaviour forever.
 */
export const ANDROID_CHANNEL_ID = 'dose-alarms-v3';
const LEGACY_ANDROID_CHANNEL_IDS = ['dose-reminders', 'dose-alarms-v2'];

export const DOSE_CATEGORY_ID = 'dose-reminder';

/** Must match the file copied into res/raw by `plugins/withAlarmSupport.js`. */
const ALARM_SOUND_ANDROID = 'alarm_tone';
const ALARM_SOUND_IOS = 'alarm_tone.wav';

/** Long pulses, repeated — a pattern meant to wake someone, not to notify them. */
const ALARM_VIBRATION_PATTERN = [0, 800, 400, 800, 400, 800];

/** How long after a scheduled time a dose stays actionable before it is missed. */
export const MISSED_GRACE_MINUTES = 30;

/**
 * iOS `critical` breaks through the silent switch and Focus at a volume the
 * app chooses — but it needs Apple's Critical Alerts entitlement and a build
 * that declares it. Requesting it without the entitlement gets the
 * notification rejected, so the ceiling until then is `timeSensitive`.
 *
 * Flip this in the same change that adds the approved entitlement.
 */
const IOS_CRITICAL_ALERTS_ENTITLED = false;

let configured = false;

/** Creates the alarm channel and retires superseded ones. */
export async function configure(): Promise<void> {
  if (configured) return;
  configured = true;

  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: ANDROID_CHANNEL_ID,
      name: 'Dose alarms',
      description: 'Rings when an eye drop is due.',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      sound: ALARM_SOUND_ANDROID,
      vibration: true,
      vibrationPattern: ALARM_VIBRATION_PATTERN,
      // Ring through Do Not Disturb. Android only honours this once the user
      // grants notification-policy access; until then it is ignored rather
      // than rejected, so asking costs nothing.
      bypassDnd: true,
    });

    for (const legacy of LEGACY_ANDROID_CHANNEL_IDS) {
      await notifee.deleteChannel(legacy).catch(() => {});
    }
  }
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

function toPermissionState(status: AuthorizationStatus): PermissionState {
  if (status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL) {
    return 'granted';
  }
  if (status === AuthorizationStatus.NOT_DETERMINED) return 'undetermined';
  return 'denied';
}

export async function getPermissionState(): Promise<PermissionState> {
  const settings = await notifee.getNotificationSettings();
  return toPermissionState(settings.authorizationStatus);
}

export async function requestPermission(): Promise<PermissionState> {
  const settings = await notifee.requestPermission({
    criticalAlert: IOS_CRITICAL_ALERTS_ENTITLED,
  });
  return toPermissionState(settings.authorizationStatus);
}

/**
 * Opens the system screen where the user allows exact alarms.
 *
 * Android 14+ does not pre-grant this, and we deliberately do not claim
 * USE_EXACT_ALARM (Google restricts it to alarm-clock and calendar apps). An
 * alarm the system is free to delay is not an alarm, so the app asks.
 */
export async function openAlarmSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await notifee.openAlarmPermissionSettings().catch(() => {});
}

function body(dose: Dose): string {
  const eye = dose.eye === 'both' ? 'both eyes' : dose.eye === 'left' ? 'left eye' : 'right eye';
  return `${dose.dosage} — ${eye}`;
}

/**
 * Whose dose this is, first, then what it is.
 *
 * A caregiver managing two people sees this on a lock screen with no other
 * context, so the profile name leads: acting on the wrong person's alarm is
 * the mistake worth designing against.
 */
function title(dose: Dose, patientName: string): string {
  return patientName ? `${patientName} — ${dose.medicationName}` : dose.medicationName;
}

export type DoseAlarmOptions = {
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  /** Shown first in the alarm title. */
  patientName: string;
};

/** Per-reminder alarm settings plus the profile the reminder belongs to. */
export type ReminderNotificationPrefs = Map<string, DoseAlarmOptions>;

const DEFAULT_ALARM_OPTIONS: DoseAlarmOptions = {
  soundEnabled: true,
  vibrateEnabled: true,
  patientName: '',
};

/**
 * Arms one dose as an alarm. Returns the notification id, or null when the
 * dose is already in the past (nothing to schedule).
 */
export async function scheduleDose(
  dose: Dose,
  options: DoseAlarmOptions,
): Promise<string | null> {
  if (dose.scheduledAt <= Date.now()) return null;

  await configure();

  return notifee.createTriggerNotification(
    {
      // Reusing the dose id means re-arming the same dose replaces its alarm
      // rather than stacking a second one.
      id: dose.id,
      title: title(dose, options.patientName),
      body: body(dose),
      data: { doseId: dose.id, patientId: dose.patientId },
      android: {
        channelId: ANDROID_CHANNEL_ID,
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        smallIcon: 'ic_launcher',
        // The four properties that make this an alarm rather than a banner.
        fullScreenAction: { id: 'dose-alarm', launchActivity: 'default' },
        loopSound: options.soundEnabled,
        ongoing: true,
        autoCancel: false,
        sound: options.soundEnabled ? ALARM_SOUND_ANDROID : undefined,
        vibrationPattern: options.vibrateEnabled ? ALARM_VIBRATION_PATTERN : undefined,
        pressAction: { id: 'default', launchActivity: 'default' },
        actions: [
          { title: 'Taken', pressAction: { id: 'taken' } },
          { title: 'Snooze', pressAction: { id: 'snooze' } },
          { title: 'Skip', pressAction: { id: 'skip' } },
        ],
      },
      ios: {
        categoryId: DOSE_CATEGORY_ID,
        sound: options.soundEnabled ? ALARM_SOUND_IOS : undefined,
        interruptionLevel: IOS_CRITICAL_ALERTS_ENTITLED ? 'critical' : 'timeSensitive',
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: dose.scheduledAt,
      // setAlarmClock is the strongest scheduling Android offers: exempt from
      // Doze and battery optimisation, and the call the system clock app uses.
      alarmManager: { type: AlarmType.SET_ALARM_CLOCK },
    },
  );
}

export async function cancelDose(dose: Dose): Promise<void> {
  const id = dose.notificationId ?? dose.id;
  try {
    await notifee.cancelTriggerNotification(id);
    await notifee.cancelNotification(id);
  } catch {
    // Already fired or already cancelled — nothing to undo.
  }
  await doseRepo.setNotificationId(dose.id, null);
}

export async function cancelAll(): Promise<void> {
  await notifee.cancelAllNotifications();
}

/**
 * Rebuilds the rolling window.
 *
 * Cancels everything currently armed and re-arms a fair slice of the soonest
 * unresolved doses, across every profile on the device. Cancel-then-rearm
 * rather than a diff because the set is small, the operation is idempotent,
 * and a diff that drifts out of sync would silently stop alarming a patient —
 * the one failure this app must not have.
 *
 * Deliberately profile-agnostic: it arms doses for everyone, not just whoever
 * is selected in the UI. Switching profiles is a view change and must never
 * silence another profile's alarms.
 */
export async function refreshScheduledNotifications(
  prefs: ReminderNotificationPrefs,
): Promise<{ scheduled: number; truncated: boolean }> {
  await configure();

  const permission = await getPermissionState();
  if (permission !== 'granted') {
    return { scheduled: 0, truncated: false };
  }

  await notifee.cancelTriggerNotifications();

  // Pull a pool wider than the budget so the fair split has something to
  // choose between; comparing the two tells us whether anything was left out.
  const pool = await doseRepo.upcoming(NOTIFICATION_BUDGET * 4 + 1);
  const window = allocateFairly(pool, NOTIFICATION_BUDGET);
  const truncated = pool.length > window.length;

  let scheduled = 0;
  for (const dose of window) {
    const pref = prefs.get(dose.reminderId) ?? DEFAULT_ALARM_OPTIONS;
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

/** Arms a one-off alarm for a snoozed dose. */
export async function scheduleSnooze(
  dose: Dose,
  minutes: number,
  options: DoseAlarmOptions,
): Promise<{ scheduledAt: number; notificationId: string | null }> {
  const scheduledAt = Date.now() + minutes * 60_000;
  const id = await scheduleDose({ ...dose, scheduledAt }, options);
  return { scheduledAt, notificationId: id };
}

export const DEFAULT_ACTION = 'default';

function readEvent(event: Event): { doseId: string; action: string } | null {
  const doseId = event.detail.notification?.data?.doseId;
  if (typeof doseId !== 'string') return null;
  return { doseId, action: event.detail.pressAction?.id ?? DEFAULT_ACTION };
}

/**
 * Taps and action presses while the app is running.
 *
 * Notifee splits these in two: `onForegroundEvent` returns an unsubscribe
 * function, while background presses must be registered once at module scope
 * before the app mounts — see `src/notifications/background.ts`.
 */
export function addResponseListener(
  handler: (doseId: string, action: string) => void,
): { remove: () => void } {
  const unsubscribe = notifee.onForegroundEvent((event) => {
    if (event.type !== EventType.PRESS && event.type !== EventType.ACTION_PRESS) return;
    const parsed = readEvent(event);
    if (parsed) handler(parsed.doseId, parsed.action);
  });
  return { remove: unsubscribe };
}

/** Fires when an alarm is delivered, so the rolling window can be topped up. */
export function addReceivedListener(
  handler: (doseId: string) => void,
): { remove: () => void } {
  const unsubscribe = notifee.onForegroundEvent((event) => {
    if (event.type !== EventType.DELIVERED) return;
    const parsed = readEvent(event);
    if (parsed) handler(parsed.doseId);
  });
  return { remove: unsubscribe };
}

export { allocateFairly } from './allocation';

/**
 * The dose whose alarm launched the app, if any.
 *
 * A full-screen intent starts the main activity, not a route — so without
 * this, an alarm firing on the lock screen would open the app on the Today
 * tab, leaving the patient to work out which dose was ringing.
 */
export async function getInitialAlarmDoseId(): Promise<string | null> {
  const initial = await notifee.getInitialNotification();
  const doseId = initial?.notification?.data?.doseId;
  return typeof doseId === 'string' ? doseId : null;
}
