import { describe, expect, it } from 'vitest';

import en from '../src/i18n/locales/en';
import hi from '../src/i18n/locales/hi';
import ta from '../src/i18n/locales/ta';

/**
 * Checks that the compiler cannot make. TypeScript already guarantees every
 * language has every key; these catch the mistakes that still type-check.
 */

type Strings = Record<string, Record<string, string>>;
const languages: Record<string, Strings> = { en, hi, ta } as unknown as Record<string, Strings>;

const placeholders = (s: string) => [...s.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort();
const graphemes = (s: string) => [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)].length;
// Labels may use no-break spaces to stop wrapping; compare them as spaces.
const plain = (s: string) => s.replace(/ /g, ' ');

describe.each(['hi', 'ta'])('%s', (code) => {
  const strings = languages[code]!;

  it('has no empty strings', () => {
    for (const [ns, keys] of Object.entries(strings)) {
      for (const [key, value] of Object.entries(keys)) {
        expect(value.trim(), `${ns}.${key}`).not.toBe('');
      }
    }
  });

  it('keeps every {{placeholder}} the English has, and adds none', () => {
    // A dropped {{time}} shows a sentence with a hole in it; an invented one
    // shows the raw "{{tiem}}".
    for (const [ns, keys] of Object.entries(en as unknown as Strings)) {
      for (const [key, value] of Object.entries(keys)) {
        expect(placeholders(strings[ns]![key]!), `${ns}.${key}`).toEqual(placeholders(value));
      }
    }
  });

  it('names the buttons by the words the buttons actually show', () => {
    // Help text that says "tap X" when the button says Y sends people hunting.
    const taken = plain(strings.alarm!.taken!);
    expect(plain(strings.notify!.taken!)).toBe(taken);
    expect(plain(strings.today!.markTaken!)).toBe(taken);
    expect(plain(strings.profile!.ringWithAppBody!)).toContain(taken);
    expect(plain(strings.profile!.ringWithAppBody!)).toContain(plain(strings.notify!.snooze!));
    expect(plain(strings.profile!.ringWithAppBody!)).toContain(plain(strings.notify!.skip!));
    expect(plain(strings.clock!.inSyncBody!)).toContain(taken);
  });

  it('fits a day name on each of the seven day buttons', () => {
    for (const [day, label] of Object.entries(strings.daysShort!)) {
      expect(graphemes(label), `daysShort.${day} = ${label}`).toBeLessThanOrEqual(3);
    }
  });

  it('keeps notification buttons short enough for three to share a row', () => {
    for (const [key, label] of Object.entries(strings.notify!)) {
      expect(graphemes(label), `notify.${key} = ${label}`).toBeLessThanOrEqual(10);
    }
  });
});

describe('Hindi notification label', () => {
  it('keeps the no-break space that stops "ले लिया" wrapping to "ले"', () => {
    expect(hi.notify.taken).toBe('ले लिया');
  });
});
