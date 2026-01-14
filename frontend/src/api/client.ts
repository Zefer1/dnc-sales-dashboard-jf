import axios from 'axios'

function normalizeBaseUrl(url: string) {
  // remove trailing slashes
  return url.replace(/\/+$/, '')
}

export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (typeof raw === 'string' && raw.trim()) {
    return normalizeBaseUrl(raw.trim())
  }

  // Sensible dev fallback: backend default port
  return 'http://localhost:3000'
}

export const api = axios.create({
  baseURL: `${getApiBaseUrl()}/`,
  headers: {
    'Content-Type': 'application/json',
  },
})
