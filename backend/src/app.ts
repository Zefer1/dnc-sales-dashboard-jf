import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import crypto from 'node:crypto'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { canSendEmail, sendEmail } from './email/mailer'

dotenv.config()

const prisma = new PrismaClient()

const app = express()

app.use(helmet())
const frontendUrl = process.env.FRONTEND_URL
app.use(
  cors({
    origin: frontendUrl ? [frontendUrl] : true,
  })
)
app.use(express.json())

function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    return res.status(500).json({ error: 'Missing JWT_SECRET' })
  }

  const authHeader = req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Bearer token' })
  }

  const token = authHeader.replace('Bearer ', '').trim()
  try {
    const payload = jwt.verify(token, jwtSecret) as { sub?: string; email?: string }
    if (!payload?.sub) {
      return res.status(401).json({ error: 'Invalid token payload' })
    }

    res.locals.user = payload
    res.locals.userId = Number(payload.sub)
    return next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true })
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8),
})

const updateMeSchema = z.object({
  name: z.string().min(1).max(80),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

const leadCreateSchema = z.object({
  name: z.string().min(1),
  contact: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
})

const leadDeleteSchema = z.object({
  id: z.number().int().positive(),
})

const leadUpdateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  contact: z.string().min(1).nullable().optional(),
  source: z.string().min(1).nullable().optional(),
})

const leadImportSchema = z.object({
  leads: z
    .array(
      z.object({
        name: z.string().min(1),
        contact: z.string().min(1).nullable().optional(),
        source: z.string().min(1).nullable().optional(),
      })
    )
    .min(1)
    .max(2000),
  mode: z.enum(['always_create', 'skip_exact_duplicates']).optional(),
})

async function logAuditEvent(params: {
  userId: number
  action: string
  entityType: string
  entityId?: number | null
  before?: unknown
  after?: unknown
  metadata?: unknown
}) {
  await prisma.auditEvent.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      before: params.before ?? undefined,
      after: params.after ?? undefined,
      metadata: params.metadata ?? undefined,
    },
  })
}

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function shouldReturnDevToken() {
  if (process.env.NODE_ENV === 'production') {
    return false
  }

  // Default: enabled in non-production for developer ergonomics.
  // Set RETURN_DEV_PASSWORD_RESET_TOKEN=false to force "production-like" behavior locally.
  return process.env.RETURN_DEV_PASSWORD_RESET_TOKEN?.toLowerCase() !== 'false'
}

function getPasswordResetLink(rawToken: string) {
  const base =
    process.env.PASSWORD_RESET_BASE_URL ??
    process.env.FRONTEND_URL ??
    (shouldReturnDevToken() ? 'http://localhost:5173' : undefined)
  if (!base) {
    return null
  }
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  return `${normalizedBase}/redefinir-senha?token=${encodeURIComponent(rawToken)}`
}

app.post('/api/register', async (req, res) => {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    return res.status(500).json({ error: 'Missing JWT_SECRET' })
  }

  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const { email, password, name } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
    },
  })

  const token = jwt.sign({ sub: String(user.id), email: user.email }, jwtSecret, { expiresIn: '1h' })
  return res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name ?? 'User',
      email: user.email,
    },
  })
})

app.post('/api/login', async (req, res) => {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    return res.status(500).json({ error: 'Missing JWT_SECRET' })
  }

  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }

  const token = jwt.sign({ sub: String(user.id), email: user.email }, jwtSecret, { expiresIn: '1h' })
  return res.status(200).json({
    token,
    user: {
      id: user.id,
      name: user.name ?? 'User',
      email: user.email,
    },
  })
})

app.post('/api/password/forgot', async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const { email } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })

  // Always return 200 to avoid email enumeration.
  if (!user) {
    return res.status(200).json({ ok: true })
  }

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = sha256Hex(rawToken)
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

  try {
    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        expiresAt,
        userId: user.id,
      },
    })
  } catch (err: any) {
    const msg = String(err?.message ?? '')
    if (msg.includes('no such table') || msg.includes('PasswordResetToken')) {
      return res.status(503).json({
        error: 'Database not migrated',
        hint: 'Run: npx prisma migrate dev (or migrate deploy) in backend/',
      })
    }
    throw err
  }

  await logAuditEvent({
    userId: user.id,
    action: 'PASSWORD_RESET_REQUEST',
    entityType: 'User',
    entityId: user.id,
    metadata: { email },
  })

  const resetLink = getPasswordResetLink(rawToken)
  const canEmail = process.env.NODE_ENV !== 'test' && Boolean(resetLink) && canSendEmail()

  if (canEmail) {
    try {
      await sendEmail({
        to: user.email,
        subject: 'UrbanCRM — Redefinição de password',
        text:
          `Recebemos um pedido para redefinir a sua password.\n\n` +
          `Abra este link para continuar: ${resetLink}\n\n` +
          `Se não foi você, ignore este email.`,
        html:
          `<p>Recebemos um pedido para redefinir a sua password.</p>` +
          `<p><a href="${resetLink}">Clique aqui para redefinir</a></p>` +
          `<p>Se não foi você, ignore este email.</p>`,
      })

      return res.status(200).json({ ok: true })
    } catch (err) {
      if (shouldReturnDevToken()) {
        // eslint-disable-next-line no-console
        console.error('Password reset email failed to send:', err)
      }

      // In production, keep response generic and discard the token.
      // In non-production, return a dev token so local development can continue.
      if (shouldReturnDevToken()) {
        return res.status(200).json({ ok: true, devToken: rawToken })
      }

      await prisma.passwordResetToken.delete({ where: { tokenHash } })

      return res.status(200).json({ ok: true })
    }
  }

  if (shouldReturnDevToken()) {
    return res.status(200).json({ ok: true, devToken: rawToken })
  }

  return res.status(200).json({ ok: true })
})

