import type { Request, Response, NextFunction } from 'express'

type RateLimiterOptions = {
  windowMs: number
  max: number
  key: (req: Request) => string
}

type Entry = { count: number; resetAt: number }

export function createRateLimiter(options: RateLimiterOptions) {
  const store = new Map<string, Entry>()

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const now = Date.now()
    const key = options.key(req)

    const existing = store.get(key)
    if (!existing || existing.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + options.windowMs })
      return next()
    }

    existing.count += 1
    if (existing.count > options.max) {
      res.setHeader('Retry-After', Math.ceil((existing.resetAt - now) / 1000))
      return res.status(429).json({ error: 'Too many requests' })
    }

    return next()
  }
}
