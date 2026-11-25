/**
 * Fonts and line heights for Hindi and Tamil.
 *
 * Pure, so it can be tested without React.
 *
 * Why this exists: on Android, Devanagari and Tamil text was being clipped —
 * `बदलें` showed as `बद`, `अलार्म सेट करें` lost its last word. Two causes:
 *
 *  1. No font of ours covered these scripts, so Android fell back to whatever
 *     the phone's maker ships, often without a real semibold. The text was
 *     laid out at one width and drawn wider, and the overflow was cut off.
 *     Bundling fonts that cover the script, with real Regular, SemiBold and
 *     Bold files, makes the measured text and the drawn text the same text.
 *
 *  2. The type scale's line heights (1.3–1.4× the font size) suit Latin, but
 *     Devanagari carries marks above and below the line — ं, े, ि, ु, ृ — and
 *     Hind's own metrics need 1.6×. Anything less crops them.
 *
 * English keeps the system font, where neither problem occurs.
 */

import type { TextStyle } from 'react-native';

type WeightName = 'regular' | 'semibold' | 'bold';

/**
 * Hind (Devanagari + Latin) and Hind Madurai (Tamil + Latin), by Indian Type
 * Foundry, under the SIL Open Font License — see assets/fonts/. Both include
 * Latin, so an English medication name inside Hindi or Tamil text renders in
 * the same font rather than falling back mid-line.
 *
 * The names are each file's name, which is also its PostScript name: Android
 * looks fonts up by file name and iOS by PostScript name, so one name works on
 * both. They must match the files listed for expo-font in app.json.
 */
const FAMILIES: Record<string, Record<WeightName, string>> = {
  hi: { regular: 'Hind-Regular', semibold: 'Hind-SemiBold', bold: 'Hind-Bold' },
  ta: { regular: 'HindMadurai-Regular', semibold: 'HindMadurai-SemiBold', bold: 'HindMadurai-Bold' },
};

/**
 * Smallest line height, as a multiple of the font size, that clears the
 * font's own ascent + descent. Hind: (1055 + 546) / 1000 = 1.60; Hind Madurai:
 * (982 + 398) / 1000 = 1.38. Each is rounded up with a little headroom.
 */
const MIN_LINE_HEIGHT_RATIO: Record<string, number> = {
  hi: 1.65,
  ta: 1.45,
};

/** True for languages that use a bundled script font. */
export function usesScriptFont(language: string | undefined): boolean {
  return language !== undefined && language in FAMILIES;
}

function weightName(weight: TextStyle['fontWeight'] | undefined): WeightName {
  switch (String(weight ?? '400')) {
    case '700':
    case '800':
    case '900':
    case 'bold':
      return 'bold';
    case '500':
    case '600':
      return 'semibold';
    default:
      return 'regular';
  }
}

/**
 * The font family and line height a piece of text should use.
 *
 * For Hindi and Tamil the weight is chosen by *file*, and `fontWeight` is reset
 * to normal: asking Android for a weight on top of a font file makes it
 * synthesise a bolder version, which reintroduces the width mismatch.
 *
 * For any other language this returns the inputs unchanged.
 */
export function scriptTextStyle(
  language: string | undefined,
  style: { fontSize: number; lineHeight: number; fontWeight?: TextStyle['fontWeight'] },
): { fontFamily?: string; fontWeight?: TextStyle['fontWeight']; lineHeight: number } {
  if (!language || !usesScriptFont(language)) {
    return { fontWeight: style.fontWeight, lineHeight: style.lineHeight };
  }
  const minimum = Math.ceil(style.fontSize * MIN_LINE_HEIGHT_RATIO[language]!);
  return {
    fontFamily: FAMILIES[language]![weightName(style.fontWeight)],
    fontWeight: 'normal',
    lineHeight: Math.max(style.lineHeight, minimum),
  };
}

/** The regular face for a language, for text inputs; undefined means the system font. */
export function scriptInputFont(language: string | undefined): string | undefined {
  return language && usesScriptFont(language) ? FAMILIES[language]!.regular : undefined;
}

/** Every bundled font file name, for tests to check against app.json. */
export const BUNDLED_FONT_NAMES: readonly string[] = Object.values(FAMILIES).flatMap((f) =>
  Object.values(f),
);
