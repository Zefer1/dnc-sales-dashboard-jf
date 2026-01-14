export type LocalPreferences = {
  language: 'pt-PT' | 'pt-BR' | 'en-US'
  tableDensity: 'comfortable' | 'compact'
  reduceMotion: boolean
  highContrast: boolean
  tooltips: boolean
  toasts: boolean
  dashboardAutoRefresh: boolean
  auditTake: number
}

export const PREFS_KEY = 'urbancrm.settings.preferences.v1'
export const PREFERENCES_CHANGED_EVENT = 'urbancrm:preferences-changed'

const DEFAULT_PREFS: LocalPreferences = {
  language: 'pt-PT',
  tableDensity: 'comfortable',
  reduceMotion: false,
  highContrast: false,
  tooltips: true,
  toasts: true,
  dashboardAutoRefresh: true,
  auditTake: 100,
}

export function loadPrefs(): LocalPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS

    const parsed = JSON.parse(raw) as Partial<LocalPreferences>

    return {
      language: parsed.language ?? DEFAULT_PREFS.language,
      tableDensity: parsed.tableDensity ?? DEFAULT_PREFS.tableDensity,
      reduceMotion: Boolean(parsed.reduceMotion),
      highContrast: Boolean(parsed.highContrast),
      tooltips: parsed.tooltips ?? DEFAULT_PREFS.tooltips,
      toasts: parsed.toasts ?? DEFAULT_PREFS.toasts,
      dashboardAutoRefresh: parsed.dashboardAutoRefresh ?? DEFAULT_PREFS.dashboardAutoRefresh,
      auditTake: typeof parsed.auditTake === 'number' ? parsed.auditTake : DEFAULT_PREFS.auditTake,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePrefs(prefs: LocalPreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  localStorage.setItem('settings_toasts_enabled', prefs.toasts ? 'true' : 'false')

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PREFERENCES_CHANGED_EVENT))
  }
}
