/**
 * The three things a patient can do about a dose, in one place so the Today
 * screen, the alarm screen and the notification action buttons all behave
 * identically.
 */

import {
  doses as doseRepo,
  patients as patientRepo,
  reminders as reminderRepo,
  type Dose,
} from '../db/repositories';
import { cancelDose, scheduleSnooze } from '../notifications/service';
import { getAlarmStyle } from './clock-alarms';
import { findSnoozeSlot, isSnoozable } from '../scheduling/snooze';
import { DEFAULT_GAP_MINUTES } from '../scheduling/types';

export type DoseActionResult =
  | { ok: true; status: 'taken' | 'skipped' }
  | { ok: true; status: 'snoozed'; until: number; remaining: number }
  | { ok: false; reason: 'not-found' | 'snooze-limit-reached' | 'not-due-yet' };

export async function markTaken(doseId: string): Promise<DoseActionResult> {
  const dose = await doseRepo.get(doseId);
  if (!dose) return { ok: false, reason: 'not-found' };

  await cancelDose(dose);
  await doseRepo.setStatus(doseId, 'taken', { actedAt: Date.now() });
  return { ok: true, status: 'taken' };
}

export async function markSkipped(doseId: string): Promise<DoseActionResult> {
  const dose = await doseRepo.get(doseId);
  if (!dose) return { ok: false, reason: 'not-found' };

  await cancelDose(dose);
  await doseRepo.setStatus(doseId, 'skipped', { actedAt: Date.now() });
  return { ok: true, status: 'skipped' };
}

/** How far ahead to look for other drops a snooze might collide with. */
const SNOOZE_LOOKAHEAD_MS = 24 * 60 * 60_000;

/**
 * Snoozes a dose by its reminder's configured interval.
 *
 * Only a dose that is already due can be snoozed — one whose alarm has rung.
 * Snoozing something still hours away is a postponement the schedule never
 * agreed to, so it is refused here as well as hidden in the UI.
 *
 * The snooze limit exists so a dose cannot be deferred indefinitely — once it
 * is reached the dose can only be taken or skipped, which keeps the adherence
 * record honest.
 *
 * The snoozed time is pushed later if needed so it stays a full washout gap
 * away from the patient's other drops, exactly as scheduled doses are.
 */
export async function snooze(doseId: string): Promise<DoseActionResult> {
  const dose = await doseRepo.get(doseId);
  if (!dose) return { ok: false, reason: 'not-found' };

  const now = Date.now();
  if (!isSnoozable(dose, now)) return { ok: false, reason: 'not-due-yet' };

  const reminder = await reminderRepo.get(dose.reminderId);
  const snoozeMinutes = reminder?.snoozeMinutes ?? 10;
  const snoozeLimit = reminder?.snoozeLimit ?? 3;

  if (dose.snoozeCount >= snoozeLimit) {
    return { ok: false, reason: 'snooze-limit-reached' };
  }

  await cancelDose(dose);

  // Carry the profile name through, or the snoozed alarm comes back without
  // the one piece of context a caregiver needs to act on it.
  const patient = await patientRepo.get(dose.patientId);

  const earliest = now + snoozeMinutes * 60_000;
  const occupied = await doseRepo.occupiedTimes(
    dose.patientId,
    dose.id,
    earliest - DEFAULT_GAP_MINUTES * 60_000,
    earliest + SNOOZE_LOOKAHEAD_MS,
  );
  const slot = findSnoozeSlot(earliest, occupied);

  const { scheduledAt, notificationId } = await scheduleSnooze(dose, slot, {
    soundEnabled: reminder?.soundEnabled ?? true,
    vibrateEnabled: reminder?.vibrateEnabled ?? true,
    patientName: patient?.name ?? '',
    ringsInClock: (await getAlarmStyle()) === 'clock',
  });

  await doseRepo.setStatus(doseId, 'snoozed', {
    actedAt: now,
    snoozeCount: dose.snoozeCount + 1,
    scheduledAt,
  });
  await doseRepo.setNotificationId(doseId, notificationId);

  return {
    ok: true,
    status: 'snoozed',
    until: scheduledAt,
    remaining: snoozeLimit - (dose.snoozeCount + 1),
  };
}

/** Reverts a dose to pending, for the undo affordance on the Today screen. */
export async function undoAction(doseId: string): Promise<void> {
  const dose = await doseRepo.get(doseId);
  if (!dose) return;
  await doseRepo.setStatus(doseId, 'pending', { actedAt: null, snoozeCount: dose.snoozeCount });
}

export function canAct(dose: Dose): boolean {
  return dose.status === 'pending' || dose.status === 'snoozed';
}
