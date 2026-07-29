import { createI18n } from 'vue-i18n'
import en from './locale/en.json'
import tr from './locale/tr.json'

const STORAGE_KEY = 'dragon-locale'
const SUPPORTED_LOCALES = ['en', 'tr']
const FALLBACK_LOCALE = 'en'

// Resolution order:
//   1. An explicit choice the user made before (persisted) — always wins.
//   2. The browser's language preferences, in the user's own priority order.
//   3. English as a last resort.
function detectLocale() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && SUPPORTED_LOCALES.includes(saved)) {
    return saved
  }

  // navigator.languages is the full ordered preference list ('tr-TR', 'en-US', ...).
  // Fall back to navigator.language for older browsers.
  const preferred = navigator.languages?.length
    ? navigator.languages
    : [navigator.language].filter(Boolean)

  for (const tag of preferred) {
    // Match on the base language so 'tr-TR' and 'tr' both resolve to 'tr'.
    const base = tag.split('-')[0].toLowerCase()
    if (SUPPORTED_LOCALES.includes(base)) {
      return base
    }
  }

  return FALLBACK_LOCALE
}

const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: FALLBACK_LOCALE,
  messages: {
    en,
    tr,
  },
})

// Keep <html lang> in sync from the start (accessibility + correct font shaping)
document.documentElement.setAttribute('lang', i18n.global.locale.value)

export function setLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.setAttribute('lang', locale)
}

export function getLocale() {
  return i18n.global.locale.value
}

export { SUPPORTED_LOCALES }
export default i18n
