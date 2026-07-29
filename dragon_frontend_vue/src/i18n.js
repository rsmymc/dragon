import { createI18n } from 'vue-i18n'
import en from './locale/en.json'
import tr from './locale/tr.json'

const STORAGE_KEY = 'dragon-locale'
const SUPPORTED_LOCALES = ['en', 'tr']

function detectLocale() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && SUPPORTED_LOCALES.includes(saved)) {
    return saved
  }

  const browserLang = navigator.language?.split('-')[0]
  if (SUPPORTED_LOCALES.includes(browserLang)) {
    return browserLang
  }

  return 'tr'
}

const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'tr',
  messages: {
    en,
    tr,
  },
})

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
