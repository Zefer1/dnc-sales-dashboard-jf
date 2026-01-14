import { useEffect, useState } from 'react'
import { loadPrefs, PREFERENCES_CHANGED_EVENT, type LocalPreferences } from '@/utils/preferences'

export function usePreferences(): LocalPreferences {
  const [prefs, setPrefs] = useState<LocalPreferences>(() => loadPrefs())

  useEffect(() => {
    const sync = () => setPrefs(loadPrefs())

    window.addEventListener(PREFERENCES_CHANGED_EVENT, sync)
    window.addEventListener('storage', sync)

    return () => {
      window.removeEventListener(PREFERENCES_CHANGED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return prefs
}
