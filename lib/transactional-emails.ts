import { query } from "@/lib/db"
import { escapeHtml } from "@/lib/email-render"
import { getEmailTemplate, type NewsletterTemplateDetail } from "@/lib/resend"
import nodemailer, { Transporter } from "nodemailer"
import { renderMergeTags, renderTransactionalHtml } from "@/lib/email-render"

const SETTINGS_KEY = "transactional_email_templates"

const PREVIEW_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://zentralhack.ch"

export interface TransactionalEmailDef {
  key: string
  name: { de: string; en: string }
  description: { de: string; en: string }
  /** Subject used when the resolved Resend template has none. */
  defaultSubject: string
  /**
   * Merge tags this email fills at send time. The values here are only the
   * samples rendered in the admin live preview.
   */
  previewValues: Record<string, string>
  /** Plain-text alternative. Receives the real merge values on send. */
  buildText?: (values: Record<string, string>) => string
  /**
   * Fallback when no Resend template can be resolved. Keeps
   * critical flows (e.g. 2FA login) working before a template is configured.
   */
  fallbackHtml?: (values: Record<string, string>) => string
}

export const TRANSACTIONAL_EMAILS: TransactionalEmailDef[] = [
  {
    key: "newsletter-opt-in",
    name: { de: "Newsletter Bestätigung", en: "Newsletter Confirmation" },
    description: {
      de: "Double-Opt-In-Bestätigung, die nach der Anmeldung über den CTA-Bereich verschickt wird.",
      en: "Double opt-in confirmation sent after signing up via the CTA section."
    },
    defaultSubject: "Bestätige deine Newsletter Anmeldung",
    previewValues: {
      confirm_url: `${PREVIEW_BASE_URL}/api/newsletter/confirm?token=preview-token`
    },
    buildText: (values) =>
      `Bitte bestätige deine Newsletter-Anmeldung zum Zentral Hack: ${values.confirm_url}`
  },
  {
    key: "2fa-code-general",
    name: { de: "2FA-Code - Allgemein", en: "2FA code - General" },
    description: {
      de: "E-Mail für allgemeine Verifizierungen (z.B. Anmeldungen).",
      en: "E-Mail for general verifications (e.g. logins)."
    },
    defaultSubject: "Bitte bestätige deine E-Mail-Adresse",
    previewValues: { code: "1A2B3C" },
    buildText: (values) => `Dein 2FA Code: ${values.code}`,
    fallbackHtml: (values) => `
    <h2>Dein 2FA-Code für Zentral Hack</h2>
    <p>Um dich anzumelden, verwende bitte folgenden Verifizierungscode:</p>
    <h1 style="letter-spacing: 0.1em; font-size: 36px; margin: 20px 0; font-family: monospace; color: #530A5D;">${escapeHtml(values.code ?? "")}</h1>
    <p>Dieser Code verfällt in 15 Minuten.</p>
    <p style="color: #666; font-size: 12px;">Falls du dich nicht angemeldet hast, ignoriere diese E-Mail und ändere dein Passwort.</p>
  `
  },
  {
    key: "2fa-code-new-e-mail-address",
    name: { de: "2FA-Code - Neue E-Mail-Adresse", en: "2FA code - New e-mail address" },
    description: {
      de: "E-Mail für die Verifizierung der neuen E-Mail-Adresse.",
      en: "E-Mail for the verification of the new e-mail address."
    },
    defaultSubject: "Bitte bestätige deine neue E-Mail-Adresse",
    previewValues: { code: "1A2B3C" },
    buildText: (values) => `Dein 2FA Code: ${values.code}`,
    fallbackHtml: (values) => `
    <h2>Neue E-Mail-Adresse bestätigen</h2>
    <p>Du hast beantragt, deine E-Mail-Adresse für dein Zentral Hack Konto zu ändern. Verwende folgenden Code, um diese neue Adresse zu bestätigen:</p>
    <h1 style="letter-spacing: 0.1em; font-size: 36px; margin: 20px 0; font-family: monospace; color: #530A5D;">${escapeHtml(values.code ?? "")}</h1>
    <p>Dieser Code verfällt in 15 Minuten.</p>
    <p style="color: #666; font-size: 12px;">Falls du diese Änderung nicht angefordert hast, ignoriere diese E-Mail.</p>
  `
  },
  {
    key: "2fa-code-password-reset",
    name: { de: "2FA-Code - Passwort zurücksetzen", en: "2FA code - Password reset" },
    description: {
      de: "E-Mail für die Verifizierung der E-Mail-Adresse zum Zurücksetzen des Passworts.",
      en: "E-Mail for the verification of the e-mail address to reset the password."
    },
    defaultSubject: "Passwort zurücksetzen",
    previewValues: { code: "1A2B3C" },
    buildText: (values) => `Dein 2FA Code: ${values.code}`,
    fallbackHtml: (values) => `
    <h2>Passwort zurücksetzen</h2>
    <p>Wir haben eine Anfrage erhalten, dein Passwort für dein Zentral Hack Konto zurückzusetzen. Verwende folgenden Code, um fortzufahren:</p>
    <h1 style="letter-spacing: 0.1em; font-size: 36px; margin: 20px 0; font-family: monospace; color: #530A5D;">${escapeHtml(values.code ?? "")}</h1>
    <p>Dieser Code verfällt in 15 Minuten.</p>
    <p style="color: #666; font-size: 12px;">Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail.</p>
  `
  },
  {
    key: "register-confirmation",
    name: { de: "Registrierung Bestätigung", en: "Registration Confirmation" },
    description: {
      de: "E-Mail für die Bestätigung der Registrierung.",
      en: "E-Mail for the confirmation of the registration."
    },
    defaultSubject: "Bestätigung deiner Registrierung",
    previewValues: {
      given_name: "Max",
      family_name: "Mustermann",
      category: "Campus Challenge",
      university: "Hochschule Luzern (HSLU)",
      study_program: "Informatik",
      semester: "2",
      allergies: "—",
      dietary_restrictions: "Vegetarisch"
    },
    buildText: (_) => "Herzlich Willkommen zum Zentral Hack!",
    fallbackHtml: (values) => `
    <h2>Herzlich Willkommen zum Zentral Hack!</h2>
    <p>Hallo ${escapeHtml(values.given_name ?? "")} ${escapeHtml(values.family_name ?? "")}</p>
    <p>Gerne bestätigen wir deine Registrierung und freuen uns auf deine Teilnahme am Zentral Hack!</p>
    <p><a href="https://zentralhack.ch/dashboard" style="color: #530A5D; font-weight: 600;">Zum Dashboard</a></p>
    <p>Unten findest du eine Übersicht deiner Angaben.</p>
    <table style="border-collapse: collapse; font-size: 14px;">
      <tr><td style="padding: 4px 12px 4px 0; font-weight: 600; color: #530A5D;">Name</td><td style="padding: 4px 0;">${escapeHtml(values.given_name ?? "")} ${escapeHtml(values.family_name ?? "")}</td></tr>
      <tr><td style="padding: 4px 12px 4px 0; font-weight: 600; color: #530A5D;">Kategorie</td><td style="padding: 4px 0;">${escapeHtml(values.category ?? "")}</td></tr>
      <tr><td style="padding: 4px 12px 4px 0; font-weight: 600; color: #530A5D;">Universität / Schule / Firma</td><td style="padding: 4px 0;">${escapeHtml(values.university ?? "")}</td></tr>
      <tr><td style="padding: 4px 12px 4px 0; font-weight: 600; color: #530A5D;">Studiengang / Ausbildung / Beruf</td><td style="padding: 4px 0;">${escapeHtml(values.study_program ?? "")}</td></tr>
      <tr><td style="padding: 4px 12px 4px 0; font-weight: 600; color: #530A5D;">Studiensemester / Ausbildungsjahr / Berufsjahre</td><td style="padding: 4px 0;">${escapeHtml(values.semester ?? "")}</td></tr>
      <tr><td style="padding: 4px 12px 4px 0; font-weight: 600; color: #530A5D;">Allergien</td><td style="padding: 4px 0;">${escapeHtml(values.allergies ?? "")}</td></tr>
      <tr><td style="padding: 4px 12px 4px 0; font-weight: 600; color: #530A5D;">Diätetische Einschränkungen</td><td style="padding: 4px 0;">${escapeHtml(values.dietary_restrictions ?? "")}</td></tr>
    </table>
    <p>Fragen? Lies unser <a href="https://zentralhack.ch#faq" style="color: #530A5D; text-decoration: underline; font-weight: 600;">FAQ</a> oder antworte auf diese E-Mail.</p>
    <p style="color: #666; font-size: 12px;">Beste Grüsse<br />Dein Zentral Hack Team</p>
    `
  },
  {
    key: "new-sponsoring-request",
    name: { de: "Neue Sponsorenanfrage", en: "New Sponsoring Request" },
    description: {
      de: "E-Mail für die interne Benachrichtigung einer neuen Sponsorenanfrage.",
      en: "E-Mail for the internal notification of a new sponsoring request."
    },
    defaultSubject: "Neue Sponsorenanfrage",
    previewValues: { company_name: "Acme Inc." },
    buildText: (values) => `Neue Sponsorenanfrage von ${values.company_name}`,
    fallbackHtml: (values) => `
    <h2>Es wurde eine neue Sponsorenanfrage eingereicht!</h2>
    <p>Firma: ${values.company_name}</p>
    <p>Siehe weitere Informationen im Admin Panel</p>
    <a href="https://zentralhack.ch/admin/sponsors" style="display: inline-block; padding: 10px 20px; background: #530A5D; color: white; text-decoration: none; border-radius: 5px;">Zum Admin Panel</a>
  `
  }
]

