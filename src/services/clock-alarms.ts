/**
 * Ringing reminders through the phone's own Clock app.
 *
 * In this mode the Clock app does the ringing: its own alarm screen, sound,
 * volume and snooze, exactly as for a wake-up alarm. This app keeps a silent
 * notification at each dose time so Taken / Skip can still be recorded — see
 * `ringsInClock` in `src/notifications/service.ts`.
 *
 * The limit to design around: Android lets an app create Clock alarms but
 * never read, change or delete them. So this module keeps its own record of
 * what it has added, adds what is missing, and hands the user a list of the
 * ones to delete when a schedule changes.
 */

import { isClockAvailable, setClockAlarm, showClockAlarms } from '../../modules/clock-alarms';
import i18n from '../i18n';
import {
  patients as patientRepo,
  reminders as reminderRepo,
  settings as settingsRepo,
} from '../db/repositories';
import {
  clockAlarmKey,
  diffClockAlarms,
  planClockAlarms,
  type ClockAlarm,
  type ClockReminder,
} from '../scheduling/clock-plan';
import { todayIn } from '../scheduling/timezone';

export type AlarmStyle = 'app' | 'clock';

const ALARM_STYLE_KEY = 'alarmStyle';
const CREATED_KEY = 'clockAlarms.created';

export { isClockAvailable, showClockAlarms };

export async function getAlarmStyle(): Promise<AlarmStyle> {
  const stored = await settingsRepo.get(ALARM_STYLE_KEY);
  return stored === 'clock' && isClockAvailable() ? 'clock' : 'app';
}

export async function setAlarmStyle(style: AlarmStyle): Promise<void> {
  await settingsRepo.set(ALARM_STYLE_KEY, style);
}

async function readCreated(): Promise<ClockAlarm[]> {
  const raw = await settingsRepo.get(CREATED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ClockAlarm[];
  } catch {
    return [];
  }
}

async function writeCreated(alarms: ClockAlarm[]): Promise<void> {
  await settingsRepo.set(CREATED_KEY, JSON.stringify(alarms));
}

/**
 * What the Clock app is shown when it rings. Person first, as everywhere
 * else: a caregiver answering a Clock alarm has no other context.
 */
function labelFor(patientName: string, medicationName: string, eye: 'left' | 'right' | 'both') {
  return `${patientName} · ${medicationName} (${i18n.t(`eye.${eye}`)})`;
}

/** Every Clock alarm the current reminders call for, across all profiles. */
export async function desiredClockAlarms(): Promise<ClockAlarm[]> {
  const all: ClockAlarm[] = [];
  for (const patient of await patientRepo.list()) {
    const reminders = await reminderRepo.listForPatient(patient.id);
    const input: ClockReminder[] = reminders.map((r) => ({
      spec: r,
      label: labelFor(patient.name, r.medicationName, r.eye),
      vibrate: r.vibrateEnabled,
      silent: !r.soundEnabled,
    }));
    all.push(...planClockAlarms(input, todayIn(patient.timezone)));
  }
  return all;
}

export type ClockStatus = {
  /** Needed but not yet added to the Clock app. */
  toAdd: ClockAlarm[];
  /** Added earlier, no longer needed: the user has to delete these. */
  stale: ClockAlarm[];
};

export async function getClockStatus(): Promise<ClockStatus> {
  return diffClockAlarms(await desiredClockAlarms(), await readCreated());
}

/**
 * Adds every missing alarm to the Clock app.
 *
 * One at a time, recording each as it succeeds, so a failure partway leaves
 * an accurate record and the next attempt picks up where this one stopped.
 */
export async function addMissingToClock(): Promise<ClockStatus> {
  const { toAdd } = await getClockStatus();
  let created = await readCreated();
  for (const alarm of toAdd) {
    await setClockAlarm(alarm);
    created = [...created, alarm];
    await writeCreated(created);
  }
  return getClockStatus();
}

/** Called once the user confirms they have deleted the stale alarms by hand. */
export async function forgetStaleClockAlarms(): Promise<void> {
  const { stale } = await getClockStatus();
  const staleKeys = new Set(stale.map(clockAlarmKey));
  const created = await readCreated();
  await writeCreated(created.filter((a) => !staleKeys.has(clockAlarmKey(a))));
}
