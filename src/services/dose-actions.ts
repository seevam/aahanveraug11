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

export type DoseActionResult =
  | { ok: true; status: 'taken' | 'skipped' }
  | { ok: true; status: 'snoozed'; until: number; remaining: number }
  | { ok: false; reason: 'not-found' | 'snooze-limit-reached' };

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

/**
 * Snoozes a dose by its reminder's configured interval.
 *
 * The snooze limit exists so a dose cannot be deferred indefinitely — once it
 * is reached the dose can only be taken or skipped, which keeps the adherence
 * record honest.
 */
export async function snooze(doseId: string): Promise<DoseActionResult> {
  const dose = await doseRepo.get(doseId);
  if (!dose) return { ok: false, reason: 'not-found' };

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

  const { scheduledAt, notificationId } = await scheduleSnooze(dose, snoozeMinutes, {
    soundEnabled: reminder?.soundEnabled ?? true,
    vibrateEnabled: reminder?.vibrateEnabled ?? true,
    patientName: patient?.name ?? '',
    ringsInClock: (await getAlarmStyle()) === 'clock',
  });

  await doseRepo.setStatus(doseId, 'snoozed', {
    actedAt: Date.now(),
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