export function getTransactionalEmailDef(key: string): TransactionalEmailDef | undefined {
  return TRANSACTIONAL_EMAILS.find((email) => email.key === key)
}

type TemplateMap = Record<string, string>

export async function getTransactionalTemplateMap(): Promise<TemplateMap> {
  const result = await query("SELECT value FROM site_settings WHERE key = $1", [SETTINGS_KEY])
  const value = result.rows[0]?.value

  if (!value || typeof value !== "object") return {}

  const map: TemplateMap = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string" && v) map[k] = v
  }
  return map
}

async function getTransactionalTemplateId(key: string): Promise<string | null> {
  const map = await getTransactionalTemplateMap()
  return map[key] ?? null
}

export async function setTransactionalTemplateId(key: string, templateId: string | null): Promise<void> {
  const map = await getTransactionalTemplateMap()
  if (templateId) {
    map[key] = templateId
  } else {
    delete map[key]
  }
  await query(
    `INSERT INTO site_settings (key, value, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
    [SETTINGS_KEY, JSON.stringify(map)]
  )
}

export async function resolveTransactionalTemplate(key: string): Promise<NewsletterTemplateDetail> {
  const def = getTransactionalEmailDef(key)
  if (!def) throw new Error(`Unknown transactional email "${key}"`)

  const configuredId = await getTransactionalTemplateId(key)
  if (!configuredId) {
    throw new Error(`No Resend template configured for transactional email "${key}"`)
  }
  return getEmailTemplate(configuredId)
}

let transporter: Transporter | null = null

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

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string[] | undefined
}

async function sendEmail(options: EmailOptions): Promise<void> {
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
async function sendTransactionalEmail(
  key: string,
  { to, values }: { to: string | string[]; values: Record<string, string> }
): Promise<void> {
  const def = getTransactionalEmailDef(key)
  if (!def) throw new Error(`Unknown transactional email "${key}"`)

  let html: string
  let subject: string
  let replyTo: string[]
  try {
    const template = await resolveTransactionalTemplate(key)
    html = renderTransactionalHtml(template, values)
    subject = template.subject ? renderMergeTags(template.subject, values) : def.defaultSubject
    replyTo = template.reply_to || []
  } catch (error) {
    if (!def.fallbackHtml) throw error
    console.warn(`[email] No Resend template for "${key}", using built-in fallback:`, error)
    html = def.fallbackHtml(values)
    subject = def.defaultSubject
    replyTo = []
  }

  return sendEmail({ to, subject, html, text: def.buildText?.(values), replyTo })
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

export function sendPasswordReset2FACodeEmail(to: string, code: string): Promise<void> {
  return sendTransactionalEmail("2fa-code-password-reset", { to, values: { code } })
}

export function sendRegisterConfirmationEmail(
  to: string,
  values: {
    given_name: string
    family_name: string
    category: string
    university: string
    study_program: string
    semester: string
    allergies: string
    dietary_restrictions: string
  }
): Promise<void> {
  return sendTransactionalEmail("register-confirmation", { to, values })
}

export function sendNewSponsorEmail(to: string[], companyName: string): Promise<void> {
  return sendTransactionalEmail("new-sponsoring-request", { to, values: { company_name: companyName } })
}
