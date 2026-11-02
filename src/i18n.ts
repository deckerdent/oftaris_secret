import { createI18n } from 'vue-i18n'
import de from './locales/de.json'
import en from './locales/en.json'

export const localeStorageKey = 'oftaris-secret-locale'
export const supportedLocales = ['en', 'de'] as const
export type Locale = (typeof supportedLocales)[number]

export const localeOptions: readonly { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
]

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'de'
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const savedLocale = window.localStorage.getItem(localeStorageKey)
  if (isLocale(savedLocale)) {
    return savedLocale
  }

  const browserLocale = window.navigator.language.split('-')[0]
  return isLocale(browserLocale) ? browserLocale : 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: { en, de },
})

export function setLocale(locale: Locale): void {
  window.localStorage.setItem(localeStorageKey, locale)
  i18n.global.locale.value = locale
}
