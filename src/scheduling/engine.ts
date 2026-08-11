/**
 * Schedule generation.
 *
 * Turns a `ReminderSpec` into the local times it wants, for a range of local
 * calendar dates. Everything here is pure and works in local *minutes of day* —
 * no Date objects, no timezones. Conversion to real UTC instants happens later
 * in `timezone.ts`, which is the only place DST is reasoned about.
 */

import {
  MINUTES_PER_DAY,
  type GeneratedDose,
  type MinuteOfDay,
  type ReminderSpec,
  type ScheduleConfig,
  type ValidationIssue,
  type Weekday,
} from './types';

/** Parses `yyyy-MM-dd` into a UTC-noon Date, safe from DST edge cases. */
export function parseLocalDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) {
    throw new Error(`Invalid date string: ${date}`);
  }
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
}

/** Formats a UTC-noon Date back to `yyyy-MM-dd`. */
export function formatLocalDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function weekdayOf(date: string): Weekday {
  return parseLocalDate(date).getUTCDay() as Weekday;
}

/** Inclusive list of `yyyy-MM-dd` strings between two dates. */
export function eachDateInclusive(startDate: string, endDate: string): string[] {
  const out: string[] = [];
  const end = parseLocalDate(endDate).getTime();
  const cursor = parseLocalDate(startDate);
  while (cursor.getTime() <= end) {
    out.push(formatLocalDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export function minutesToHHMM(minute: MinuteOfDay): string {
  const safe = ((minute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = String(Math.floor(safe / 60)).padStart(2, '0');
  const m = String(safe % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export function hhmmToMinutes(value: string): MinuteOfDay {
  const [h, m] = value.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Checks a config is coherent before we try to generate from it.
 * Returns every problem found, so the form can show them all at once.
 */
export function validateConfig(config: ScheduleConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  switch (config.mode) {
    case 'interval': {
      if (config.intervalMinutes < 1) {
        issues.push({ code: 'interval-too-small' });
      }
      if (
        config.startMinute < 0 ||
        config.endMinute >= MINUTES_PER_DAY ||
        config.endMinute < config.startMinute
      ) {
        issues.push({ code: 'interval-window-invalid' });
      }
      break;
    }
    case 'count': {
      if (config.count < 1) {
        issues.push({ code: 'count-too-small' });
      }
      if (config.gapMinutes < 1) {
        issues.push({ code: 'count-gap-too-small' });
      }
      if (config.startMinute < 0 || config.startMinute >= MINUTES_PER_DAY) {
        issues.push({ code: 'times-out-of-range' });
      }
      if (config.count >= 1 && config.gapMinutes >= 1) {
        const last = config.startMinute + (config.count - 1) * config.gapMinutes;
        if (last >= MINUTES_PER_DAY) {
          issues.push({
            code: 'count-overflows-day',
            params: { time: minutesToHHMM(last % MINUTES_PER_DAY) },
          });
        }
      }
      break;
    }
    case 'times': {
      if (config.minutes.length === 0) {
        issues.push({ code: 'times-empty' });
      }
      if (config.minutes.some((m) => m < 0 || m >= MINUTES_PER_DAY)) {
        issues.push({ code: 'times-out-of-range' });
      }
      break;
    }
  }

  return issues;
}

export function validateReminder(spec: ReminderSpec): ValidationIssue[] {
  const issues = validateConfig(spec.config);
  if (spec.daysOfWeek.length === 0) {
    issues.push({ code: 'no-days-selected' });
  }
  if (spec.endDate && spec.endDate < spec.startDate) {
    issues.push({ code: 'date-range-invalid' });
  }
  return issues;
}

/**
 * The local times a config asks for on a single day, sorted and de-duplicated.
 * Doses that would spill past midnight are dropped rather than wrapped —
 * `validateConfig` surfaces that case to the user as `count-overflows-day`.
 */
export function minutesForConfig(config: ScheduleConfig): MinuteOfDay[] {
  let raw: MinuteOfDay[];

  switch (config.mode) {
    case 'interval': {
      if (config.intervalMinutes < 1 || config.endMinute < config.startMinute) {
        return [];
      }
      raw = [];
      for (
        let m = config.startMinute;
        m <= config.endMinute && m < MINUTES_PER_DAY;
        m += config.intervalMinutes
      ) {
        raw.push(m);
      }
      break;
    }
    case 'count': {
      if (config.count < 1 || config.gapMinutes < 1) {
        return [];
      }
      raw = [];
      for (let i = 0; i < config.count; i += 1) {
        const m = config.startMinute + i * config.gapMinutes;
        if (m >= MINUTES_PER_DAY) break;
        raw.push(m);
      }
      break;
    }
    case 'times': {
      raw = config.minutes.filter((m) => m >= 0 && m < MINUTES_PER_DAY);
      break;
    }
  }

  return Array.from(new Set(raw)).sort((a, b) => a - b);
}

/** True when the reminder is meant to fire on this local date. */
export function isActiveOn(spec: ReminderSpec, date: string): boolean {
  if (!spec.active) return false;
  if (date < spec.startDate) return false;
  if (spec.endDate && date > spec.endDate) return false;
  return spec.daysOfWeek.includes(weekdayOf(date));
}

/** Every dose one reminder wants across an inclusive local date range. */
export function generateForReminder(
  spec: ReminderSpec,
  fromDate: string,
  toDate: string,
): GeneratedDose[] {
  if (toDate < fromDate) return [];

  const minutes = minutesForConfig(spec.config);
  if (minutes.length === 0) return [];

  const doses: GeneratedDose[] = [];
  for (const date of eachDateInclusive(fromDate, toDate)) {
    if (!isActiveOn(spec, date)) continue;
    for (const minute of minutes) {
      doses.push({
        reminderId: spec.id,
        medicationName: spec.medicationName,
        date,
        requestedMinute: minute,
      });
    }
  }
  return doses;
}

/**
 * Every dose for a set of reminders, sorted by date then time.
 * The sort is what conflict resolution depends on, so it lives here.
 */
export function generateAll(
  specs: ReminderSpec[],
  fromDate: string,
  toDate: string,
): GeneratedDose[] {
  const all = specs.flatMap((spec) => generateForReminder(spec, fromDate, toDate));
  return all.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.requestedMinute - b.requestedMinute ||
      a.reminderId.localeCompare(b.reminderId),
  );
}
