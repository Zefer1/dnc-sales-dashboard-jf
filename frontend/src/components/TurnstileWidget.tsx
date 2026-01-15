import { useEffect, useId, useRef } from 'react'

type TurnstileWidgetProps = {
  siteKey: string
  onToken: (token: string) => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, params: Record<string, unknown>) => string
      reset: (widgetId: string) => void
    }
  }
}

let scriptLoading: Promise<void> | null = null

function ensureTurnstileScriptLoaded() {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.turnstile) return Promise.resolve()

  if (!scriptLoading) {
    scriptLoading = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-turnstile="true"]')
      if (existing) {
        existing.addEventListener('load', () => resolve())
        existing.addEventListener('error', () => reject(new Error('Failed to load Turnstile')))
        return
      }

      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.turnstile = 'true'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Turnstile'))
      document.head.appendChild(script)
    })
  }

  return scriptLoading
}

export function TurnstileWidget(props: TurnstileWidgetProps) {
  const id = useId()
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let widgetId: string | null = null
    let cancelled = false

    ensureTurnstileScriptLoaded()
      .then(() => {
        if (cancelled) return
        const el = containerRef.current
        const api = window.turnstile
        if (!el || !api) return

        widgetId = api.render(el, {
          sitekey: props.siteKey,
          callback: (token: string) => props.onToken(token),
          'expired-callback': () => props.onToken(''),
          'error-callback': () => props.onToken(''),
        })
      })
      .catch(() => {
        // Leave blank; caller can show fallback UI.
      })

    return () => {
      cancelled = true
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.reset(widgetId)
        } catch {
          // ignore
        }
      }
    }
  }, [id, props])

  return <div ref={containerRef} />
}
