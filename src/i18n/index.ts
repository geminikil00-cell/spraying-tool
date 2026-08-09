import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from './ar.json'
import en from './en.json'

export const LANG_KEY = 'lang'

export function applyDirection(lang: string): void {
  document.documentElement.dir = lang.startsWith('ar') ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
}

const saved = localStorage.getItem(LANG_KEY) ?? 'en'

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: saved,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

applyDirection(saved)

export default i18n
