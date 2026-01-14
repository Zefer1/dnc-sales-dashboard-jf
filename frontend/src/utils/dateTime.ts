import i18n from '@/i18n/config'

export function getCurrentLocale() {
  return i18n.resolvedLanguage ?? i18n.language ?? 'pt-PT'
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : ''
  }

  return date.toLocaleString(getCurrentLocale())
}
