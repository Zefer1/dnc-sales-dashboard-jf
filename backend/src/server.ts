import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

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
    select: { id: true, name: true, email: true },
  })

  const token = jwt.sign({ sub: String(user.id), email: user.email }, jwtSecret, { expiresIn: '1h' })
  return res.status(201).json({ token, user })
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

app.get('/api/profile', auth, (_req, res) => {
  return res.status(200).json({ user: res.locals.user })
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

  return res.status(201).json({ lead })
})

app.delete('/api/leads/delete', auth, async (req, res) => {
  const userId = res.locals.userId as number
  const parsed = leadDeleteSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const lead = await prisma.lead.findFirst({ where: { id: parsed.data.id, userId }, select: { id: true } })
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' })
  }

  await prisma.lead.delete({ where: { id: parsed.data.id } })
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
    select: { id: true },
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

  return res.status(200).json({ lead })
})

const port = Number(process.env.PORT ?? 3000)
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`)
})
