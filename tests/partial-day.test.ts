import { describe, expect, it } from 'vitest';

import { dropBeforeCutoff, generateAll, hhmmToMinutes, minutesToHHMM } from '../src/scheduling/engine';
import { resolveConflicts } from '../src/scheduling/conflict';
import { ALL_WEEKDAYS, type ReminderSpec } from '../src/scheduling/types';

/**
 * The bug: creating a reminder partway through the day back-filled the morning
 * and the missed-dose sweep immediately marked every back-filled dose as
 * missed — doses for a reminder that did not exist yet.
 */

function spec(id: string, name: string, overrides: Partial<ReminderSpec> = {}): ReminderSpec {
  return {
    id,
    patientId: 'p1',
    medicationName: name,
    dosage: '1 drop',
    eye: 'both',
    config: { mode: 'times', minutes: [hhmmToMinutes('08:00')] },
    daysOfWeek: ALL_WEEKDAYS,
    startDate: '2026-10-21',
    endDate: null,
    active: true,
    ...overrides,
  };
}

const TODAY = '2026-10-21';
const TOMORROW = '2026-10-22';

function timesOn(doses: Array<{ date: string; scheduledMinute: number }>, date: string): string[] {
  return doses.filter((d) => d.date === date).map((d) => minutesToHHMM(d.scheduledMinute));
}

describe('dropBeforeCutoff', () => {
  const doses = [
    { date: TODAY, scheduledMinute: hhmmToMinutes('08:00') },
    { date: TODAY, scheduledMinute: hhmmToMinutes('16:00') },
    { date: TODAY, scheduledMinute: hhmmToMinutes('19:00') },
    { date: TOMORROW, scheduledMinute: hhmmToMinutes('08:00') },
  ];

  it('keeps only today’s remaining doses', () => {
    const kept = dropBeforeCutoff(doses, TODAY, hhmmToMinutes('16:00'));
    expect(timesOn(kept, TODAY)).toEqual(['16:00', '19:00']);
  });

  it('never touches later days', () => {
    const kept = dropBeforeCutoff(doses, TODAY, hhmmToMinutes('23:00'));
    expect(timesOn(kept, TODAY)).toEqual([]);
    expect(timesOn(kept, TOMORROW)).toEqual(['08:00']);
  });

  it('keeps a dose falling exactly on the cutoff minute — it is due now', () => {
    const kept = dropBeforeCutoff(doses, TODAY, hhmmToMinutes('16:00'));
    expect(timesOn(kept, TODAY)).toContain('16:00');
  });

  it('keeps everything when the cutoff is before the first dose', () => {
    expect(dropBeforeCutoff(doses, TODAY, 0)).toHaveLength(4);
  });
});

describe('creating a reminder partway through the day', () => {
  it('hourly 08:00–19:00 set up at 16:00 starts at 16:00, not 08:00', () => {
    const reminder = spec('r1', 'Timolol', {
      config: {
        mode: 'interval',
        startMinute: hhmmToMinutes('08:00'),
        endMinute: hhmmToMinutes('19:00'),
        intervalMinutes: 60,
      },
    });

    const generated = generateAll([reminder], TODAY, TOMORROW);
    const { resolved } = resolveConflicts(generated);
    const kept = dropBeforeCutoff(resolved, TODAY, hhmmToMinutes('16:00'));

    expect(timesOn(kept, TODAY)).toEqual(['16:00', '17:00', '18:00', '19:00']);
    // Tomorrow is untouched — the full day is still scheduled.
    expect(timesOn(kept, TOMORROW)).toEqual([
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
    ]);
  });

  it('twice daily 08:00 and 19:00 set up at 17:00 keeps only the evening dose', () => {
    const reminder = spec('r1', 'Latanoprost', {
      config: { mode: 'times', minutes: [hhmmToMinutes('08:00'), hhmmToMinutes('19:00')] },
    });

    const generated = generateAll([reminder], TODAY, TODAY);
    const { resolved } = resolveConflicts(generated);
    const kept = dropBeforeCutoff(resolved, TODAY, hhmmToMinutes('17:00'));

    expect(timesOn(kept, TODAY)).toEqual(['19:00']);
  });

  it('generates nothing for today when every dose has already passed', () => {
    const reminder = spec('r1', 'Timolol', {
      config: { mode: 'times', minutes: [hhmmToMinutes('08:00')] },
    });

    const generated = generateAll([reminder], TODAY, TODAY);
    const { resolved } = resolveConflicts(generated);
    expect(dropBeforeCutoff(resolved, TODAY, hhmmToMinutes('20:00'))).toEqual([]);
  });

  it('still spaces surviving doses against the earlier ones that were dropped', () => {
    // Three drops all want 16:00. The cutoff is 16:06, so the first two are
    // dropped — but the third must still sit at 16:12, the position the
    // washout gap gave it, not slide back to 16:00.
    const reminders = [
      spec('r1', 'A', { config: { mode: 'times', minutes: [hhmmToMinutes('16:00')] } }),
      spec('r2', 'B', { config: { mode: 'times', minutes: [hhmmToMinutes('16:00')] } }),
      spec('r3', 'C', { config: { mode: 'times', minutes: [hhmmToMinutes('16:00')] } }),
    ];

    const generated = generateAll(reminders, TODAY, TODAY);
    const { resolved } = resolveConflicts(generated);
    expect(timesOn(resolved, TODAY)).toEqual(['16:00', '16:06', '16:12']);

    const kept = dropBeforeCutoff(resolved, TODAY, hhmmToMinutes('16:06'));
    expect(timesOn(kept, TODAY)).toEqual(['16:06', '16:12']);
  });
});
