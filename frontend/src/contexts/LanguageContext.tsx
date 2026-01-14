import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import i18n, { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/i18n/config'

const PREFS_KEY = 'urbancrm.settings.preferences.v1'

type LanguageContextValue = {
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

function readLanguageFromPrefs(): SupportedLanguage {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
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

function writeLanguageToPrefs(lang: SupportedLanguage) {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...prev, language: lang }))
  } catch {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ language: lang }))
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => readLanguageFromPrefs())

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang)
    writeLanguageToPrefs(lang)
  }, [])

  useEffect(() => {
    void i18n.changeLanguage(language)

    // Keep document locale metadata in sync.
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
      document.documentElement.dir = 'ltr'
    }
  }, [language])

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}
