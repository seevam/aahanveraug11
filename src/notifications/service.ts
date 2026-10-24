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
  AndroidNotificationSetting,
  AndroidVisibility,
  AuthorizationStatus,
  EventType,
  TriggerType,
  type Event,
} from '@notifee/react-native';
import Constants from 'expo-constants';
import { startActivityAsync } from 'expo-intent-launcher';
import { Platform } from 'react-native';

import { doses as doseRepo, type Dose } from '../db/repositories';
import i18n from '../i18n';
import { allocateFairly } from './allocation';
import { ALARM_VIBRATION_PATTERN } from './alarm-pattern';
import alarmChannels from './alarm-channels.json';

type AlarmChannel = { id: string; name: string; sound: boolean; vibrate: boolean };

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
 * suffix.
 *
 * The channels themselves are created natively by `plugins/withAlarmSupport.js`,
 * because only native code can put a channel on the ALARM stream — the one
 * that still rings when the phone is on vibrate or silent. There is one per
 * sound/vibration combination, since on Android 8+ the channel, not the
 * notification, decides both. The list is shared with the plugin.
 */
const ANDROID_CHANNELS: readonly AlarmChannel[] = alarmChannels;

const LEGACY_ANDROID_CHANNEL_IDS = ['dose-reminders', 'dose-alarms-v2', 'dose-alarms-v3'];

export function alarmChannelId(sound: boolean, vibrate: boolean): string {
  const match = ANDROID_CHANNELS.find((c) => c.sound === sound && c.vibrate === vibrate);
  return (match ?? ANDROID_CHANNELS[0]!).id;
}

export const DOSE_CATEGORY_ID = 'dose-reminder';

/** Must match the file copied into res/raw by `plugins/withAlarmSupport.js`. */
const ALARM_SOUND_ANDROID = 'alarm_tone';
const ALARM_SOUND_IOS = 'alarm_tone.wav';

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

/**
 * Checks the alarm channels exist and retires superseded ones.
 *
 * The native side should already have created them. If it has not, Notifee
 * creates them as a fallback — on the notification stream, so they will not
 * ring on vibrate, but a quieter alarm beats none.
 */
export async function configure(): Promise<void> {
  if (configured) return;

  if (Platform.OS === 'android') {
    for (const channel of ANDROID_CHANNELS) {
      if (await notifee.isChannelCreated(channel.id)) continue;
      console.warn(`Alarm channel ${channel.id} missing natively; creating a fallback.`);
      await notifee.createChannel({
        id: channel.id,
        name: channel.name,
        description: 'Rings when an eye drop is due.',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        ...(channel.sound ? { sound: ALARM_SOUND_ANDROID } : {}),
        vibration: channel.vibrate,
        ...(channel.vibrate ? { vibrationPattern: ALARM_VIBRATION_PATTERN } : {}),
        bypassDnd: true,
      });
    }

    for (const legacy of LEGACY_ANDROID_CHANNEL_IDS) {
      await notifee.deleteChannel(legacy).catch(() => {});
    }
  }

  // Only once it has actually worked, so a failure is retried next launch.
  configured = true;
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
 * The sideloaded APK declares USE_EXACT_ALARM, which Android grants at
 * install, so this is normally already allowed. It is kept for a Play build:
 * Google restricts USE_EXACT_ALARM to alarm-clock and calendar apps, and
 * without it Android 14+ starts with exact alarms off. See README.
 */
export async function openAlarmSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await notifee.openAlarmPermissionSettings().catch(() => {});
}

/** Whether Android will fire alarms at the exact minute. Null where it does not apply. */
export async function exactAlarmsAllowed(): Promise<boolean | null> {
  if (Platform.OS !== 'android') return null;
  const { android } = await notifee.getNotificationSettings();
  if (android.alarm === AndroidNotificationSetting.NOT_SUPPORTED) return null;
  return android.alarm === AndroidNotificationSetting.ENABLED;
}

