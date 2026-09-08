import { query } from "@/lib/db"
import {
  getNewsletterTemplate,
  getNewsletterTemplateByAlias,
  renderNewsletterHtml,
  type NewsletterTemplateDetail
} from "@/lib/resend"

const SETTINGS_KEY = "transactional_email_templates"

const PREVIEW_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://zentralhack.ch"

export interface TransactionalEmailDef {
  key: string
  name: { de: string; en: string }
  description: { de: string; en: string }
  /** Resend template alias used until an admin picks a template. */
  defaultAlias: string
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
    defaultAlias: "newsletter-opt-in",
    defaultSubject: "Bestätige deine Newsletter Anmeldung",
    previewValues: {
      confirm_url: `${PREVIEW_BASE_URL}/api/newsletter/confirm?token=preview-token`
    },
    buildText: (values) =>
      `Bitte bestätige deine Newsletter-Anmeldung zum Zentral Hack: ${values.confirm_url}`
  },
  {
    key: "2fa-code",
    name: { de: "2FA-Code", en: "2FA code" },
    description: {
      de: "Verifizierungscode für die Anmeldung, wird bei jedem Login mit aktivierter 2FA gesendet.",
      en: "Verification code for signing in, sent on every login when 2FA is enabled."
    },
    defaultAlias: "2fa-code",
    defaultSubject: "Zentral Hack - Dein 2FA Code",
    previewValues: { code: "123456" },
    buildText: (values) => `Dein 2FA Code: ${values.code}`,
    fallbackHtml: (values) => `
    <h2>Dein 2FA-Code für Zentral Hack</h2>
    <p>Um dich anzumelden, verwende bitte folgenden Verifizierungscode:</p>
    <h1 style="letter-spacing: 0.1em; font-size: 36px; margin: 20px 0; font-family: monospace; color: #530A5D;">${values.code}</h1>
    <p>Dieser Code verfällt in 15 Minuten.</p>
    <p style="color: #666; font-size: 12px;">Falls du dich nicht angemeldet hast, ignoriere diese E-Mail und ändere dein Passwort.</p>
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

export async function getTransactionalTemplateId(key: string): Promise<string | null> {
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
  if (configuredId) {
    return getNewsletterTemplate(configuredId)
  }
  return getNewsletterTemplateByAlias(def.defaultAlias)
}

/** Matches a `{{{tag}}}` merge tag, optionally with a `{{{tag|default}}}` fallback. */
function mergeTagPattern(tag: string, flags = ""): RegExp {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`\\{\\{\\{\\s*${escaped}\\s*(\\|[^}]*)?\\}\\}\\}`, flags)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Replaces every `{{{tag}}}` occurrence for the given values (HTML-escaped). */
export function renderMergeTags(html: string, values: Record<string, string>): string {
  let out = html
  for (const [tag, value] of Object.entries(values)) {
    out = out.replace(mergeTagPattern(tag, "g"), escapeHtml(value))
  }
  return out
}

/**
 * Renders the final HTML for a system message: template-declared variables get
 * their fallback values, then the email's merge tags are replaced with `values`.
 * The admin preview and the real send both go through here.
 */
export function renderTransactionalHtml(
  template: NewsletterTemplateDetail,
  values: Record<string, string>
): string {
  const filtered: NewsletterTemplateDetail = {
    ...template,
    variables: template.variables.filter((variable) => !(variable.key in values))
  }
  return renderMergeTags(renderNewsletterHtml(filtered, {}), values)
}

/** Admin live preview: the final render using the definition's sample values. */
export function renderTransactionalPreview(
  template: NewsletterTemplateDetail,
  def: TransactionalEmailDef
): string {
  return renderTransactionalHtml(template, def.previewValues)
}

/** Merge tags a system message injects at send time and therefore requires in its template. */
export function getRequiredTemplateVariables(def: TransactionalEmailDef): string[] {
  return Object.keys(def.previewValues)
}

/**
 * Returns the required merge tags that the given template neither declares as a
 * variable nor references via a `{{{tag}}}` placeholder in its HTML.
 */
export function findMissingTemplateVariables(
  template: NewsletterTemplateDetail,
  def: TransactionalEmailDef
): string[] {
  const html = template.html ?? ""
  return getRequiredTemplateVariables(def).filter((tag) => {
    const declared = template.variables.some((variable) => variable.key === tag)
    const referenced = mergeTagPattern(tag).test(html)
    return !declared && !referenced
  })
}
