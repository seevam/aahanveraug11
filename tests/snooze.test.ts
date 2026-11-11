import { describe, expect, it } from 'vitest';

import { findSnoozeSlot, isSnoozable } from '../src/scheduling/snooze';

const MIN = 60_000;
const T0 = Date.UTC(2026, 10, 11, 8, 0); // 08:00
const at = (minutes: number) => T0 + minutes * MIN;

describe('isSnoozable', () => {
  it('is false before the dose is due — the alarm has not rung yet', () => {
    expect(isSnoozable({ status: 'pending', scheduledAt: at(30) }, at(0))).toBe(false);
    expect(isSnoozable({ status: 'pending', scheduledAt: at(1) }, at(0))).toBe(false);
  });

  it('is true from the moment it is due', () => {
    expect(isSnoozable({ status: 'pending', scheduledAt: at(0) }, at(0))).toBe(true);
    expect(isSnoozable({ status: 'pending', scheduledAt: at(-5) }, at(0))).toBe(true);
  });

  it('applies to a snoozed dose again only once its new time arrives', () => {
    expect(isSnoozable({ status: 'snoozed', scheduledAt: at(10) }, at(0))).toBe(false);
    expect(isSnoozable({ status: 'snoozed', scheduledAt: at(10) }, at(10))).toBe(true);
  });

  it('is false once the dose has been answered or missed', () => {
    for (const status of ['taken', 'skipped', 'missed'] as const) {
      expect(isSnoozable({ status, scheduledAt: at(-5) }, at(0))).toBe(false);
    }
  });
});

describe('findSnoozeSlot', () => {
  it('keeps the requested time when nothing is nearby', () => {
    expect(findSnoozeSlot(at(10), [at(60), at(120)])).toBe(at(10));
  });

  it('keeps the requested time when no other drops exist', () => {
    expect(findSnoozeSlot(at(10), [])).toBe(at(10));
  });

  it('pushes past a drop that lands inside the gap', () => {
    // Snooze lands at 08:10; another drop is at 08:12.
    expect(findSnoozeSlot(at(10), [at(12)])).toBe(at(18));
  });

  it('pushes past a drop that is just before the requested time', () => {
    // Another drop at 08:07, snooze would land at 08:10 — only 3 minutes after.
    expect(findSnoozeSlot(at(10), [at(7)])).toBe(at(13));
  });

  it('allows exactly the gap, on either side', () => {
    expect(findSnoozeSlot(at(10), [at(16)])).toBe(at(10)); // 6 before it
    expect(findSnoozeSlot(at(10), [at(4)])).toBe(at(10)); // 6 after it
  });

  it('is blocked one minute inside the gap', () => {
    expect(findSnoozeSlot(at(10), [at(15)])).toBe(at(21));
    expect(findSnoozeSlot(at(10), [at(5)])).toBe(at(11));
  });

  it('keeps going through a chain of drops', () => {
    // 08:12 pushes to 08:18, which is inside 08:20's gap, which pushes to 08:26.
    expect(findSnoozeSlot(at(10), [at(12), at(20)])).toBe(at(26));
  });

  it('does not depend on the order the drops are given in', () => {
    expect(findSnoozeSlot(at(10), [at(20), at(12)])).toBe(at(26));
  });

  it('never returns a time closer than the gap to any drop', () => {
    const others = [at(3), at(9), at(14), at(22), at(23), at(40)];
    const slot = findSnoozeSlot(at(10), others);
    for (const other of others) {
      expect(Math.abs(slot - other)).toBeGreaterThanOrEqual(6 * MIN);
    }
    expect(slot).toBeGreaterThanOrEqual(at(10));
  });

  it('honours a different gap', () => {
    expect(findSnoozeSlot(at(10), [at(12)], 10)).toBe(at(22));
  });
});
