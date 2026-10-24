/**
 * Turns reminders into alarms for the phone's own Clock app.
 *
 * Pure — no React, no native calls — so the mapping can be tested.
 *
 * A Clock alarm is a time of day plus a set of weekdays, repeating forever.
 * That is a narrower model than ours, so the plan is computed the same way
 * doses are: generate a full week, run the same conflict resolution (so the
 * 6-minute gap between drops holds), then fold each reminder's times back
 * into "this time, on these weekdays".
 */

import { resolveConflicts } from './conflict';
import { generateAll, weekdayOf } from './engine';
import { addDays } from './timezone';
import {
  DEFAULT_GAP_MINUTES,
  DEFAULT_MAX_SHIFT_MINUTES,
  type MinuteOfDay,
  type ReminderSpec,
} from './types';

export type ClockAlarm = {
  hour: number;
  minute: number;
  /** Shown by the Clock app when it rings. */
  label: string;
  /** java.util.Calendar numbering, ascending: Sunday = 1 … Saturday = 7. */
  days: number[];
  vibrate: boolean;
  silent: boolean;
};

export type ClockReminder = {
  spec: ReminderSpec;
  label: string;
  vibrate: boolean;
  silent: boolean;
};

/**
 * One patient's reminders as Clock alarms.
 *
 * Clock alarms repeat forever, so date ranges collapse: a reminder that has
 * ended gets no alarms, and one that starts later is planned as if it had
 * started (its alarms are only created when the user next updates the Clock
 * app, which the app prompts for).
 */
export function planClockAlarms(reminders: ClockReminder[], today: string): ClockAlarm[] {
  const live = reminders.filter(
    (r) => r.spec.active && (r.spec.endDate === null || r.spec.endDate >= today),
  );
  if (live.length === 0) return [];

  const specs = live.map((r) => ({ ...r.spec, startDate: today, endDate: null }));
  const byId = new Map(live.map((r) => [r.spec.id, r]));

  const { resolved } = resolveConflicts(generateAll(specs, today, addDays(today, 6)), {
    gapMinutes: DEFAULT_GAP_MINUTES,
    maxShiftMinutes: DEFAULT_MAX_SHIFT_MINUTES,
  });

  // reminder → minute → weekdays it lands on at that minute.
  const grouped = new Map<string, Map<MinuteOfDay, Set<number>>>();
  for (const dose of resolved) {
    const minutes = grouped.get(dose.reminderId) ?? new Map<MinuteOfDay, Set<number>>();
    const days = minutes.get(dose.scheduledMinute) ?? new Set<number>();
    days.add(weekdayOf(dose.date) + 1);
    minutes.set(dose.scheduledMinute, days);
    grouped.set(dose.reminderId, minutes);
  }

  const alarms: ClockAlarm[] = [];
  for (const [reminderId, minutes] of grouped) {
    const reminder = byId.get(reminderId);
    if (!reminder) continue;
    for (const [minute, days] of minutes) {
      alarms.push({
        hour: Math.floor(minute / 60),
        minute: minute % 60,
        label: reminder.label,
        days: [...days].sort((a, b) => a - b),
        vibrate: reminder.vibrate,
        silent: reminder.silent,
      });
    }
  }

  return alarms.sort(
    (a, b) => a.hour - b.hour || a.minute - b.minute || a.label.localeCompare(b.label),
  );
}

/** Identity of a Clock alarm, for telling which ones already exist. */
export function clockAlarmKey(alarm: ClockAlarm): string {
  return [alarm.hour, alarm.minute, alarm.days.join(','), alarm.label, alarm.vibrate, alarm.silent].join('|');
}

/**
 * What to add to the Clock app, and what the user should delete from it.
 *
 * `created` is what this app has added before. Android cannot read the Clock
 * app's alarms back, so this record is the only knowledge there is.
 */
export function diffClockAlarms(
  desired: ClockAlarm[],
  created: ClockAlarm[],
): { toAdd: ClockAlarm[]; stale: ClockAlarm[] } {
  const desiredKeys = new Set(desired.map(clockAlarmKey));
  const createdKeys = new Set(created.map(clockAlarmKey));
  return {
    toAdd: desired.filter((a) => !createdKeys.has(clockAlarmKey(a))),
    stale: created.filter((a) => !desiredKeys.has(clockAlarmKey(a))),
  };
}
