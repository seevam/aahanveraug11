import { describe, expect, it } from 'vitest';

import { resolveConflicts, resolveDay } from '../src/scheduling/conflict';
import { generateAll, hhmmToMinutes, minutesToHHMM } from '../src/scheduling/engine';
import { ALL_WEEKDAYS, type GeneratedDose, type ReminderSpec } from '../src/scheduling/types';

function dose(
  reminderId: string,
  medicationName: string,
  time: string,
  date = '2026-08-10',
): GeneratedDose {
  return { reminderId, medicationName, date, requestedMinute: hhmmToMinutes(time) };
}

function at(doses: { scheduledMinute: number }[]): string[] {
  return doses.map((d) => minutesToHHMM(d.scheduledMinute));
}

describe('the 5-minute washout gap', () => {
  it('leaves a single dose untouched', () => {
    const { resolved } = resolveDay([dose('a', 'Timolol', '08:00')]);
    expect(at(resolved)).toEqual(['08:00']);
    expect(resolved[0]?.shiftedByMinutes).toBe(0);
  });

  it('leaves well-spaced doses untouched', () => {
    const { resolved } = resolveDay([
      dose('a', 'Timolol', '08:00'),
      dose('b', 'Latanoprost', '09:00'),
    ]);
    expect(at(resolved)).toEqual(['08:00', '09:00']);
    expect(resolved.every((d) => d.shiftedByMinutes === 0)).toBe(true);
  });

  it('separates two different drops scheduled at the same minute', () => {
    const { resolved } = resolveDay([
      dose('a', 'Timolol', '08:00'),
      dose('b', 'Latanoprost', '08:00'),
    ]);
    expect(at(resolved)).toEqual(['08:00', '08:06']);
  });

  it('separates drops that are close but not identical', () => {
    const { resolved } = resolveDay([
      dose('a', 'Timolol', '08:00'),
      dose('b', 'Latanoprost', '08:02'),
    ]);
    expect(at(resolved)).toEqual(['08:00', '08:06']);
    expect(resolved[1]?.shiftedByMinutes).toBe(4);
  });

  it('cascades across four drops at the same time', () => {
    const { resolved } = resolveDay([
      dose('a', 'Timolol', '08:00'),
      dose('b', 'Latanoprost', '08:00'),
      dose('c', 'Brimonidine', '08:00'),
      dose('d', 'Dorzolamide', '08:00'),
    ]);
    expect(at(resolved)).toEqual(['08:00', '08:06', '08:12', '08:18']);
  });

  it('preserves the order the patient asked for', () => {
    const { resolved } = resolveDay([
      dose('first', 'A', '08:00'),
      dose('second', 'B', '08:01'),
      dose('third', 'C', '08:02'),
    ]);
    expect(resolved.map((d) => d.reminderId)).toEqual(['first', 'second', 'third']);
    expect(at(resolved)).toEqual(['08:00', '08:06', '08:12']);
  });

  it('honours a custom gap', () => {
    const { resolved } = resolveDay(
      [dose('a', 'Timolol', '08:00'), dose('b', 'Latanoprost', '08:00')],
      { gapMinutes: 15 },
    );
    expect(at(resolved)).toEqual(['08:00', '08:15']);
  });

  it('does not force a gap between doses of the same reminder', () => {
    // One reminder firing 5 doses 1 minute apart is that reminder's own
    // business — the washout rule is about *different* drops.
    const doses = [
      dose('a', 'Saline', '08:00'),
      dose('a', 'Saline', '08:01'),
      dose('a', 'Saline', '08:02'),
    ];
    const { resolved } = resolveDay(doses);
    expect(at(resolved)).toEqual(['08:00', '08:01', '08:02']);
  });

  it('still separates two different reminders that share a medication name', () => {
    // Two prescriptions typed with the same free-text name are still two
    // bottles going into the eye; spacing them is the safe direction.
    const { resolved } = resolveDay([
      dose('a', 'Timolol', '08:00'),
      dose('b', 'Timolol', '08:00'),
    ]);
    expect(at(resolved)).toEqual(['08:00', '08:06']);
  });
});

