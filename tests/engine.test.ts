import { describe, expect, it } from 'vitest';

import {
  eachDateInclusive,
  generateAll,
  generateForReminder,
  hhmmToMinutes,
  isActiveOn,
  minutesForConfig,
  minutesToHHMM,
  validateConfig,
  validateReminder,
  weekdayOf,
} from '../src/scheduling/engine';
import { ALL_WEEKDAYS, type ReminderSpec, type Weekday } from '../src/scheduling/types';

function reminder(overrides: Partial<ReminderSpec> = {}): ReminderSpec {
  return {
    id: 'r1',
    patientId: 'p1',
    medicationName: 'Timolol',
    dosage: '1 drop',
    eye: 'both',
    config: { mode: 'times', minutes: [hhmmToMinutes('08:00')] },
    daysOfWeek: ALL_WEEKDAYS,
    startDate: '2026-01-01',
    endDate: null,
    active: true,
    ...overrides,
  };
}

describe('time helpers', () => {
  it('round-trips HH:MM through minutes', () => {
    for (const t of ['00:00', '07:05', '12:30', '23:59']) {
      expect(minutesToHHMM(hhmmToMinutes(t))).toBe(t);
    }
  });

  it('identifies weekdays with 0 = Sunday', () => {
    expect(weekdayOf('2026-08-09')).toBe(0); // Sunday
    expect(weekdayOf('2026-08-10')).toBe(1); // Monday
    expect(weekdayOf('2026-08-15')).toBe(6); // Saturday
  });

  it('enumerates an inclusive date range across a month boundary', () => {
    expect(eachDateInclusive('2026-01-30', '2026-02-02')).toEqual([
      '2026-01-30',
      '2026-01-31',
      '2026-02-01',
      '2026-02-02',
    ]);
  });

  it('handles a leap day', () => {
    expect(eachDateInclusive('2028-02-27', '2028-03-01')).toEqual([
      '2028-02-27',
      '2028-02-28',
      '2028-02-29',
      '2028-03-01',
    ]);
  });
});

describe('interval mode', () => {
  it('generates the PRD example: every 2h from 08:00 to 20:00 is 7 doses', () => {
    const minutes = minutesForConfig({
      mode: 'interval',
      startMinute: hhmmToMinutes('08:00'),
      endMinute: hhmmToMinutes('20:00'),
      intervalMinutes: 120,
    });
    expect(minutes.map(minutesToHHMM)).toEqual([
      '08:00',
      '10:00',
      '12:00',
      '14:00',
      '16:00',
      '18:00',
      '20:00',
    ]);
  });

  it('includes a dose landing exactly on the end time', () => {
    const minutes = minutesForConfig({
      mode: 'interval',
      startMinute: hhmmToMinutes('09:00'),
      endMinute: hhmmToMinutes('10:00'),
      intervalMinutes: 30,
    });
    expect(minutes.map(minutesToHHMM)).toEqual(['09:00', '09:30', '10:00']);
  });

  it('excludes a dose that would fall past the end time', () => {
    const minutes = minutesForConfig({
      mode: 'interval',
      startMinute: hhmmToMinutes('09:00'),
      endMinute: hhmmToMinutes('10:00'),
      intervalMinutes: 45,
    });
    expect(minutes.map(minutesToHHMM)).toEqual(['09:00', '09:45']);
  });

  it('yields a single dose when start equals end', () => {
    const minutes = minutesForConfig({
      mode: 'interval',
      startMinute: 600,
      endMinute: 600,
      intervalMinutes: 60,
    });
    expect(minutes).toEqual([600]);
  });

  it('never runs away when the interval is zero or negative', () => {
    expect(
      minutesForConfig({ mode: 'interval', startMinute: 0, endMinute: 1439, intervalMinutes: 0 }),
    ).toEqual([]);
    expect(
      minutesForConfig({ mode: 'interval', startMinute: 0, endMinute: 1439, intervalMinutes: -5 }),
    ).toEqual([]);
  });

  it('rejects an inverted window', () => {
    expect(
      validateConfig({
        mode: 'interval',
        startMinute: hhmmToMinutes('20:00'),
        endMinute: hhmmToMinutes('08:00'),
        intervalMinutes: 60,
      }),
    ).toContainEqual({ code: 'interval-window-invalid' });
  });
});

