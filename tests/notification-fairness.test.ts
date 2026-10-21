import { describe, expect, it } from 'vitest';

import { allocateFairly } from '../src/notifications/allocation';

/**
 * Switching profiles is a view change. It must never silence another
 * profile's alarms — and the subtler way that can happen is the notification
 * budget being eaten by whoever has the most doses.
 */

type Row = { id: string; patientId: string; scheduledAt: number };

/** `count` doses for one patient, one hour apart, offset so order is stable. */
function doses(patientId: string, count: number, startHour = 0): Row[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${patientId}-${i}`,
    patientId,
    scheduledAt: Date.parse(`2026-10-21T00:00:00.000Z`) + (startHour + i) * 3_600_000,
  }));
}

function patientsIn(rows: Row[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.patientId] = (counts[r.patientId] ?? 0) + 1;
  return counts;
}

describe('fair allocation of the notification budget', () => {
  it('gives a single profile the whole budget', () => {
    const chosen = allocateFairly(doses('a', 100), 56);
    expect(chosen).toHaveLength(56);
    expect(patientsIn(chosen)).toEqual({ a: 56 });
  });

  it('splits evenly between two profiles', () => {
    const chosen = allocateFairly([...doses('a', 100), ...doses('b', 100)], 56);
    expect(patientsIn(chosen)).toEqual({ a: 28, b: 28 });
  });

  it('does not let a busy profile crowd out a quiet one', () => {
    // This is the regression. Taking the soonest 56 outright would arm 56 of
    // A's doses (they all start earlier) and none of B's — B's alarms would
    // simply never ring, with nothing in the UI to show it.
    const busy = doses('a', 200, 0);
    const quiet = doses('b', 3, 100);

    const naive = [...busy, ...quiet].sort((x, y) => x.scheduledAt - y.scheduledAt).slice(0, 56);
    expect(patientsIn(naive).b).toBeUndefined();

    const chosen = allocateFairly([...busy, ...quiet], 56);
    expect(patientsIn(chosen).b).toBe(3);
    expect(patientsIn(chosen).a).toBe(53);
  });

  it('gives leftover capacity to whoever can use it', () => {
    const chosen = allocateFairly([...doses('a', 50), ...doses('b', 2)], 56);
    expect(chosen).toHaveLength(52);
    expect(patientsIn(chosen)).toEqual({ a: 50, b: 2 });
  });

  it('picks each profile’s soonest doses, not an arbitrary slice', () => {
    const chosen = allocateFairly([...doses('a', 10), ...doses('b', 10)], 4);
    const forA = chosen.filter((d) => d.patientId === 'a').map((d) => d.id);
    const forB = chosen.filter((d) => d.patientId === 'b').map((d) => d.id);
    expect(forA).toEqual(['a-0', 'a-1']);
    expect(forB).toEqual(['b-0', 'b-1']);
  });

  it('returns the result in chronological order', () => {
    const chosen = allocateFairly([...doses('a', 20), ...doses('b', 20, 5)], 20);
    const times = chosen.map((d) => d.scheduledAt);
    expect(times).toEqual([...times].sort((x, y) => x - y));
  });

  it('handles an empty pool and a zero budget', () => {
    expect(allocateFairly([], 56)).toEqual([]);
    expect(allocateFairly(doses('a', 10), 0)).toEqual([]);
  });

  it('shares between three profiles without starving any', () => {
    const chosen = allocateFairly(
      [...doses('a', 100), ...doses('b', 100), ...doses('c', 100)],
      56,
    );
    const counts = patientsIn(chosen);
    for (const id of ['a', 'b', 'c']) {
      expect(counts[id]).toBeGreaterThanOrEqual(18);
    }
    expect(chosen).toHaveLength(56);
  });
});
