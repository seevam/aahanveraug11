import { describe, expect, it } from 'vitest';

import { clockAlarmKey, diffClockAlarms, planClockAlarms, type ClockReminder } from '../src/scheduling/clock-plan';
import { hhmmToMinutes } from '../src/scheduling/engine';
import { ALL_WEEKDAYS, type ReminderSpec, type Weekday } from '../src/scheduling/types';

/**
 * Reminders become alarms in the phone's own Clock app. A Clock alarm is just
 * "this time, on these weekdays, forever", so the plan must reproduce the
 * dose times the app itself would use — including the 6-minute gap.
 */

const TODAY = '2026-10-21'; // a Wednesday
const EVERY_DAY = [1, 2, 3, 4, 5, 6, 7];

function reminder(id: string, times: string[], overrides: Partial<ReminderSpec> = {}): ClockReminder {
  return {
    spec: {
      id,
      patientId: 'p1',
      medicationName: id,
      dosage: '1 drop',
      eye: 'both',
      config: { mode: 'times', minutes: times.map(hhmmToMinutes) },
      daysOfWeek: ALL_WEEKDAYS,
      startDate: '2026-01-01',
      endDate: null,
      active: true,
      ...overrides,
    },
    label: `Asha · ${id}`,
    vibrate: true,
    silent: false,
  };
}

const at = (alarms: ReturnType<typeof planClockAlarms>) =>
  alarms.map((a) => `${String(a.hour).padStart(2, '0')}:${String(a.minute).padStart(2, '0')} ${a.label}`);

describe('planClockAlarms', () => {
  it('makes one repeating alarm per dose time', () => {
    const alarms = planClockAlarms([reminder('Timolol', ['08:00', '20:00'])], TODAY);
    expect(at(alarms)).toEqual(['08:00 Asha · Timolol', '20:00 Asha · Timolol']);
    expect(alarms.every((a) => a.days.join() === EVERY_DAY.join())).toBe(true);
  });

  it('keeps the 6-minute gap between different drops', () => {
    const alarms = planClockAlarms(
      [reminder('Timolol', ['08:00']), reminder('Latanoprost', ['08:00'])],
      TODAY,
    );
    expect(at(alarms)).toEqual(['08:00 Asha · Latanoprost', '08:06 Asha · Timolol']);
  });

  it('only repeats on the reminder’s own weekdays, in Calendar numbering', () => {
    const weekdays: Weekday[] = [1, 3, 5]; // Mon, Wed, Fri
    const [alarm] = planClockAlarms([reminder('Timolol', ['09:00'], { daysOfWeek: weekdays })], TODAY);
    expect(alarm?.days).toEqual([2, 4, 6]);
  });

  it('splits a time that shifts only on some days into separate alarms', () => {
    // Latanoprost only on Mondays pushes Timolol to 08:06 on Mondays alone.
    const alarms = planClockAlarms(
      [
        reminder('Timolol', ['08:00']),
        reminder('Latanoprost', ['08:00'], { daysOfWeek: [1] }),
      ],
      TODAY,
    );
    const timolol = alarms.filter((a) => a.label.endsWith('Timolol'));
    expect(timolol.map((a) => [a.hour, a.minute, a.days])).toEqual(
      expect.arrayContaining([
        [8, 0, [1, 3, 4, 5, 6, 7]],
        [8, 6, [2]],
      ]),
    );
  });

  it('skips inactive and ended reminders', () => {
    const alarms = planClockAlarms(
      [
        reminder('Paused', ['08:00'], { active: false }),
        reminder('Finished', ['09:00'], { endDate: '2026-10-20' }),
        reminder('Running', ['10:00'], { endDate: '2026-12-31' }),
      ],
      TODAY,
    );
    expect(at(alarms)).toEqual(['10:00 Asha · Running']);
  });

  it('plans a reminder that starts later as if it had started', () => {
    const alarms = planClockAlarms([reminder('Later', ['07:30'], { startDate: '2027-02-01' })], TODAY);
    expect(at(alarms)).toEqual(['07:30 Asha · Later']);
  });
});

describe('diffClockAlarms', () => {
  const a = planClockAlarms([reminder('Timolol', ['08:00', '20:00'])], TODAY);

  it('adds everything the first time', () => {
    expect(diffClockAlarms(a, [])).toEqual({ toAdd: a, stale: [] });
  });

  it('adds nothing when the Clock app is up to date', () => {
    expect(diffClockAlarms(a, a)).toEqual({ toAdd: [], stale: [] });
  });

  it('reports a moved time as one to add and one to delete', () => {
    const moved = planClockAlarms([reminder('Timolol', ['08:00', '21:00'])], TODAY);
    const { toAdd, stale } = diffClockAlarms(moved, a);
    expect(at(toAdd)).toEqual(['21:00 Asha · Timolol']);
    expect(at(stale)).toEqual(['20:00 Asha · Timolol']);
  });

  it('treats a sound change as a different alarm', () => {
    const quiet = a.map((alarm) => ({ ...alarm, silent: true }));
    expect(clockAlarmKey(quiet[0]!)).not.toEqual(clockAlarmKey(a[0]!));
    expect(diffClockAlarms(quiet, a).stale).toHaveLength(2);
  });
});