describe('infeasible schedules', () => {
  it('reports a dose pushed further than the allowed shift', () => {
    // Ten drops all at 08:00 would put the last at 08:45; cap the shift at 20.
    const doses = Array.from({ length: 10 }, (_, i) => dose(`r${i}`, `Drug${i}`, '08:00'));
    const { resolved, infeasible } = resolveDay(doses, { maxShiftMinutes: 20 });

    expect(resolved).toHaveLength(4); // 08:00, 08:06, 08:12, 08:18
    expect(infeasible).toHaveLength(6);
    expect(infeasible[0]?.reason).toBe('shift-too-large');
    expect(infeasible[0]?.medicationName).toBe('Drug4');
  });

  it('reports a dose pushed past midnight rather than wrapping it', () => {
    const doses = [
      dose('a', 'A', '23:55'),
      dose('b', 'B', '23:55'),
      dose('c', 'C', '23:55'),
    ];
    const { resolved, infeasible } = resolveDay(doses);
    expect(at(resolved)).toEqual(['23:55']);
    expect(infeasible.map((i) => i.reason)).toEqual(['past-midnight', 'past-midnight']);
  });

  it('an infeasible dose does not block the doses after it', () => {
    const doses = [
      dose('a', 'A', '08:00'),
      dose('b', 'B', '08:00'),
      dose('c', 'C', '14:00'),
    ];
    const { resolved, infeasible } = resolveDay(doses, { maxShiftMinutes: 2 });
    expect(infeasible).toHaveLength(1);
    expect(at(resolved)).toEqual(['08:00', '14:00']);
  });
});

describe('resolution across days', () => {
  it('treats each day independently', () => {
    const doses = [
      dose('a', 'A', '08:00', '2026-08-10'),
      dose('b', 'B', '08:00', '2026-08-10'),
      dose('a', 'A', '08:00', '2026-08-11'),
      dose('b', 'B', '08:00', '2026-08-11'),
    ];
    const { resolved } = resolveConflicts(doses);
    expect(at(resolved)).toEqual(['08:00', '08:06', '08:00', '08:06']);
  });

  it('never shifts a dose across a midnight boundary into the next day', () => {
    const doses = [dose('a', 'A', '23:59', '2026-08-10'), dose('b', 'B', '23:59', '2026-08-10')];
    const { resolved, infeasible } = resolveConflicts(doses);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.date).toBe('2026-08-10');
    expect(infeasible[0]?.reason).toBe('past-midnight');
  });

  it('lists only the doses that actually moved as shifted', () => {
    const doses = [
      dose('a', 'A', '08:00'),
      dose('b', 'B', '08:00'),
      dose('c', 'C', '20:00'),
    ];
    const { shifted } = resolveConflicts(doses);
    expect(shifted).toHaveLength(1);
    expect(shifted[0]?.medicationName).toBe('B');
  });

  it('is idempotent — resolving an already-resolved day changes nothing', () => {
    const doses = [dose('a', 'A', '08:00'), dose('b', 'B', '08:00'), dose('c', 'C', '08:00')];
    const first = resolveConflicts(doses);
    const second = resolveConflicts(
      first.resolved.map((d) => ({
        reminderId: d.reminderId,
        medicationName: d.medicationName,
        date: d.date,
        requestedMinute: d.scheduledMinute,
      })),
    );
    expect(at(second.resolved)).toEqual(at(first.resolved));
    expect(second.shifted).toHaveLength(0);
  });
});

describe('end to end: a realistic glaucoma regimen', () => {
  function spec(id: string, name: string, times: string[]): ReminderSpec {
    return {
      id,
      patientId: 'p1',
      medicationName: name,
      dosage: '1 drop',
      eye: 'both',
      config: { mode: 'times', minutes: times.map(hhmmToMinutes) },
      daysOfWeek: ALL_WEEKDAYS,
      startDate: '2026-08-01',
      endDate: null,
      active: true,
    };
  }

  it('spaces three drops that all want 08:00 and 20:00', () => {
    const specs = [
      spec('r1', 'Latanoprost', ['20:00']),
      spec('r2', 'Timolol', ['08:00', '20:00']),
      spec('r3', 'Brimonidine', ['08:00', '20:00']),
    ];

    const generated = generateAll(specs, '2026-08-10', '2026-08-10');
    const { resolved, infeasible } = resolveConflicts(generated);

    expect(infeasible).toHaveLength(0);
    expect(at(resolved)).toEqual(['08:00', '08:06', '20:00', '20:06', '20:12']);

    // Every pair of adjacent doses is at least 5 minutes apart.
    for (let i = 1; i < resolved.length; i += 1) {
      const gap = resolved[i]!.scheduledMinute - resolved[i - 1]!.scheduledMinute;
      expect(gap).toBeGreaterThanOrEqual(6);
    }
  });
});
