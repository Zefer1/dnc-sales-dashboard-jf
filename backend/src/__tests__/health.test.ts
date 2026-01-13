import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

let app: typeof import('express').default

beforeAll(async () => {
  // Create an isolated test DB and apply migrations.
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret'
  process.env.FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'file:./prisma/test.db'

  const dbPath = path.join(process.cwd(), 'prisma', 'test.db')
  if (fs.existsSync(dbPath)) fs.rmSync(dbPath)

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env },
  })

  const mod = await import('../app')
  app = mod.default
})

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

describe('auth + leads CRUD', () => {
  it('register -> login -> create/list/update/delete lead', async () => {
    const email = `test-${Date.now()}@example.com`
    const password = 'password123'

    const registerRes = await request(app).post('/api/register').send({ email, password, name: 'Test' })
    expect(registerRes.status).toBe(201)
    expect(registerRes.body?.token).toBeTruthy()

    const loginRes = await request(app).post('/api/login').send({ email, password })
    expect(loginRes.status).toBe(200)
    const token = loginRes.body?.token as string
    expect(token).toBeTruthy()

    const auditEmptyRes = await request(app).get('/api/audit').set('Authorization', `Bearer ${token}`)
    expect(auditEmptyRes.status).toBe(200)
    expect(Array.isArray(auditEmptyRes.body?.events)).toBe(true)

    const emptySummaryRes = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${token}`)
    expect(emptySummaryRes.status).toBe(200)
    expect(emptySummaryRes.body?.stats?.totalLeads).toBeTypeOf('number')
    expect(emptySummaryRes.body?.stats?.leadsThisMonth).toBeTypeOf('number')
    expect(Array.isArray(emptySummaryRes.body?.recentLeads)).toBe(true)
    expect(Array.isArray(emptySummaryRes.body?.leadsBySource)).toBe(true)
    expect(Array.isArray(emptySummaryRes.body?.leadsByMonth?.labels)).toBe(true)
    expect(Array.isArray(emptySummaryRes.body?.leadsByMonth?.data)).toBe(true)

    const createRes = await request(app)
      .post('/api/leads/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alice', contact: '999', source: 'Instagram' })
    expect(createRes.status).toBe(201)
    const createdId = createRes.body?.lead?.id as number
    expect(createdId).toBeTruthy()

    const importRes = await request(app)
      .post('/api/leads/import')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mode: 'skip_exact_duplicates',
        leads: [
          { name: 'Bob', contact: '111', source: 'Referral' },
          { name: 'Bob', contact: '111', source: 'Referral' },
        ],
      })
    expect(importRes.status).toBe(200)
    expect(importRes.body?.received).toBe(2)
    expect(importRes.body?.created).toBe(1)
    expect(importRes.body?.skipped).toBe(1)

    const auditRes = await request(app).get('/api/audit').set('Authorization', `Bearer ${token}`)
    expect(auditRes.status).toBe(200)
    const actions = (auditRes.body?.events as Array<{ action?: string }>).map((e) => e.action)
    expect(actions.includes('LEAD_CREATE')).toBe(true)
    expect(actions.includes('LEAD_IMPORT')).toBe(true)

    const summaryRes = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${token}`)
    expect(summaryRes.status).toBe(200)
    expect(summaryRes.body?.stats?.totalLeads).toBeGreaterThanOrEqual(1)
    expect(summaryRes.body?.recentLeads?.length).toBeGreaterThanOrEqual(1)

    const listRes = await request(app).get('/api/leads').set('Authorization', `Bearer ${token}`)
    expect(listRes.status).toBe(200)
    const leads = listRes.body?.leads as Array<{ id: number }>
    expect(leads.some((l) => l.id === createdId)).toBe(true)

    const updateRes = await request(app)
      .put('/api/leads/update')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: createdId, name: 'Alice Updated', contact: null, source: 'Referral' })
    expect(updateRes.status).toBe(200)
    expect(updateRes.body?.lead?.name).toBe('Alice Updated')
    expect(updateRes.body?.lead?.contact).toBe(null)

    const deleteRes = await request(app)
      .delete('/api/leads/delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: createdId })
    expect(deleteRes.status).toBe(200)

    const listRes2 = await request(app).get('/api/leads').set('Authorization', `Bearer ${token}`)
    expect(listRes2.status).toBe(200)
    const leads2 = listRes2.body?.leads as Array<{ id: number }>
    expect(leads2.some((l) => l.id === createdId)).toBe(false)
  })
})
