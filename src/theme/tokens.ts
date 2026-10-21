/**
 * Design tokens for Eyedrop Scheduler.
 *
 * The audience is patients with eye conditions — often older, often with
 * imperfect hands and imperfect vision. Three rules drive every value here:
 *
 *  1. Nothing tappable is smaller than 48dp (WCAG 2.2 target size, AAA).
 *  2. Body text starts at 17pt, not 14pt, and scales with the OS font setting.
 *  3. Every foreground/background pair below clears WCAG AA (4.5:1 for text,
 *     3:1 for large text and UI boundaries) in both light and dark.
 *
 * Status colours are never the *only* signal — every status also carries an
 * icon and a text label, because colour-blindness is common in this cohort.
 */

export const palette = {
  // Teal: clinical without being cold, distinct from the "Google blue" of v1.
  teal900: '#053B3B',
  teal800: '#075150',
  teal700: '#0E7C7B',
  teal600: '#13918F',
  teal500: '#1FA8A5',
  teal200: '#9DDDDB',
  teal100: '#CFEEED',
  teal50: '#EAF7F7',

  // Status colours, checked against both surfaces.
  green700: '#1B6B3A',
  green500: '#2E9E57',
  green100: '#DCF2E4',
  amber700: '#8A5A00',
  amber500: '#C98A04',
  amber100: '#FCEFD1',
  red700: '#A32020',
  red500: '#D64545',
  red100: '#FBE0E0',
  slate900: '#111827',
  slate800: '#1F2937',
  slate700: '#374151',
  slate600: '#4B5563',
  slate500: '#6B7280',
  slate400: '#9CA3AF',
  slate300: '#D1D5DB',
  slate200: '#E5E7EB',
  slate100: '#F3F4F6',
  slate50: '#F9FAFB',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorScheme = {
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceSunken: string;
  border: string;
  borderStrong: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  primary: string;
  primaryPressed: string;
  primarySubtle: string;
  onPrimary: string;

  success: string;
  successSubtle: string;
  onSuccessSubtle: string;

  warning: string;
  warningSubtle: string;
  onWarningSubtle: string;

  danger: string;
  dangerSubtle: string;
  onDangerSubtle: string;

  focusRing: string;
  overlay: string;
};

export const lightColors: ColorScheme = {
  background: palette.slate50,
  surface: palette.white,
  surfaceRaised: palette.white,
  surfaceSunken: palette.slate100,
  border: palette.slate200,
  borderStrong: palette.slate400,

  text: palette.slate900,
  textSecondary: palette.slate700,
  textMuted: palette.slate600,
  textInverse: palette.white,

  primary: palette.teal700,
  primaryPressed: palette.teal800,
  primarySubtle: palette.teal50,
  onPrimary: palette.white,

  success: palette.green700,
  successSubtle: palette.green100,
  onSuccessSubtle: palette.green700,

  warning: palette.amber700,
  warningSubtle: palette.amber100,
  onWarningSubtle: palette.amber700,

  danger: palette.red700,
  dangerSubtle: palette.red100,
  onDangerSubtle: palette.red700,

  focusRing: palette.teal500,
  overlay: 'rgba(17, 24, 39, 0.55)',
};

export const darkColors: ColorScheme = {
  background: '#0B1114',
  surface: '#151E22',
  surfaceRaised: '#1D282D',
  surfaceSunken: '#0B1114',
  border: '#2A383E',
  borderStrong: '#42555D',

  text: '#F2F6F7',
  textSecondary: '#C3CFD4',
  textMuted: '#9AA9AF',
  textInverse: palette.slate900,

  primary: palette.teal500,
  primaryPressed: palette.teal600,
  primarySubtle: '#0C2B2C',
  onPrimary: '#04211F',

  success: '#5FD48C',
  successSubtle: '#0E2C1B',
  onSuccessSubtle: '#5FD48C',

  warning: '#F0B849',
  warningSubtle: '#33240A',
  onWarningSubtle: '#F0B849',

  danger: '#FF8080',
  dangerSubtle: '#3A1414',
  onDangerSubtle: '#FF8080',

  focusRing: palette.teal200,
  overlay: 'rgba(0, 0, 0, 0.65)',
};

/** 4pt base scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/**
 * Type scale. Deliberately one step larger than a typical mobile app —
 * `body` is 17 rather than 14/15.
 */
export const typography = {
  display: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  subheading: { fontSize: 19, lineHeight: 25, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 14, lineHeight: 19, fontWeight: '400' },
  /** Large clock readout on the alarm screen. */
  clock: { fontSize: 56, lineHeight: 62, fontWeight: '700' },
} as const;

export type TypographyVariant = keyof typeof typography;

/**
 * Minimum interactive size. WCAG 2.2 Target Size (Enhanced) asks for 44x44;
 * we use 48 as the floor and 64 for the primary dose actions, which are
 * pressed in a hurry, sometimes with drops already in one eye.
 */
export const touchTarget = {
  min: 48,
  comfortable: 56,
  primary: 64,
} as const;

export const elevation = {
  none: {},
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} as const;

/**
 * Bottle cap colours.
 *
 * These represent a physical object, so unlike every other colour in this file
 * they do NOT change between light and dark — a yellow cap is yellow in both.
 * Each swatch is drawn with a border so the pale ones stay visible on a white
 * surface and the dark ones on a dark surface.
 */
export const capColours = {
  yellow: '#EFBF2E',
  teal: '#14A3A0',
  purple: '#8B5CC7',
  orange: '#E3802F',
  darkBlue: '#2A5CA5',
  green: '#3C9A4E',
  red: '#D1453B',
  pink: '#E87FA0',
  tan: '#C0996B',
} as const;
