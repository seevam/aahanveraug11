import { describe, expect, it } from 'vitest';

import { reportSubject } from '../src/scheduling/report-subject';

describe('reportSubject', () => {
  it('names the patient', () => {
    expect(reportSubject('Asha')).toBe('Adherence Report: Asha');
  });

  it('keeps names with spaces and non-Latin scripts intact', () => {
    expect(reportSubject('Asha Rao')).toBe('Adherence Report: Asha Rao');
    expect(reportSubject('आशा')).toBe('Adherence Report: आशा');
  });

  it('trims stray whitespace', () => {
    expect(reportSubject('  Asha  ')).toBe('Adherence Report: Asha');
  });

  it('never leaves a dangling colon when there is no name', () => {
    expect(reportSubject('')).toBe('Adherence Report');
    expect(reportSubject('   ')).toBe('Adherence Report');
    expect(reportSubject(null)).toBe('Adherence Report');
    expect(reportSubject(undefined)).toBe('Adherence Report');
  });
});