/**
 * Android 14 (API 34) stopped granting full-screen intents at install to
 * anything but calling and alarm-clock apps. Without the grant, the alarm
 * still rings but arrives as a banner instead of taking over the lock screen.
 */
export const NEEDS_FULL_SCREEN_GRANT =
  Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version >= 34;

/**
 * Opens the alarm channel's own settings page.
 *
 * Realme, Oppo, OnePlus and Vivo switch off sound, lock-screen display and
 * pop-up banners for every newly installed app, leaving only a silent entry in
 * the notification shade. Those switches live on this page, and no app can
 * turn them back on itself.
 */
export async function openAlarmSoundSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await notifee.openNotificationSettings(alarmChannelId(true, true)).catch(() => {});
}

/** Whether Android's battery optimisation applies to this app. Null where it does not apply. */
export async function batteryOptimised(): Promise<boolean | null> {
  if (Platform.OS !== 'android') return null;
  return notifee.isBatteryOptimizationEnabled();
}

export async function openBatterySettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await notifee.openBatteryOptimizationSettings().catch(() => {});
}

/**
 * Whether this phone's manufacturer has its own background-app manager —
 * "Auto launch" on Realme/Oppo/Vivo, "Autostart" on Xiaomi — which can stop
 * alarms regardless of Android's own settings. Notifee knows the screens.
 */
export async function hasManufacturerPowerSettings(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const info = await notifee.getPowerManagerInfo();
  return Boolean(info.activity);
}

export async function openManufacturerPowerSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await notifee.openPowerManagerSettings().catch(() => {});
}

/** Opens this app's page under Special app access → Full-screen notifications. */
export async function openFullScreenAlarmSettings(): Promise<void> {
  if (!NEEDS_FULL_SCREEN_GRANT) return;
  try {
    await startActivityAsync('android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT', {
      data: `package:${Constants.expoConfig?.android?.package ?? 'com.eyedropscheduler.app'}`,
    });
  } catch {
    // Some manufacturers remove the screen; the app info page is the next best.
    await notifee.openNotificationSettings().catch(() => {});
  }
}

/**
 * A translated button label. A snooze pressed while the app is closed re-arms
 * the alarm from the background handler, before i18n has been initialised —
 * where `t` would return the raw key — so English is the fallback there.
 */
function label(key: string, fallback: string): string {
  return i18n.isInitialized ? i18n.t(key) : fallback;
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
  /**
   * The phone's Clock app does the ringing (see `src/services/clock-alarms.ts`),
   * so this becomes a silent, dismissible notification that only exists to
   * record Taken / Skip. Ringing here as well would sound every dose twice.
   */
  ringsInClock: boolean;
};

/** Per-reminder alarm settings plus the profile the reminder belongs to. */
export type ReminderNotificationPrefs = Map<string, DoseAlarmOptions>;

const DEFAULT_ALARM_OPTIONS: DoseAlarmOptions = {
  soundEnabled: true,
  vibrateEnabled: true,
  patientName: '',
  ringsInClock: false,
};

/**
 * The strongest AlarmManager call Android will currently accept from us.
 *
 * setAlarmClock is the strongest there is: exempt from Doze and battery
 * optimisation, and the call the system clock app uses. But it is an *exact*
 * alarm, and when the user has not allowed exact alarms — the default after a
 * fresh install on Android 14+ — Notifee does not fail: it prints a warning
 * and schedules nothing at all. So without the grant we fall back to
 * setAndAllowWhileIdle, which still fires in Doze but may be a few minutes
 * late. A late alarm beats a missing one. Every sync re-evaluates this, so
 * granting the permission upgrades every armed alarm on the next resume.
 */
async function strongestAlarmType(): Promise<AlarmType> {
  const exact = await exactAlarmsAllowed().catch(() => null);
  return exact === false ? AlarmType.SET_AND_ALLOW_WHILE_IDLE : AlarmType.SET_ALARM_CLOCK;
}

