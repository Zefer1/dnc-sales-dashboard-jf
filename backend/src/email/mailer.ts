import nodemailer from 'nodemailer'

export type SendEmailParams = {
  to: string
  subject: string
  text: string
  html?: string
}

function getMissingSmtpVars() {
  const missing: string[] = []
  if (!process.env.SMTP_HOST) missing.push('SMTP_HOST')
  if (!process.env.SMTP_USER) missing.push('SMTP_USER')
  if (!process.env.SMTP_PASS) missing.push('SMTP_PASS')
  return missing
}

function getSmtpPort() {
  // Gmail defaults to 587 (STARTTLS)
  const raw = process.env.SMTP_PORT?.trim()
  if (!raw) return 587

  const port = Number(raw)
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('Invalid SMTP_PORT')
  }
  return port
}

function getSmtpSecure(port: number) {
  const raw = process.env.SMTP_SECURE?.trim().toLowerCase()
  if (raw === 'true') return true
  if (raw === 'false') return false
  return port === 465
}

export function canSendEmail() {
  return getMissingSmtpVars().length === 0
}

export async function sendEmail(params: SendEmailParams) {
  const missing = getMissingSmtpVars()
  if (missing.length > 0) {
    throw new Error(`SMTP is not configured (missing: ${missing.join(', ')})`)
  }

  const port = getSmtpPort()
  const secure = getSmtpSecure(port)
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  })
}
