import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import commonEn from './locales/en-US/common.json'
import authEn from './locales/en-US/auth.json'
import landingEn from './locales/en-US/landing.json'
import homeEn from './locales/en-US/home.json'
import leadsEn from './locales/en-US/leads.json'
import settingsEn from './locales/en-US/settings.json'
import auditEn from './locales/en-US/audit.json'

import commonPtPT from './locales/pt-PT/common.json'
import authPtPT from './locales/pt-PT/auth.json'
import landingPtPT from './locales/pt-PT/landing.json'
import homePtPT from './locales/pt-PT/home.json'
import leadsPtPT from './locales/pt-PT/leads.json'
import settingsPtPT from './locales/pt-PT/settings.json'
import auditPtPT from './locales/pt-PT/audit.json'

import commonPtBR from './locales/pt-BR/common.json'
import authPtBR from './locales/pt-BR/auth.json'
import landingPtBR from './locales/pt-BR/landing.json'
import homePtBR from './locales/pt-BR/home.json'
import leadsPtBR from './locales/pt-BR/leads.json'
import settingsPtBR from './locales/pt-BR/settings.json'
import auditPtBR from './locales/pt-BR/audit.json'

export const SUPPORTED_LANGUAGES = ['pt-PT', 'pt-BR', 'en-US'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const PREFS_KEY = 'urbancrm.settings.preferences.v1'

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'pt-PT'

  try {
    const raw = window.localStorage.getItem(PREFS_KEY)
    if (!raw) return 'pt-PT'

    const parsed = JSON.parse(raw) as { language?: unknown }
    const lang = typeof parsed.language === 'string' ? parsed.language : ''
    if ((SUPPORTED_LANGUAGES as readonly string[]).includes(lang)) {
      return lang as SupportedLanguage
    }

    return 'pt-PT'
  } catch {
    return 'pt-PT'
  }
}

if (!i18n.isInitialized) {
  void i18n
    .use(initReactI18next)
    .init({
      lng: getInitialLanguage(),
      fallbackLng: 'pt-PT',
      supportedLngs: [...SUPPORTED_LANGUAGES],
      ns: ['common', 'auth', 'landing', 'home', 'leads', 'settings', 'audit'],
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      resources: {
        'en-US': {
          common: commonEn,
          auth: authEn,
          landing: landingEn,
          home: homeEn,
          leads: leadsEn,
          settings: settingsEn,
          audit: auditEn,
        },
        'pt-PT': {
          common: commonPtPT,
          auth: authPtPT,
          landing: landingPtPT,
          home: homePtPT,
          leads: leadsPtPT,
          settings: settingsPtPT,
          audit: auditPtPT,
        },
        'pt-BR': {
          common: commonPtBR,
          auth: authPtBR,
          landing: landingPtBR,
          home: homePtBR,
          leads: leadsPtBR,
          settings: settingsPtBR,
          audit: auditPtBR,
        },
      },
    })
}

export default i18n
