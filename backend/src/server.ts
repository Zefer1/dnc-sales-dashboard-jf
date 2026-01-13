import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config()

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
    const payload = jwt.verify(token, jwtSecret)
    res.locals.user = payload
    return next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true })
})

app.post('/api/login', (req, res) => {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    return res.status(500).json({ error: 'Missing JWT_SECRET' })
  }

  const demoEmail = process.env.DEMO_USER_EMAIL ?? 'user@ex.com'
  const demoPassword = process.env.DEMO_USER_PASSWORD ?? '1234'

  const { email, password } = req.body ?? {}

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email/password' })
  }

  if (email !== demoEmail || password !== demoPassword) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }

  const token = jwt.sign({ sub: '1', email }, jwtSecret, { expiresIn: '1h' })

  return res.status(200).json({
    token,
    user: {
      id: 1,
      name: 'Demo User',
      email,
    },
  })
})

app.get('/api/profile', auth, (_req, res) => {
  return res.status(200).json({ user: res.locals.user })
})

const port = Number(process.env.PORT ?? 3000)
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`)
})
