import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en';
import hi from './locales/hi';
import ta from './locales/ta';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', endonym: 'English' },
  { code: 'hi', label: 'Hindi', endonym: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', endonym: 'தமிழ்' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const LANGUAGE_SETTING_KEY = 'language';

export function isSupported(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.some((l) => l.code === code);
}

/**
 * The device's preferred language, if we support it.
 * `getLocales()` is ordered by user preference, so a device set to
 * Tamil-then-English picks Tamil.
 */
export function detectDeviceLanguage(): LanguageCode {
  try {
    for (const locale of getLocales()) {
      const code = locale.languageCode;
      if (code && isSupported(code)) return code;
    }
  } catch {
    // Localization can throw on an unusual device config; English is a safe floor.
  }
  return 'en';
}

let initialised = false;

export async function initI18n(stored: string | null): Promise<LanguageCode> {
  const language = stored && isSupported(stored) ? stored : detectDeviceLanguage();

  if (!initialised) {
    initialised = true;
    await i18n.use(initReactI18next).init({
      resources: {
        en: { translation: en },
        hi: { translation: hi },
        ta: { translation: ta },
      },
      lng: language,
      fallbackLng: 'en',
      // React already escapes everything it renders.
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  } else {
    await i18n.changeLanguage(language);
  }

  return language;
}

export async function changeLanguage(code: LanguageCode): Promise<void> {
  await i18n.changeLanguage(code);
}

export default i18n;