app.post('/api/password/reset', async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const { token, newPassword } = parsed.data
  const tokenHash = sha256Hex(token)

  let record: { id: number; userId: number } | null = null
  try {
    record = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, userId: true },
    })
  } catch (err: any) {
    const msg = String(err?.message ?? '')
    if (msg.includes('no such table') || msg.includes('PasswordResetToken')) {
      return res.status(503).json({
        error: 'Database not migrated',
        hint: 'Run: npx prisma migrate dev (or migrate deploy) in backend/',
      })
    }
    throw err
  }

  if (!record) {
    return res.status(400).json({ error: 'Token inválido ou expirado' })
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ])

  await logAuditEvent({
    userId: record.userId,
    action: 'PASSWORD_RESET',
    entityType: 'User',
    entityId: record.userId,
  })

  return res.status(200).json({ ok: true })
})

app.get('/api/profile', auth, (_req, res) => {
  return res.status(200).json({ user: res.locals.user })
})

app.get('/api/me', auth, async (_req, res) => {
  const userId = res.locals.userId as number

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? 'User',
    },
  })
})

app.put('/api/me', auth, async (req, res) => {
  const userId = res.locals.userId as number
  const parsed = updateMeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  })
  if (!before) {
    return res.status(404).json({ error: 'User not found' })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { name: parsed.data.name.trim() },
    select: { id: true, email: true, name: true },
  })

  await logAuditEvent({
    userId,
    action: 'USER_UPDATE',
    entityType: 'User',
    entityId: userId,
    before,
    after: updated,
    metadata: { changed: ['name'] },
  })

  return res.status(200).json({
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name ?? 'User',
    },
  })
})

app.post('/api/password/change', auth, async (req, res) => {
  const userId = res.locals.userId as number
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  })
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!ok) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })

  await logAuditEvent({
    userId,
    action: 'PASSWORD_CHANGE',
    entityType: 'User',
    entityId: userId,
  })

  return res.status(200).json({ ok: true })
})

app.get('/api/leads', auth, async (_req, res) => {
  const userId = res.locals.userId as number
  const leads = await prisma.lead.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, contact: true, source: true, createdAt: true },
  })

  return res.status(200).json({ leads })
})

app.post('/api/leads/create', auth, async (req, res) => {
  const userId = res.locals.userId as number
  const parsed = leadCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const lead = await prisma.lead.create({
    data: {
      userId,
      name: parsed.data.name,
      contact: parsed.data.contact,
      source: parsed.data.source,
    },
    select: { id: true, name: true, contact: true, source: true, createdAt: true },
  })

  await logAuditEvent({
    userId,
    action: 'LEAD_CREATE',
    entityType: 'Lead',
    entityId: lead.id,
    after: lead,
    metadata: { leadName: lead.name },
  })

  return res.status(201).json({ lead })
})

app.post('/api/leads/import', auth, async (req, res) => {
  const userId = res.locals.userId as number
  const parsed = leadImportSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const mode = parsed.data.mode ?? 'always_create'
  const normalized = parsed.data.leads.map((l) => ({
    name: l.name.trim(),
    contact: l.contact === undefined ? undefined : l.contact?.trim() ?? null,
    source: l.source === undefined ? undefined : l.source?.trim() ?? null,
  }))

  let toCreate = normalized
  let skipped = 0

  if (mode === 'skip_exact_duplicates') {
    interface ExistingLead {
      name: string;
      contact: string | null;
      source: string | null;
    }

    const existing: ExistingLead[] = await prisma.lead.findMany({
      where: { userId },
      select: { name: true, contact: true, source: true },
    })

    interface KeyLead {
      name: string;
      contact: string | null;
      source: string | null;
    }

    const keyOf = (lead: KeyLead) =>
      `${lead.name.toLowerCase()}|${(lead.contact ?? '').toLowerCase()}|${(lead.source ?? '').toLowerCase()}`

    const existingKeys: Set<string> = new Set(existing.map((l) => keyOf({ name: l.name, contact: l.contact ?? null, source: l.source ?? null })))

    const next: typeof normalized = []
    for (const lead of normalized) {
      const key = keyOf({ name: lead.name, contact: lead.contact ?? null, source: lead.source ?? null })
      if (existingKeys.has(key)) {
        skipped += 1
        continue
      }
      existingKeys.add(key)
      next.push(lead)
    }
    toCreate = next
  }

  const created = toCreate.length
  if (created > 0) {
    await prisma.lead.createMany({
      data: toCreate.map((l) => ({
        userId,
        name: l.name,
        contact: l.contact ?? undefined,
        source: l.source ?? undefined,
      })),
    })
  }

  await logAuditEvent({
    userId,
    action: 'LEAD_IMPORT',
    entityType: 'Lead',
    metadata: {
      received: normalized.length,
      created,
      skipped,
      mode,
    },
  })

  return res.status(200).json({
    received: normalized.length,
    created,
    skipped,
  })
})

