/**
 * Snooze rules, kept pure so they can be tested without the database.
 *
 * Two rules, both about not letting a snooze quietly break the schedule:
 *
 *  1. A dose can only be snoozed once it is due — that is, once its alarm has
 *     rung. Snoozing something hours away is not "snoozing", it is a
 *     postponement the schedule never agreed to.
 *  2. A snoozed dose still obeys the washout gap. Moving it to "now + 10
 *     minutes" must not land it 2 minutes from the next drop.
 */

import type { DoseStatus } from './adherence';
import { DEFAULT_GAP_MINUTES } from './types';

const MINUTE_MS = 60_000;

/** A dose can be snoozed once it is due, and only while it is still unanswered. */
export function isSnoozable(
  dose: { status: DoseStatus; scheduledAt: number },
  now: number,
): boolean {
  return (dose.status === 'pending' || dose.status === 'snoozed') && dose.scheduledAt <= now;
}

/**
 * The first moment at or after `earliest` that is at least `gapMinutes` away
 * from every time in `occupied`.
 *
 * `occupied` is when the patient's other drops are scheduled — or, for ones
 * already taken, when they were actually taken, since that is when the washout
 * clock started. A snooze only ever moves later: moving earlier than the
 * patient asked for would defeat the point of snoozing.
 *
 * Exactly `gapMinutes` apart is allowed, matching the conflict resolver.
 */
export function findSnoozeSlot(
  earliest: number,
  occupied: readonly number[],
  gapMinutes: number = DEFAULT_GAP_MINUTES,
): number {
  const gap = gapMinutes * MINUTE_MS;
  let candidate = earliest;

  // Ascending order lets a single pass settle it: the candidate only ever
  // moves forward, and every time it moves it lands clear of the time that
  // pushed it, so nothing already passed can become a conflict again.
  for (const time of [...occupied].sort((a, b) => a - b)) {
    if (candidate > time - gap && candidate < time + gap) {
      candidate = time + gap;
    }
  }
  return candidate;
}
