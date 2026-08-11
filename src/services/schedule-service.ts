/**
 * The orchestration layer: turns reminders into stored doses and armed
 * notifications.
 *
 * Flow, and the reason for each step:
 *
 *   materialise  generate the next N days of doses from every active reminder,
 *                resolve washout conflicts across the whole patient (not per
 *                reminder — that is the entire point), and INSERT OR IGNORE so
 *                re-running never disturbs a dose already acted on.
 *   sweep        close out doses that went unanswered past the grace period.
 *   refresh      re-arm the rolling notification window.
 *
 * `syncAll` runs all three and is called on app start, on resume, after any
 * reminder edit, and after any dose action.
 */

import {
  DEFAULT_GAP_MINUTES,
  DEFAULT_MAX_SHIFT_MINUTES,
  type ReminderSpec,
} from '../scheduling/types';
import { generateAll } from '../scheduling/engine';
import { resolveConflicts, type InfeasibleDay } from '../scheduling/conflict';
import { addDays, localToUtc, todayIn } from '../scheduling/timezone';
import { doses as doseRepo, patients as patientRepo, reminders as reminderRepo } from '../db/repositories';
import type { Patient, Reminder } from '../db/repositories';
import {
  MISSED_GRACE_MINUTES,
  refreshScheduledNotifications,
  type ReminderNotificationPrefs,
} from '../notifications/service';

/**
 * How many days ahead doses are written to the database. Larger than the
 * notification window on purpose — the Today screen and the adherence report
 * read from the database, not from armed notifications.
 */
export const MATERIALISE_DAYS = 21;

export type SyncResult = {
  inserted: number;
  missed: number;
  scheduled: number;
  /** True when there are more doses than the notification budget allows. */
  truncated: boolean;
  infeasible: InfeasibleDay[];
};

function toSpec(reminder: Reminder): ReminderSpec {
  return {
    id: reminder.id,
    patientId: reminder.patientId,
    medicationName: reminder.medicationName,
    dosage: reminder.dosage,
    eye: reminder.eye,
    config: reminder.config,
    daysOfWeek: reminder.daysOfWeek,
    startDate: reminder.startDate,
    endDate: reminder.endDate,
    active: reminder.active,
  };
}

/**
 * Generates and stores doses for one patient over the materialisation window.
 *
 * Conflict resolution runs across *all* of the patient's reminders at once,
 * which is what makes the 5-minute gap meaningful — resolving each reminder in
 * isolation would never detect a collision between two different drops.
 */
export async function materialisePatient(
  patient: Patient,
  options: { days?: number; now?: number } = {},
): Promise<{ inserted: number; infeasible: InfeasibleDay[] }> {
  const now = options.now ?? Date.now();
  const days = options.days ?? MATERIALISE_DAYS;

  const all = await reminderRepo.listForPatient(patient.id);
  const active = all.filter((r) => r.active);
  if (active.length === 0) return { inserted: 0, infeasible: [] };

  const fromDate = todayIn(patient.timezone, now);
  const toDate = addDays(fromDate, days);

  const generated = generateAll(active.map(toSpec), fromDate, toDate);
  const { resolved, infeasible } = resolveConflicts(generated, {
    gapMinutes: DEFAULT_GAP_MINUTES,
    maxShiftMinutes: DEFAULT_MAX_SHIFT_MINUTES,
  });

  const byId = new Map(active.map((r) => [r.id, r]));

  const rows = resolved.flatMap((dose) => {
    const reminder = byId.get(dose.reminderId);
    if (!reminder) return [];
    return [
      {
        reminderId: dose.reminderId,
        patientId: patient.id,
        medicationName: reminder.medicationName,
        dosage: reminder.dosage,
        eye: reminder.eye,
        localDate: dose.date,
        scheduledAt: localToUtc(dose.date, dose.scheduledMinute, patient.timezone),
        requestedAt: localToUtc(dose.date, dose.requestedMinute, patient.timezone),
        shiftedBy: dose.shiftedByMinutes,
      },
    ];
  });

  const inserted = await doseRepo.insertMany(rows);
  return { inserted, infeasible };
}

/** Notification preferences keyed by reminder, for the rolling window. */
async function collectPrefs(allPatients: Patient[]): Promise<ReminderNotificationPrefs> {
  const prefs: ReminderNotificationPrefs = new Map();
  for (const patient of allPatients) {
    const list = await reminderRepo.listForPatient(patient.id);
    for (const reminder of list) {
      prefs.set(reminder.id, {
        soundEnabled: reminder.soundEnabled,
        vibrateEnabled: reminder.vibrateEnabled,
      });
    }
  }
  return prefs;
}

/** Materialise + sweep + re-arm, for every patient on the device. */
export async function syncAll(options: { now?: number } = {}): Promise<SyncResult> {
  const now = options.now ?? Date.now();
  const allPatients = await patientRepo.list();

  let inserted = 0;
  const infeasible: InfeasibleDay[] = [];

  for (const patient of allPatients) {
    const result = await materialisePatient(patient, { now });
    inserted += result.inserted;
    infeasible.push(...result.infeasible);
  }

  const missed = await doseRepo.sweepMissed(MISSED_GRACE_MINUTES, now);
  const prefs = await collectPrefs(allPatients);
  const { scheduled, truncated } = await refreshScheduledNotifications(prefs);

  return { inserted, missed, scheduled, truncated, infeasible };
}

/**
 * Regenerates one reminder after an edit.
 *
 * Future *pending* doses are deleted and rebuilt; anything already taken,
 * skipped or missed stays exactly as it was. Editing a schedule must never
 * rewrite the adherence history a doctor is going to read.
 */
export async function resyncReminder(reminderId: string): Promise<SyncResult> {
  const reminder = await reminderRepo.get(reminderId);
  if (!reminder) return { inserted: 0, missed: 0, scheduled: 0, truncated: false, infeasible: [] };

  const patient = await patientRepo.get(reminder.patientId);
  if (!patient) return { inserted: 0, missed: 0, scheduled: 0, truncated: false, infeasible: [] };

  // The whole patient is rebuilt, not just this reminder: changing one
  // medication's times can change where every other drop has to sit.
  await doseRepo.deleteFuturePendingForPatient(patient.id);
  return syncAll();
}

/** Rebuilds a patient's future doses, e.g. after deleting a reminder. */
export async function resyncPatient(patientId: string): Promise<SyncResult> {
  await doseRepo.deleteFuturePendingForPatient(patientId);
  return syncAll();
}

/**
 * A dry run for the create/edit form: what the schedule would look like on a
 * representative day, including any washout shifts, without writing anything.
 */
export function previewSchedule(
  candidate: ReminderSpec,
  existing: ReminderSpec[],
  date: string,
): {
  candidateDoses: Array<{ minute: number; shifted: number }>;
  otherDoses: Array<{ minute: number; medicationName: string }>;
  infeasible: InfeasibleDay[];
} {
  const generated = generateAll([...existing, candidate], date, date);
  const { resolved, infeasible } = resolveConflicts(generated);

  return {
    candidateDoses: resolved
      .filter((d) => d.reminderId === candidate.id)
      .map((d) => ({ minute: d.scheduledMinute, shifted: d.shiftedByMinutes })),
    otherDoses: resolved
      .filter((d) => d.reminderId !== candidate.id)
      .map((d) => ({ minute: d.scheduledMinute, medicationName: d.medicationName })),
    infeasible,
  };
}
