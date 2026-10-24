import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json';
import jaTranslation from './locales/ja.json';

export type LanguageMode = 'auto' | 'en' | 'ja';
export type ResolvedLanguage = 'en' | 'ja';

export const LANGUAGE_STORAGE_KEY = 'sbom_weather_language_preference';

/**
 * Detect the optimal language ('en' or 'ja') based on the browser's settings.
 */
export function detectBrowserLanguage(): ResolvedLanguage {
  if (typeof navigator === 'undefined') return 'en';
  const browserLang = (navigator.languages && navigator.languages[0]) || navigator.language || '';
  return browserLang.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

/**
 * Retrieve saved language mode from storage or fallback to 'auto'.
 */
export function getStoredLanguageMode(): LanguageMode {
  if (typeof window === 'undefined') return 'auto';
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved === 'auto' || saved === 'en' || saved === 'ja') {
    return saved;
  }
  return 'auto';
}

/**
 * Resolve effective language from mode.
 */
export function resolveEffectiveLanguage(mode: LanguageMode): ResolvedLanguage {
  if (mode === 'auto') {
    return detectBrowserLanguage();
  }
  return mode;
}

export const defaultResources = {
  en: { translation: enTranslation },
  ja: { translation: jaTranslation },
} as const;

const initialMode = getStoredLanguageMode();
const initialEffectiveLang = resolveEffectiveLanguage(initialMode);

i18n
  .use(initReactI18next)
  .init({
    resources: defaultResources,
    defaultNS: 'translation',
    lng: initialEffectiveLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safeguards against XSS
    },
    detection: {
      order: [], // Controlled via custom logic
    },
  });

/**
 * Change language mode and update persistence.
 */
export function setLanguagePreference(mode: LanguageMode): ResolvedLanguage {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, mode);
  const effective = resolveEffectiveLanguage(mode);
  i18n.changeLanguage(effective);
  return effective;
}

export default i18n;
