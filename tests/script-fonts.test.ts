import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  BUNDLED_FONT_NAMES,
  scriptInputFont,
  scriptTextStyle,
  usesScriptFont,
} from '../src/theme/script-fonts';
import { typography } from '../src/theme/tokens';

const root = join(__dirname, '..');

describe('scriptTextStyle', () => {
  it('leaves English on the system font, unchanged', () => {
    expect(scriptTextStyle('en', { fontSize: 17, lineHeight: 24, fontWeight: '600' })).toEqual({
      fontWeight: '600',
      lineHeight: 24,
    });
    expect(scriptTextStyle(undefined, { fontSize: 17, lineHeight: 24 }).lineHeight).toBe(24);
  });

  it('picks the Hind file for each weight, and never asks Android to fake a weight', () => {
    const at = (fontWeight: '400' | '600' | '700' | 'bold' | '500') =>
      scriptTextStyle('hi', { fontSize: 17, lineHeight: 24, fontWeight });
    expect(at('400')).toMatchObject({ fontFamily: 'Hind-Regular', fontWeight: 'normal' });
    expect(at('500').fontFamily).toBe('Hind-SemiBold');
    expect(at('600').fontFamily).toBe('Hind-SemiBold');
    expect(at('700').fontFamily).toBe('Hind-Bold');
    expect(at('bold').fontFamily).toBe('Hind-Bold');
  });

  it('uses Hind Madurai for Tamil', () => {
    expect(scriptTextStyle('ta', { fontSize: 17, lineHeight: 24, fontWeight: '700' }).fontFamily).toBe(
      'HindMadurai-Bold',
    );
  });

  it('raises every variant’s line height enough for Devanagari marks', () => {
    for (const [name, v] of Object.entries(typography)) {
      const { lineHeight } = scriptTextStyle('hi', v);
      // Hind's ascent + descent is 1.60 of the font size.
      expect(lineHeight / v.fontSize, name).toBeGreaterThanOrEqual(1.6);
    }
  });

  it('raises Tamil line heights past Hind Madurai’s 1.38', () => {
    for (const v of Object.values(typography)) {
      expect(scriptTextStyle('ta', v).lineHeight / v.fontSize).toBeGreaterThanOrEqual(1.38);
    }
  });

  it('never lowers a line height a caller asked for', () => {
    expect(scriptTextStyle('hi', { fontSize: 17, lineHeight: 40 }).lineHeight).toBe(40);
  });
});

describe('scriptInputFont', () => {
  it('gives text inputs the regular face, or the system font for English', () => {
    expect(scriptInputFont('hi')).toBe('Hind-Regular');
    expect(scriptInputFont('ta')).toBe('HindMadurai-Regular');
    expect(scriptInputFont('en')).toBeUndefined();
  });

  it('knows which languages have a bundled font', () => {
    expect(usesScriptFont('hi')).toBe(true);
    expect(usesScriptFont('ta')).toBe(true);
    expect(usesScriptFont('en')).toBe(false);
  });
});

describe('the bundled font files', () => {
  // A name that does not match a file renders in the system font, silently —
  // exactly the clipping this exists to prevent.
  const appJson = readFileSync(join(root, 'app.json'), 'utf8');

  for (const name of BUNDLED_FONT_NAMES) {
    it(`${name} exists and is registered with expo-font`, () => {
      expect(existsSync(join(root, 'assets', 'fonts', `${name}.ttf`))).toBe(true);
      expect(appJson).toContain(`./assets/fonts/${name}.ttf`);
    });
  }
});