describe('count mode', () => {
  it('generates the PRD example: 5 times, 10 minutes apart, from 09:00', () => {
    const minutes = minutesForConfig({
      mode: 'count',
      startMinute: hhmmToMinutes('09:00'),
      count: 5,
      gapMinutes: 10,
    });
    expect(minutes.map(minutesToHHMM)).toEqual(['09:00', '09:10', '09:20', '09:30', '09:40']);
  });

  it('flags a run that would spill past midnight', () => {
    const issues = validateConfig({
      mode: 'count',
      startMinute: hhmmToMinutes('23:00'),
      count: 5,
      gapMinutes: 30,
    });
    expect(issues.map((i) => i.code)).toContain('count-overflows-day');
  });

  it('drops rather than wraps the doses that spill past midnight', () => {
    const minutes = minutesForConfig({
      mode: 'count',
      startMinute: hhmmToMinutes('23:00'),
      count: 5,
      gapMinutes: 30,
    });
    expect(minutes.map(minutesToHHMM)).toEqual(['23:00', '23:30']);
  });
});

describe('times mode', () => {
  it('sorts and de-duplicates', () => {
    const minutes = minutesForConfig({
      mode: 'times',
      minutes: [hhmmToMinutes('22:00'), hhmmToMinutes('08:00'), hhmmToMinutes('22:00')],
    });
    expect(minutes.map(minutesToHHMM)).toEqual(['08:00', '22:00']);
  });

  it('rejects an empty list', () => {
    expect(validateConfig({ mode: 'times', minutes: [] })).toContainEqual({ code: 'times-empty' });
  });

  it('rejects out-of-range times', () => {
    expect(validateConfig({ mode: 'times', minutes: [1440] })).toContainEqual({
      code: 'times-out-of-range',
    });
  });
});

describe('active-day rules', () => {
  it('respects the start date', () => {
    const spec = reminder({ startDate: '2026-08-10' });
    expect(isActiveOn(spec, '2026-08-09')).toBe(false);
    expect(isActiveOn(spec, '2026-08-10')).toBe(true);
  });

  it('respects an inclusive end date', () => {
    const spec = reminder({ startDate: '2026-08-01', endDate: '2026-08-10' });
    expect(isActiveOn(spec, '2026-08-10')).toBe(true);
    expect(isActiveOn(spec, '2026-08-11')).toBe(false);
  });

  it('respects days of week', () => {
    const weekdaysOnly: Weekday[] = [1, 2, 3, 4, 5];
    const spec = reminder({ daysOfWeek: weekdaysOnly });
    expect(isActiveOn(spec, '2026-08-10')).toBe(true); // Monday
    expect(isActiveOn(spec, '2026-08-09')).toBe(false); // Sunday
  });

  it('generates nothing when inactive', () => {
    expect(generateForReminder(reminder({ active: false }), '2026-08-10', '2026-08-12')).toEqual(
      [],
    );
  });

  it('generates nothing when no days are selected', () => {
    const spec = reminder({ daysOfWeek: [] });
    expect(generateForReminder(spec, '2026-08-10', '2026-08-16')).toEqual([]);
    expect(validateReminder(spec)).toContainEqual({ code: 'no-days-selected' });
  });

  it('rejects an end date before the start date', () => {
    expect(validateReminder(reminder({ startDate: '2026-08-10', endDate: '2026-08-01' }))).toContainEqual(
      { code: 'date-range-invalid' },
    );
  });
});

describe('generation across a range', () => {
  it('produces one dose per active day', () => {
    const doses = generateForReminder(reminder(), '2026-08-10', '2026-08-12');
    expect(doses).toHaveLength(3);
    expect(doses.map((d) => d.date)).toEqual(['2026-08-10', '2026-08-11', '2026-08-12']);
  });

  it('returns nothing when the range is inverted', () => {
    expect(generateForReminder(reminder(), '2026-08-12', '2026-08-10')).toEqual([]);
  });

  it('sorts a multi-reminder day by time', () => {
    const morning = reminder({
      id: 'a',
      medicationName: 'Latanoprost',
      config: { mode: 'times', minutes: [hhmmToMinutes('08:00')] },
    });
    const evening = reminder({
      id: 'b',
      medicationName: 'Timolol',
      config: { mode: 'times', minutes: [hhmmToMinutes('07:00')] },
    });

    const doses = generateAll([morning, evening], '2026-08-10', '2026-08-10');
    expect(doses.map((d) => minutesToHHMM(d.requestedMinute))).toEqual(['07:00', '08:00']);
  });
});
