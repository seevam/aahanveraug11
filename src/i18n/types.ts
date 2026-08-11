import type { TranslationShape } from './locales/en';

/**
 * Widens the literal string types produced by `as const` in `en.ts` into plain
 * `string`, while keeping the object shape exact.
 *
 * Translations are typed as `Translation` rather than `Partial<Translation>`
 * on purpose: adding a key to English then breaks the Hindi and Tamil builds
 * until it is translated. The alternative — a silent English fallback — puts
 * untranslated text in front of a patient who cannot read it, which is worse
 * than a compile error in front of a developer who can.
 */
export type Translation = {
  [K in keyof TranslationShape]: {
    [J in keyof TranslationShape[K]]: string;
  };
};
