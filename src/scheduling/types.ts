/** Domain types for schedule generation. Pure data — no React, no SQLite. */

/** Minutes since local midnight. 0 = 00:00, 1439 = 23:59. */
export type MinuteOfDay = number;

/** ISO weekday numbering used throughout: 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const ALL_WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export type ScheduleMode = 'interval' | 'count' | 'times';

/** "Every N minutes between start and end." */
export type IntervalConfig = {
  mode: 'interval';
  /** Local time of the first dose, minutes since midnight. */
  startMinute: MinuteOfDay;
  /** Latest local time a dose may fall on, inclusive. */
  endMinute: MinuteOfDay;
  /** Gap between consecutive doses, in minutes. Must be >= 1. */
  intervalMinutes: number;
};

/** "N doses, M minutes apart, starting at T." */
export type CountConfig = {
  mode: 'count';
  startMinute: MinuteOfDay;
  /** Total doses per active day. Must be >= 1. */
  count: number;
  /** Gap between consecutive doses, in minutes. Must be >= 1. */
  gapMinutes: number;
};

/** "At exactly these local times." */
export type TimesConfig = {
  mode: 'times';
  /** Local times, minutes since midnight. Order is irrelevant; duplicates are collapsed. */
  minutes: MinuteOfDay[];
};

export type ScheduleConfig = IntervalConfig | CountConfig | TimesConfig;

export type Eye = 'left' | 'right' | 'both';

/** A reminder as the engine sees it. */
export type ReminderSpec = {
  id: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  eye: Eye;
  config: ScheduleConfig;
  /** Days this reminder is active. Empty is treated as "no days" (generates nothing). */
  daysOfWeek: Weekday[];
  /** Inclusive local start date, `yyyy-MM-dd`. */
  startDate: string;
  /** Inclusive local end date, `yyyy-MM-dd`. Null means open-ended. */
  endDate: string | null;
  active: boolean;
};

/** One generated dose, before conflict resolution. */
export type GeneratedDose = {
  reminderId: string;
  medicationName: string;
  /** Local calendar date this dose belongs to, `yyyy-MM-dd`. */
  date: string;
  /** Local time, minutes since midnight, as the schedule asked for it. */
  requestedMinute: MinuteOfDay;
};

/** A dose after conflict resolution. */
export type ResolvedDose = GeneratedDose & {
  /** Local time after shifting, minutes since midnight. */
  scheduledMinute: MinuteOfDay;
  /** How far this dose moved, in minutes. 0 when untouched. */
  shiftedByMinutes: number;
};

export type ValidationIssue = {
  code:
    | 'interval-too-small'
    | 'interval-window-invalid'
    | 'count-too-small'
    | 'count-gap-too-small'
    | 'count-overflows-day'
    | 'times-empty'
    | 'times-out-of-range'
    | 'no-days-selected'
    | 'date-range-invalid';
  /** Values for the i18n string of the same name. */
  params?: Record<string, string | number>;
};

export const MINUTES_PER_DAY = 1440;

/**
 * Ophthalmology guidance: consecutive drops need a gap or the second washes
 * out the first. Five minutes is the common published minimum; this app uses
 * six, a deliberate minute of headroom so a patient who is slightly slow with
 * the second bottle still clears the washout window.
 */
export const DEFAULT_GAP_MINUTES = 6;

/**
 * How far a dose may be pushed by conflict resolution before we stop and tell
 * the user the schedule is impossible rather than silently moving a 9am dose
 * to lunchtime.
 */
export const DEFAULT_MAX_SHIFT_MINUTES = 60;
