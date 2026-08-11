/**
 * The one place that converts between "09:00 on 2026-03-29 in Asia/Kolkata"
 * and a real UTC instant.
 *
 * Keeping this isolated means the engine and conflict resolver stay pure
 * integer maths, and every DST question has exactly one answer to audit.
 */

import { fromZonedTime, toZonedTime } from 'date-fns-tz';

import { MINUTES_PER_DAY } from './types';
import { formatLocalDate, minutesToHHMM } from './engine';

/** The device's IANA timezone, e.g. `Asia/Kolkata`. */
export function deviceTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && tz.length > 0 ? tz : 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Converts a local wall-clock time in `timeZone` to a UTC epoch (ms).
 *
 * DST behaviour, inherited from date-fns-tz and documented here because it is
 * the sort of thing that silently drops a dose:
 *  - Spring forward: 02:30 on a day where 02:00→03:00 does not exist resolves
 *    forward to the equivalent instant (03:30). The dose still fires.
 *  - Fall back: an ambiguous 01:30 resolves to the *first* (pre-transition)
 *    occurrence, so a dose fires once, not twice.
 * India (the launch market) has no DST, but post-surgical travel is common
 * and the app should not misfire abroad.
 */
export function localToUtc(date: string, minuteOfDay: number, timeZone: string): number {
  const clamped = Math.max(0, Math.min(MINUTES_PER_DAY - 1, Math.round(minuteOfDay)));
  const wallClock = `${date}T${minutesToHHMM(clamped)}:00`;
  return fromZonedTime(wallClock, timeZone).getTime();
}

/** The local `yyyy-MM-dd` for a UTC instant in a given zone. */
export function utcToLocalDate(epochMs: number, timeZone: string): string {
  const zoned = toZonedTime(new Date(epochMs), timeZone);
  return formatLocalDate(
    new Date(Date.UTC(zoned.getFullYear(), zoned.getMonth(), zoned.getDate(), 12)),
  );
}

/** Minutes since local midnight for a UTC instant in a given zone. */
export function utcToLocalMinute(epochMs: number, timeZone: string): number {
  const zoned = toZonedTime(new Date(epochMs), timeZone);
  return zoned.getHours() * 60 + zoned.getMinutes();
}

/** Today's local date in a given zone. */
export function todayIn(timeZone: string, now: number = Date.now()): string {
  return utcToLocalDate(now, timeZone);
}

/** Adds whole days to a `yyyy-MM-dd` string. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const base = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12));
  base.setUTCDate(base.getUTCDate() + days);
  return formatLocalDate(base);
}
