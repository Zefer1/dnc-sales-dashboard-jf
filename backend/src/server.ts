import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config()

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

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

const port = Number(process.env.PORT ?? 3000)
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`)
})
