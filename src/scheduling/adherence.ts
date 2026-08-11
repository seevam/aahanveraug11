/**
 * Adherence maths.
 *
 * This is what a doctor reads, so the denominator matters more than anything
 * else here. Rules:
 *
 *  - `pending` doses in the future are excluded entirely. Counting a dose the
 *    patient has not had the chance to take yet as a miss would show a brand
 *    new user 0% adherence, which is both wrong and demoralising.
 *  - `skipped` counts against adherence. A deliberate skip is still a dose the
 *    eye did not receive, and hiding it would flatter the number.
 *  - `snoozed` is not terminal — it resolves to taken or missed later — so a
 *    still-snoozed dose is excluded like a pending one.
 */

export type DoseStatus = 'pending' | 'taken' | 'snoozed' | 'skipped' | 'missed';

export type DoseRecord = {
  id: string;
  reminderId: string;
  medicationName: string;
  /** UTC epoch ms. */
  scheduledAt: number;
  status: DoseStatus;
  actedAt: number | null;
};

export type AdherenceSummary = {
  taken: number;
  missed: number;
  skipped: number;
  /** Doses not yet resolved — excluded from the rate. */
  outstanding: number;
  /** Doses counted in the rate: taken + missed + skipped. */
  evaluated: number;
  /** 0–100, rounded to one decimal. Null when nothing is evaluated yet. */
  rate: number | null;
};

export const ADHERENCE_TARGET = 80;

function emptySummary(): AdherenceSummary {
  return { taken: 0, missed: 0, skipped: 0, outstanding: 0, evaluated: 0, rate: null };
}

export function summarise(doses: DoseRecord[]): AdherenceSummary {
  const summary = emptySummary();

  for (const dose of doses) {
    switch (dose.status) {
      case 'taken':
        summary.taken += 1;
        break;
      case 'missed':
        summary.missed += 1;
        break;
      case 'skipped':
        summary.skipped += 1;
        break;
      case 'pending':
      case 'snoozed':
        summary.outstanding += 1;
        break;
    }
  }

  summary.evaluated = summary.taken + summary.missed + summary.skipped;
  summary.rate =
    summary.evaluated === 0 ? null : Math.round((summary.taken / summary.evaluated) * 1000) / 10;

  return summary;
}

export type MedicationBreakdown = AdherenceSummary & {
  medicationName: string;
};

export function summariseByMedication(doses: DoseRecord[]): MedicationBreakdown[] {
  const groups = new Map<string, DoseRecord[]>();
  for (const dose of doses) {
    const bucket = groups.get(dose.medicationName);
    if (bucket) bucket.push(dose);
    else groups.set(dose.medicationName, [dose]);
  }

  return Array.from(groups.entries())
    .map(([medicationName, group]) => ({ medicationName, ...summarise(group) }))
    .sort((a, b) => {
      // Worst adherence first — that is what a doctor needs to see.
      if (a.rate === null) return 1;
      if (b.rate === null) return -1;
      return a.rate - b.rate || a.medicationName.localeCompare(b.medicationName);
    });
}

export type DayBreakdown = {
  /** Local `yyyy-MM-dd`. */
  date: string;
} & AdherenceSummary;

/**
 * Per-day summary. Takes a pre-computed local date per dose so this stays pure
 * and the caller owns timezone conversion.
 */
export function summariseByDay(doses: Array<DoseRecord & { localDate: string }>): DayBreakdown[] {
  const groups = new Map<string, DoseRecord[]>();
  for (const dose of doses) {
    const bucket = groups.get(dose.localDate);
    if (bucket) bucket.push(dose);
    else groups.set(dose.localDate, [dose]);
  }

  return Array.from(groups.entries())
    .map(([date, group]) => ({ date, ...summarise(group) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Consecutive days, counting back from the most recent day with any evaluated
 * dose, where every evaluated dose was taken. Days with nothing scheduled do
 * not break a streak — they are not failures.
 */
export function currentStreak(days: DayBreakdown[]): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    const day = days[i];
    if (!day) break;
    if (day.evaluated === 0) continue;
    if (day.taken === day.evaluated) streak += 1;
    else break;
  }
  return streak;
}

/** Longest run of fully-adherent days in the range. */
export function bestStreak(days: DayBreakdown[]): number {
  let best = 0;
  let run = 0;
  for (const day of days) {
    if (day.evaluated === 0) continue;
    if (day.taken === day.evaluated) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best;
}
