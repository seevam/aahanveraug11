import { describe, expect, it } from 'vitest';

import {
  bestStreak,
  currentStreak,
  summarise,
  summariseByDay,
  summariseByMedication,
  type DoseRecord,
  type DoseStatus,
} from '../src/scheduling/adherence';

let seq = 0;
function rec(status: DoseStatus, medicationName = 'Timolol', localDate = '2026-08-10') {
  seq += 1;
  return {
    id: `d${seq}`,
    reminderId: 'r1',
    medicationName,
    scheduledAt: Date.parse(`${localDate}T08:00:00.000Z`),
    status,
    actedAt: status === 'taken' ? Date.parse(`${localDate}T08:01:00.000Z`) : null,
    localDate,
  };
}

describe('adherence rate', () => {
  it('is null when nothing has been evaluated yet', () => {
    const summary = summarise([rec('pending'), rec('pending')]);
    expect(summary.rate).toBeNull();
    expect(summary.outstanding).toBe(2);
    expect(summary.evaluated).toBe(0);
  });

  it('excludes future pending doses from the denominator', () => {
    // A new user with one taken dose and a week of pending ones is at 100%,
    // not 12% — they have not had the chance to miss anything yet.
    const doses = [rec('taken'), ...Array.from({ length: 7 }, () => rec('pending'))];
    expect(summarise(doses).rate).toBe(100);
  });

  it('excludes still-snoozed doses, which are not yet resolved', () => {
    const summary = summarise([rec('taken'), rec('snoozed')]);
    expect(summary.rate).toBe(100);
    expect(summary.outstanding).toBe(1);
  });

  it('counts skipped doses against the patient', () => {
    // A deliberate skip is still a dose the eye did not receive.
    const summary = summarise([rec('taken'), rec('skipped')]);
    expect(summary.rate).toBe(50);
    expect(summary.evaluated).toBe(2);
  });

  it('counts missed doses against the patient', () => {
    expect(summarise([rec('taken'), rec('taken'), rec('taken'), rec('missed')]).rate).toBe(75);
  });

  it('rounds to one decimal place', () => {
    const doses = [rec('taken'), rec('taken'), rec('missed')];
    expect(summarise(doses).rate).toBe(66.7);
  });

  it('reports 0 when every evaluated dose was missed', () => {
    expect(summarise([rec('missed'), rec('missed')]).rate).toBe(0);
  });

  it('handles an empty list', () => {
    const summary = summarise([]);
    expect(summary).toEqual({
      taken: 0,
      missed: 0,
      skipped: 0,
      outstanding: 0,
      evaluated: 0,
      rate: null,
    });
  });
});

describe('per-medication breakdown', () => {
  it('surfaces the worst-adhered medication first', () => {
    const doses: DoseRecord[] = [
      rec('taken', 'Latanoprost'),
      rec('taken', 'Latanoprost'),
      rec('taken', 'Timolol'),
      rec('missed', 'Timolol'),
      rec('missed', 'Brimonidine'),
      rec('missed', 'Brimonidine'),
    ];
    const breakdown = summariseByMedication(doses);
    expect(breakdown.map((b) => b.medicationName)).toEqual([
      'Brimonidine',
      'Timolol',
      'Latanoprost',
    ]);
    expect(breakdown[0]?.rate).toBe(0);
    expect(breakdown[2]?.rate).toBe(100);
  });

  it('sorts medications with no evaluated doses to the end', () => {
    const doses: DoseRecord[] = [rec('missed', 'Timolol'), rec('pending', 'Latanoprost')];
    const breakdown = summariseByMedication(doses);
    expect(breakdown[0]?.medicationName).toBe('Timolol');
    expect(breakdown[1]?.rate).toBeNull();
  });
});

describe('streaks', () => {
  const day = (date: string, taken: number, missed: number) =>
    summariseByDay([
      ...Array.from({ length: taken }, () => rec('taken', 'Timolol', date)),
      ...Array.from({ length: missed }, () => rec('missed', 'Timolol', date)),
    ])[0]!;

  it('counts consecutive perfect days back from the most recent', () => {
    const days = [day('2026-08-08', 2, 0), day('2026-08-09', 2, 0), day('2026-08-10', 2, 0)];
    expect(currentStreak(days)).toBe(3);
  });

  it('breaks the streak on a day with a miss', () => {
    const days = [day('2026-08-08', 2, 0), day('2026-08-09', 1, 1), day('2026-08-10', 2, 0)];
    expect(currentStreak(days)).toBe(1);
  });

  it('does not let a day with nothing scheduled break a streak', () => {
    // A reminder that only runs on weekdays should not punish the patient
    // for the weekend.
    const days = [
      day('2026-08-08', 2, 0),
      { date: '2026-08-09', ...summarise([]) },
      day('2026-08-10', 2, 0),
    ];
    expect(currentStreak(days)).toBe(2);
  });

  it('finds the longest run in the range', () => {
    const days = [
      day('2026-08-05', 1, 0),
      day('2026-08-06', 1, 0),
      day('2026-08-07', 1, 0),
      day('2026-08-08', 0, 1),
      day('2026-08-09', 1, 0),
      day('2026-08-10', 1, 0),
    ];
    expect(bestStreak(days)).toBe(3);
    expect(currentStreak(days)).toBe(2);
  });

  it('is zero when there is no history', () => {
    expect(currentStreak([])).toBe(0);
    expect(bestStreak([])).toBe(0);
  });
});

describe('per-day breakdown', () => {
  it('groups and sorts chronologically', () => {
    const doses = [
      rec('taken', 'Timolol', '2026-08-11'),
      rec('missed', 'Timolol', '2026-08-10'),
      rec('taken', 'Timolol', '2026-08-10'),
    ];
    const days = summariseByDay(doses);
    expect(days.map((d) => d.date)).toEqual(['2026-08-10', '2026-08-11']);
    expect(days[0]?.rate).toBe(50);
    expect(days[1]?.rate).toBe(100);
  });
});
