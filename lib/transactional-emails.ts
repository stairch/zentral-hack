import { query } from "@/lib/db"
import {
  getNewsletterTemplate,
  getNewsletterTemplateByAlias,
  renderNewsletterHtml,
  type NewsletterTemplateDetail
} from "@/lib/resend"

const SETTINGS_KEY = "transactional_email_templates"

export interface TransactionalEmailDef {
  key: string
  name: { de: string; en: string }
  description: { de: string; en: string }
  defaultAlias: string
  previewValues: Record<string, string>
}

const PREVIEW_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://zentralhack.ch"

export const TRANSACTIONAL_EMAILS: TransactionalEmailDef[] = [
  {
    key: "newsletter-opt-in",
    name: {
      de: "Newsletter Bestätigung",
      en: "Newsletter Confirmation"
    },
    description: {
      de: "Double-Opt-In-Bestätigung, die nach der Anmeldung über den CTA-Bereich verschickt wird.",
      en: "Double opt-in confirmation sent after signing up via the CTA section."
    },
    defaultAlias: "newsletter-opt-in",
    previewValues: {
      confirm_url: `${PREVIEW_BASE_URL}/api/newsletter/confirm?token=preview-token`
    }
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

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
    const referenced = new RegExp(`\\{\\{\\{\\s*${escapeRegExp(tag)}\\s*(\\|[^}]*)?\\}\\}\\}`).test(html)
    return !declared && !referenced
  })
}

/**
 * Renders a template for the admin live preview: template-declared variables get
 * their fallback values, and the email's sample merge tags (e.g. `confirm_url`)
 * are substituted with realistic placeholder values.
 */
export function renderTransactionalPreview(
  template: NewsletterTemplateDetail,
  def: TransactionalEmailDef
): string {
  // Keep merge tags that we fill ourselves out of the generic variable pass.
  const filtered: NewsletterTemplateDetail = {
    ...template,
    variables: template.variables.filter((variable) => !(variable.key in def.previewValues))
  }
  let html = renderNewsletterHtml(filtered, {})
  for (const [tag, value] of Object.entries(def.previewValues)) {
    const pattern = new RegExp(`\\{\\{\\{\\s*${escapeRegExp(tag)}\\s*(\\|[^}]*)?\\}\\}\\}`, "g")
    html = html.replace(pattern, escapeHtml(value))
  }
  return html
}
