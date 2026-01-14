import nodemailer from 'nodemailer'

export type SendEmailParams = {
  to: string
  subject: string
  text: string
  html?: string
}

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  )
}

export function canSendEmail() {
  return isEmailConfigured()
}

export async function sendEmail(params: SendEmailParams) {
  if (!isEmailConfigured()) {
    throw new Error('SMTP is not configured (missing SMTP_* env vars)')
  }

  const port = Number(process.env.SMTP_PORT)
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('Invalid SMTP_PORT')
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  })
}
