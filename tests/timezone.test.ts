import { describe, expect, it } from 'vitest';

import { hhmmToMinutes } from '../src/scheduling/engine';
import {
  addDays,
  localToUtc,
  todayIn,
  utcToLocalDate,
  utcToLocalMinute,
} from '../src/scheduling/timezone';

const KOLKATA = 'Asia/Kolkata';
const LONDON = 'Europe/London';
const NEW_YORK = 'America/New_York';

describe('local wall clock to UTC', () => {
  it('applies the +05:30 India offset', () => {
    const utc = localToUtc('2026-08-10', hhmmToMinutes('09:00'), KOLKATA);
    expect(new Date(utc).toISOString()).toBe('2026-08-10T03:30:00.000Z');
  });

  it('handles a half-hour offset at midnight without slipping a day', () => {
    const utc = localToUtc('2026-08-10', 0, KOLKATA);
    expect(new Date(utc).toISOString()).toBe('2026-08-09T18:30:00.000Z');
    // The instant belongs to the 10th locally even though it is the 9th in UTC.
    expect(utcToLocalDate(utc, KOLKATA)).toBe('2026-08-10');
  });

  it('applies British Summer Time in July and GMT in January', () => {
    expect(new Date(localToUtc('2026-07-15', hhmmToMinutes('09:00'), LONDON)).toISOString()).toBe(
      '2026-07-15T08:00:00.000Z',
    );
    expect(new Date(localToUtc('2026-01-15', hhmmToMinutes('09:00'), LONDON)).toISOString()).toBe(
      '2026-01-15T09:00:00.000Z',
    );
  });
});

describe('round trips', () => {
  it('returns the same wall clock it was given', () => {
    const cases: Array<[string, string, string]> = [
      ['2026-08-10', '09:00', KOLKATA],
      ['2026-01-01', '00:00', KOLKATA],
      ['2026-12-31', '23:59', LONDON],
      ['2026-06-15', '14:30', NEW_YORK],
    ];

    for (const [date, time, zone] of cases) {
      const utc = localToUtc(date, hhmmToMinutes(time), zone);
      expect(utcToLocalDate(utc, zone)).toBe(date);
      expect(utcToLocalMinute(utc, zone)).toBe(hhmmToMinutes(time));
    }
  });
});

describe('daylight saving transitions', () => {
  it('does not lose a dose in the spring-forward gap', () => {
    // 2026-03-08, US Eastern: 02:00 jumps to 03:00, so 02:30 does not exist.
    const utc = localToUtc('2026-03-08', hhmmToMinutes('02:30'), NEW_YORK);
    expect(Number.isFinite(utc)).toBe(true);
    // It must resolve to a real instant on that same local day.
    expect(utcToLocalDate(utc, NEW_YORK)).toBe('2026-03-08');
  });

  it('fires an ambiguous fall-back time exactly once', () => {
    // 2026-11-01, US Eastern: 01:30 happens twice. We must pick one instant.
    const utc = localToUtc('2026-11-01', hhmmToMinutes('01:30'), NEW_YORK);
    expect(utcToLocalDate(utc, NEW_YORK)).toBe('2026-11-01');
    expect(utcToLocalMinute(utc, NEW_YORK)).toBe(hhmmToMinutes('01:30'));
  });

  it('keeps a normal morning dose at the same wall-clock time across a transition', () => {
    // The patient's 09:00 dose stays 09:00 either side of the DST boundary,
    // even though the UTC instant shifts by an hour.
    const before = localToUtc('2026-03-07', hhmmToMinutes('09:00'), NEW_YORK);
    const after = localToUtc('2026-03-09', hhmmToMinutes('09:00'), NEW_YORK);
    expect(utcToLocalMinute(before, NEW_YORK)).toBe(hhmmToMinutes('09:00'));
    expect(utcToLocalMinute(after, NEW_YORK)).toBe(hhmmToMinutes('09:00'));
    // 2 days apart in wall clock, but 47 hours in real time.
    expect(after - before).toBe(47 * 60 * 60 * 1000);
  });
});

describe('date arithmetic', () => {
  it('adds and subtracts days across month and year boundaries', () => {
    expect(addDays('2026-08-10', 1)).toBe('2026-08-11');
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2026-08-10', 0)).toBe('2026-08-10');
  });

  it('crosses a leap day correctly', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01');
  });

  it('reports today in a given zone', () => {
    // 2026-08-10T20:00Z is already the 11th in India (+05:30).
    const instant = Date.parse('2026-08-10T20:00:00.000Z');
    expect(todayIn(KOLKATA, instant)).toBe('2026-08-11');
    expect(todayIn(LONDON, instant)).toBe('2026-08-10');
  });
});
