import nodemailer from "nodemailer"
import { renderTransactionalHtml } from "@/lib/email-render"
import { getTransactionalEmailDef, resolveTransactionalTemplate } from "@/lib/transactional-emails"

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  })

  return transporter
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const transporter = getTransporter()

    await transporter.sendMail({
      from: `${process.env.SMTP_FROM_NAME || "Zentral Hack"} <${process.env.SMTP_FROM}>`,
      ...options
    })
  } catch (error) {
    console.error("Email sending failed:", error)
    throw new Error("Failed to send email")
  }
}

/**
 * Resolves the Resend template an admin selected for a system message, renders it
 * with the given merge values and sends it. When no template can be resolved the
 * definition's built-in `fallbackHtml` is used so critical flows keep working.
 */
export async function sendTransactionalEmail(
  key: string,
  { to, values }: { to: string | string[]; values: Record<string, string> }
): Promise<void> {
  const def = getTransactionalEmailDef(key)
  if (!def) throw new Error(`Unknown transactional email "${key}"`)

  let html: string
  let subject: string
  try {
    const template = await resolveTransactionalTemplate(key)
    html = renderTransactionalHtml(template, values)
    subject = template.subject || def.defaultSubject
  } catch (error) {
    if (!def.fallbackHtml) throw error
    console.warn(`[email] No Resend template for "${key}", using built-in fallback:`, error)
    html = def.fallbackHtml(values)
    subject = def.defaultSubject
  }

  return sendEmail({ to, subject, html, text: def.buildText?.(values) })
}

export function sendNewsletterOptInEmail(to: string, confirmUrl: string): Promise<void> {
  return sendTransactionalEmail("newsletter-opt-in", { to, values: { confirm_url: confirmUrl } })
}

export function sendGeneral2FACodeEmail(to: string, code: string): Promise<void> {
  return sendTransactionalEmail("2fa-code-general", { to, values: { code } })
}

export function sendNewEmail2FACodeEmail(to: string, code: string): Promise<void> {
  return sendTransactionalEmail("2fa-code-new-e-mail-address", { to, values: { code } })
}
