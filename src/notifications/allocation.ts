/**
 * Budget allocation for the rolling notification window.
 *
 * Pure: no React, no expo-notifications, no native imports — same rule as
 * `src/scheduling`, so it runs under plain Node in the test suite.
 */

/**
 * Shares the notification budget fairly between profiles.
 *
 * Taking the soonest N doses outright looks reasonable until a caregiver adds
 * a second person: a profile on four drops a day would fill the whole window
 * and the other profile's alarms would simply never be armed. Nothing in the
 * UI would show it, and the alarms would just not ring.
 *
 * So deal round-robin — one dose per profile per pass, soonest first within
 * each — until the budget runs out. Every profile is guaranteed its share of
 * the window, and whatever is left over goes to whoever has the most doses.
 *
 * Exported for tests; it is pure.
 */
export function allocateFairly<T extends { patientId: string; scheduledAt: number }>(
  doses: T[],
  budget: number,
): T[] {
  const byPatient = new Map<string, T[]>();
  for (const dose of doses) {
    const bucket = byPatient.get(dose.patientId);
    if (bucket) bucket.push(dose);
    else byPatient.set(dose.patientId, [dose]);
  }

  for (const bucket of byPatient.values()) {
    bucket.sort((a, b) => a.scheduledAt - b.scheduledAt);
  }

  const queues = Array.from(byPatient.values());
  const chosen: T[] = [];
  let round = 0;

  while (chosen.length < budget) {
    let tookAny = false;
    for (const queue of queues) {
      if (chosen.length >= budget) break;
      const dose = queue[round];
      if (dose) {
        chosen.push(dose);
        tookAny = true;
      }
    }
    if (!tookAny) break;
    round += 1;
  }

  return chosen.sort((a, b) => a.scheduledAt - b.scheduledAt);
}
