/**
 * Conflict resolution: the 5-minute washout gap.
 *
 * Two different eye drops instilled together wash each other out, so
 * ophthalmology guidance is a minimum gap — commonly 5 minutes — between
 * different drops. A patient on four drops several times a day cannot plan
 * that by hand, which is the whole reason this app exists.
 *
 * The algorithm, per local day:
 *
 *   walk doses in requested-time order and push each one forward to at least
 *   `previous placed time + gap`.
 *
 * Because we only ever move doses *forward* and we walk in sorted order, the
 * output preserves the order the patient asked for — their 8am drop stays
 * before their 8:02am drop, which matters when a doctor prescribes a sequence.
 *
 * Two deliberate decisions:
 *
 *  - The gap is enforced between doses from *different reminders*, even when
 *    the medication name matches. Two reminders for the same drug at the same
 *    minute is a data-entry mistake, and spacing them is harmless; treating
 *    same-name doses as non-conflicting would let a genuine washout through
 *    whenever two prescriptions were typed with the same free-text name.
 *
 *  - A dose that would be pushed more than `maxShiftMinutes` past its
 *    requested time, or past midnight, makes the day *infeasible*. We report
 *    that in plain language rather than silently relocating a morning dose to
 *    the afternoon. Failing loudly is the safe direction here.
 */

import {
  DEFAULT_GAP_MINUTES,
  DEFAULT_MAX_SHIFT_MINUTES,
  MINUTES_PER_DAY,
  type GeneratedDose,
  type ResolvedDose,
} from './types';

export type ConflictOptions = {
  gapMinutes?: number;
  maxShiftMinutes?: number;
};

export type InfeasibleDay = {
  date: string;
  /** The dose that could not be placed. */
  medicationName: string;
  requestedMinute: number;
  /** Where it would have had to go. */
  attemptedMinute: number;
  reason: 'shift-too-large' | 'past-midnight';
};

export type ConflictResult = {
  /** Every dose that could be placed, sorted by date then final time. */
  resolved: ResolvedDose[];
  /** Subset of `resolved` that had to move. Used to show "moved to 08:05". */
  shifted: ResolvedDose[];
  /** Days the engine could not satisfy. `resolved` excludes their doses. */
  infeasible: InfeasibleDay[];
};

function groupByDate(doses: GeneratedDose[]): Map<string, GeneratedDose[]> {
  const byDate = new Map<string, GeneratedDose[]>();
  for (const dose of doses) {
    const bucket = byDate.get(dose.date);
    if (bucket) {
      bucket.push(dose);
    } else {
      byDate.set(dose.date, [dose]);
    }
  }
  return byDate;
}

/**
 * Resolves one local day. Exported for tests and for the create-reminder
 * preview, which only ever previews a single representative day.
 */
export function resolveDay(
  doses: GeneratedDose[],
  options: ConflictOptions = {},
): { resolved: ResolvedDose[]; infeasible: InfeasibleDay[] } {
  const gap = options.gapMinutes ?? DEFAULT_GAP_MINUTES;
  const maxShift = options.maxShiftMinutes ?? DEFAULT_MAX_SHIFT_MINUTES;

  const ordered = [...doses].sort(
    (a, b) => a.requestedMinute - b.requestedMinute || a.reminderId.localeCompare(b.reminderId),
  );

  const resolved: ResolvedDose[] = [];
  const infeasible: InfeasibleDay[] = [];

  let previousMinute: number | null = null;
  let previousReminderId: string | null = null;

  for (const dose of ordered) {
    let minute = dose.requestedMinute;

    // Only a *different* reminder forces a gap. A single reminder's own doses
    // are spaced by its own config, which validation already floors at 1 min.
    if (
      previousMinute !== null &&
      previousReminderId !== dose.reminderId &&
      minute < previousMinute + gap
    ) {
      minute = previousMinute + gap;
    } else if (previousMinute !== null && minute < previousMinute) {
      // Can only happen if the input was mis-sorted; keep output monotonic.
      minute = previousMinute;
    }

    const shift = minute - dose.requestedMinute;

    if (minute >= MINUTES_PER_DAY) {
      infeasible.push({
        date: dose.date,
        medicationName: dose.medicationName,
        requestedMinute: dose.requestedMinute,
        attemptedMinute: minute,
        reason: 'past-midnight',
      });
      continue;
    }

    if (shift > maxShift) {
      infeasible.push({
        date: dose.date,
        medicationName: dose.medicationName,
        requestedMinute: dose.requestedMinute,
        attemptedMinute: minute,
        reason: 'shift-too-large',
      });
      continue;
    }

    resolved.push({
      ...dose,
      scheduledMinute: minute,
      shiftedByMinutes: shift,
    });

    previousMinute = minute;
    previousReminderId = dose.reminderId;
  }

  return { resolved, infeasible };
}

/**
 * Resolves a whole date range. Days are independent — a dose never shifts
 * across a midnight boundary, so each day is solved on its own.
 */
export function resolveConflicts(
  doses: GeneratedDose[],
  options: ConflictOptions = {},
): ConflictResult {
  const byDate = groupByDate(doses);
  const resolved: ResolvedDose[] = [];
  const infeasible: InfeasibleDay[] = [];

  for (const dayDoses of byDate.values()) {
    const result = resolveDay(dayDoses, options);
    resolved.push(...result.resolved);
    infeasible.push(...result.infeasible);
  }

  resolved.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.scheduledMinute - b.scheduledMinute ||
      a.reminderId.localeCompare(b.reminderId),
  );
  infeasible.sort((a, b) => a.date.localeCompare(b.date) || a.requestedMinute - b.requestedMinute);

  return {
    resolved,
    shifted: resolved.filter((d) => d.shiftedByMinutes > 0),
    infeasible,
  };
}