app.delete('/api/leads/delete', auth, async (req, res) => {
  const userId = res.locals.userId as number
  const parsed = leadDeleteSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const lead = await prisma.lead.findFirst({
    where: { id: parsed.data.id, userId },
    select: { id: true, name: true, contact: true, source: true, createdAt: true },
  })
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' })
  }

  await prisma.lead.delete({ where: { id: parsed.data.id } })

  await logAuditEvent({
    userId,
    action: 'LEAD_DELETE',
    entityType: 'Lead',
    entityId: lead.id,
    before: lead,
    metadata: { leadName: lead.name },
  })
  return res.status(200).json({ success: true })
})

app.put('/api/leads/update', auth, async (req, res) => {
  const userId = res.locals.userId as number
  const parsed = leadUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const existing = await prisma.lead.findFirst({
    where: { id: parsed.data.id, userId },
    select: { id: true, name: true, contact: true, source: true, createdAt: true },
  })
  if (!existing) {
    return res.status(404).json({ error: 'Lead not found' })
  }

  const lead = await prisma.lead.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      contact: parsed.data.contact === undefined ? undefined : parsed.data.contact,
      source: parsed.data.source === undefined ? undefined : parsed.data.source,
    },
    select: { id: true, name: true, contact: true, source: true, createdAt: true },
  })

  await logAuditEvent({
    userId,
    action: 'LEAD_UPDATE',
    entityType: 'Lead',
    entityId: lead.id,
    before: existing,
    after: lead,
    metadata: { leadName: lead.name },
  })

  return res.status(200).json({ lead })
})

app.get('/api/audit', auth, async (req, res) => {
  const userId = res.locals.userId as number
  const takeRaw = req.query.take
  const take = Math.max(1, Math.min(200, Number(takeRaw ?? 50)))

  const events = await prisma.auditEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      createdAt: true,
      action: true,
      entityType: true,
      entityId: true,
      before: true,
      after: true,
      metadata: true,
    },
  })

  return res.status(200).json({ events })
})

app.get('/api/dashboard/summary', auth, async (_req, res) => {
  const userId = res.locals.userId as number

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalLeads, leadsThisMonth, recentLeads, groupedBySource] = await Promise.all([
    prisma.lead.count({ where: { userId } }),
    prisma.lead.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
    prisma.lead.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, contact: true, source: true, createdAt: true },
    }),
    prisma.lead.groupBy({
      by: ['source'],
      where: { userId },
      _count: { _all: true },
    }),
  ])

  interface GroupedBySourceRow {
    source: string | null;
    _count: { _all: number };
  }
  interface LeadBySource {
    source: string;
    count: number;
  }

  const leadsBySource: LeadBySource[] = (groupedBySource as GroupedBySourceRow[])
    .map((row) => ({
      source: row.source ?? 'Sem origem',
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const monthLabels: string[] = []
  const monthStarts: Date[] = []
  for (let offset = 4; offset >= 0; offset -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    monthStarts.push(d)
    monthLabels.push(d.toLocaleString('pt-BR', { month: 'short' }))
  }

  const oldestMonthStart = monthStarts[0]
  const leadsSinceOldest = await prisma.lead.findMany({
    where: { userId, createdAt: { gte: oldestMonthStart } },
    select: { createdAt: true },
  })

  const monthCounts = new Array(monthStarts.length).fill(0) as number[]
  for (const lead of leadsSinceOldest) {
    const created = new Date(lead.createdAt)
    const index = monthStarts.findIndex(
      (m) => m.getFullYear() === created.getFullYear() && m.getMonth() === created.getMonth()
    )
    if (index >= 0) monthCounts[index] += 1
  }

  return res.status(200).json({
    stats: {
      totalLeads,
      leadsThisMonth,
    },
    recentLeads,
    leadsBySource,
    leadsByMonth: {
      labels: monthLabels,
      data: monthCounts,
    },
  })
})

export default app