/**
 * Arms one dose as an alarm. Returns the notification id, or null when the
 * dose is already in the past (nothing to schedule).
 */
export async function scheduleDose(
  dose: Dose,
  options: DoseAlarmOptions,
  alarmType?: AlarmType,
): Promise<string | null> {
  if (dose.scheduledAt <= Date.now()) return null;

  await configure();
  const type = alarmType ?? (await strongestAlarmType());
  // In Clock mode the Clock app rings; this is only the Taken / Skip record.
  const rings = !options.ringsInClock;
  const sound = rings && options.soundEnabled;
  const vibrate = rings && options.vibrateEnabled;

  return notifee.createTriggerNotification(
    {
      // Reusing the dose id means re-arming the same dose replaces its alarm
      // rather than stacking a second one.
      id: dose.id,
      title: title(dose, options.patientName),
      body: body(dose),
      data: { doseId: dose.id, patientId: dose.patientId },
      android: {
        channelId: alarmChannelId(sound, vibrate),
        category: rings ? AndroidCategory.ALARM : AndroidCategory.REMINDER,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        smallIcon: 'ic_launcher',
        // The four properties that make this an alarm rather than a banner.
        ...(rings ? { fullScreenAction: { id: 'dose-alarm', launchActivity: 'default' } } : {}),
        loopSound: sound,
        ongoing: rings,
        autoCancel: false,
        sound: sound ? ALARM_SOUND_ANDROID : undefined,
        vibrationPattern: vibrate ? ALARM_VIBRATION_PATTERN : undefined,
        pressAction: { id: 'default', launchActivity: 'default' },
        actions: [
          { title: label('alarm.taken', 'Taken'), pressAction: { id: 'taken' } },
          { title: label('today.snooze', 'Snooze'), pressAction: { id: 'snooze' } },
          { title: label('common.skip', 'Skip'), pressAction: { id: 'skip' } },
        ],
      },
      ios: {
        categoryId: DOSE_CATEGORY_ID,
        // Omitted rather than `undefined`: Notifee's iOS validator rejects a
        // `sound` key that is present without a string value.
        ...(options.soundEnabled ? { sound: ALARM_SOUND_IOS } : {}),
        interruptionLevel: IOS_CRITICAL_ALERTS_ENTITLED ? 'critical' : 'timeSensitive',
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: dose.scheduledAt,
      alarmManager: { type },
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
  const alarmType = await strongestAlarmType();

  // Pull a pool wider than the budget so the fair split has something to
  // choose between; comparing the two tells us whether anything was left out.
  const pool = await doseRepo.upcoming(NOTIFICATION_BUDGET * 4 + 1);
  const window = allocateFairly(pool, NOTIFICATION_BUDGET);
  const truncated = pool.length > window.length;

  let scheduled = 0;
  for (const dose of window) {
    const pref = prefs.get(dose.reminderId) ?? DEFAULT_ALARM_OPTIONS;
    try {
      const id = await scheduleDose(dose, pref, alarmType);
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

/**
 * The dose whose alarm is on screen right now, if any — the oldest, when
 * several are.
 *
 * Covers what `getInitialAlarmDoseId` cannot: a full-screen alarm that brings
 * an already-running app to the front reports no launch notification and
 * fires no event, so the only reliable signal is what is still displayed.
 * Taken, Snooze and Skip all remove the notification, so anything here is
 * still unanswered.
 */
export async function getRingingDoseId(): Promise<string | null> {
  const displayed = await notifee.getDisplayedNotifications();
  const ringing = displayed
    .map((d) => ({ doseId: d.notification.data?.doseId, at: d.date ?? '' }))
    .filter((d): d is { doseId: string; at: string } => typeof d.doseId === 'string')
    .sort((a, b) => a.at.localeCompare(b.at));
  return ringing[0]?.doseId ?? null;
}
