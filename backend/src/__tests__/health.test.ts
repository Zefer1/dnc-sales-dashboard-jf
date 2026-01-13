import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../app'

describe('health', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})

describe('auth', () => {
  it('GET /api/leads requires a Bearer token', async () => {
    const res = await request(app).get('/api/leads')
    expect(res.status).toBe(401)
  })
})
