import { Resend } from "resend"

let resendClient: Resend | null = null

function getResend(): Resend {
  if (resendClient) return resendClient

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set")
  }

  resendClient = new Resend(apiKey)
  return resendClient
}

const resend = new Proxy({} as Resend, {
  get(_target, prop, receiver) {
    return Reflect.get(getResend(), prop, receiver)
  }
})

const NEWSLETTER_FROM = process.env.RESEND_NEWSLETTER_FROM ?? "Zentral Hack <newsletter@zentralhack.ch>"
const NEWSLETTER_DEFAULT_SEGMENT_ID = process.env.RESEND_NEWSLETTER_DEFAULT_SEGMENT_ID ?? null

export async function addSubscriber(email: string): Promise<string> {
  const segmentId = await resolveDefaultSegmentId()

  const { data, error } = await resend.contacts.create({
    email,
    segments: [{ id: segmentId }],
    unsubscribed: false
  })

  if (error) {
    throw new Error(`Resend contact could not be created: ${error.message}`)
  }

  return data.id
}

export async function removeSubscriber(email: string): Promise<void> {
  const { error } = await resend.contacts.remove({
    email
  })

  if (error) {
    if (error.statusCode == 404) {
      // not found, already not in subscribers list
      return
    }

    throw new Error(`Resend contact could not be removed: ${error.message}`)
  }
}

export async function getAllSubscribers(): Promise<string[]> {
  const emails: string[] = []
  let after: string | undefined = undefined

  while (true) {
    const { data, error } = await resend.contacts.list({
      limit: 100,
      ...(after ? { after } : {})
    })

    if (error) {
      throw new Error(`Failed to fetch contacts: ${error.message}`)
    }

    if (!data || data.data.length === 0) {
      break
    }

    for (const contact of data.data) {
      if (!contact.unsubscribed) {
        emails.push(contact.email)
      }
    }

    if (!data.has_more) {
      break
    }

    after = data.data[data.data.length - 1].id
  }

  return emails
}

export type NewsletterCampaignStatus = "draft" | "queued" | "sent" | "scheduled" | "canceled"

export interface NewsletterCampaign {
  id: string
  name: string
  status: NewsletterCampaignStatus
  segmentId: string | null
  createdAt: string
  scheduledAt: string | null
  sentAt: string | null
  lastModifiedAt: string
}

export interface NewsletterCampaignDetail extends NewsletterCampaign {
  subject: string | null
  previewText: string | null
  from: string | null
  /** Template referenced by the last render, parsed from the HTML marker. */
  templateId: string | null
}

export interface NewsletterSegment {
  id: string
  name: string
}

export interface NewsletterTemplateVariable {
  key: string
  type: "string" | "number"
  fallbackValue: string | null
  /** true when the key is admin-editable (prefix "admin_"). */
  editable: boolean
}

export interface NewsletterTemplateSummary {
  id: string
  name: string
  alias: string | null
  updatedAt: string
}

export interface NewsletterTemplateDetail extends NewsletterTemplateSummary {
  subject: string | null
  /** Raw template HTML with `{{{variable}}}` merge tags. Server-side only. */
  html: string
  variables: NewsletterTemplateVariable[]
}

const TEMPLATE_MARKER = /^<!--\s*zh-template:([a-zA-Z0-9-]+)\s*-->/

function unwrap<T>(result: { data: T | null; error: { message: string } | null }, context: string): T {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`)
  }
  if (result.data === null) {
    throw new Error(`${context}: empty response`)
  }
  return result.data
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function isEditableVariableKey(key: string): boolean {
  return key.startsWith("admin_")
}

async function resolveDefaultSegmentId(): Promise<string> {
  if (NEWSLETTER_DEFAULT_SEGMENT_ID) return NEWSLETTER_DEFAULT_SEGMENT_ID
  const segments = await listNewsletterSegments()
  if (segments.length === 0) {
    throw new Error(
      "No Resend segment available. Create a segment in Resend or set RESEND_NEWSLETTER_DEFAULT_SEGMENT_ID."
    )
  }
  return segments[0].id
}

export async function listNewsletterSegments(): Promise<NewsletterSegment[]> {
  const data = unwrap(await resend.segments.list(), "Failed to list segments")
  return data.data.map((segment) => ({ id: segment.id, name: segment.name }))
}

export async function listNewsletterTemplates(): Promise<NewsletterTemplateSummary[]> {
  const data = unwrap(await resend.templates.list(), "Failed to list templates")
  return data.data
    .filter((template) => template.status === "published")
    .map((template) => ({
      id: template.id,
      name: template.name,
      alias: template.alias,
      updatedAt: template.updated_at
    }))
}

export async function getNewsletterTemplate(id: string): Promise<NewsletterTemplateDetail> {
  const template = unwrap(await resend.templates.get(id), "Failed to load template")
  return {
    id: template.id,
    name: template.name,
    alias: template.alias,
    updatedAt: template.updated_at,
    subject: template.subject,
    html: template.html ?? "",
    variables: (template.variables ?? []).map((variable) => ({
      key: variable.key,
      type: variable.type,
      fallbackValue: variable.fallback_value === null ? null : String(variable.fallback_value),
      editable: isEditableVariableKey(variable.key)
    }))
  }
}

function toCampaign(broadcast: {
  id: string
  name: string
  status: NewsletterCampaignStatus
  segment_id: string | null
  created_at: string
  scheduled_at: string | null
  sent_at: string | null
}): NewsletterCampaign {
  return {
    id: broadcast.id,
    name: broadcast.name,
    status: broadcast.status,
    segmentId: broadcast.segment_id,
    createdAt: broadcast.created_at,
    scheduledAt: broadcast.scheduled_at,
    sentAt: broadcast.sent_at,
    lastModifiedAt: broadcast.sent_at ?? broadcast.scheduled_at ?? broadcast.created_at
  }
}

export async function listNewsletterCampaigns(): Promise<NewsletterCampaign[]> {
  const data = unwrap(await resend.broadcasts.list(), "Failed to list broadcasts")
  return data.data
    .map((broadcast) => toCampaign(broadcast as Parameters<typeof toCampaign>[0]))
    .sort((a, b) => b.lastModifiedAt.localeCompare(a.lastModifiedAt))
}

export async function getNewsletterCampaign(id: string): Promise<NewsletterCampaignDetail> {
  const broadcast = unwrap(await resend.broadcasts.get(id), "Failed to load broadcast")
  const marker = broadcast.html?.match(TEMPLATE_MARKER)
  return {
    ...toCampaign(broadcast as Parameters<typeof toCampaign>[0]),
    subject: broadcast.subject,
    previewText: broadcast.preview_text,
    from: broadcast.from,
    templateId: marker ? marker[1] : null
  }
}

export async function createNewsletterCampaign(input: {
  name: string
  subject: string
  previewText?: string
}): Promise<string> {
  const segmentId = await resolveDefaultSegmentId()
  const data = unwrap(
    await resend.broadcasts.create({
      name: input.name,
      subject: input.subject,
      previewText: input.previewText || undefined,
      from: NEWSLETTER_FROM,
      segmentId,
      // Placeholder body; the real content is rendered from a template at send time.
      html: "<p></p>"
    }),
    "Failed to create broadcast"
  )
  return data.id
}

export async function updateNewsletterCampaign(
  id: string,
  input: { name?: string; subject?: string; previewText?: string }
): Promise<void> {
  unwrap(
    await resend.broadcasts.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.previewText !== undefined ? { previewText: input.previewText } : {})
    }),
    "Failed to update broadcast"
  )
}

export async function deleteNewsletterCampaign(id: string): Promise<void> {
  unwrap(await resend.broadcasts.remove(id), "Failed to delete broadcast")
}

export async function cancelNewsletterCampaign(id: string): Promise<void> {
  unwrap(await resend.broadcasts.cancel(id), "Failed to cancel broadcast")
}

export function renderNewsletterHtml(
  template: NewsletterTemplateDetail,
  adminValues: Record<string, string>
): string {
  let html = template.html ?? ""
  for (const variable of template.variables) {
    const raw = variable.editable
      ? (adminValues[variable.key] ?? variable.fallbackValue ?? "")
      : (variable.fallbackValue ?? "")
    const replacement = escapeHtml(raw)
    const pattern = new RegExp(`\\{\\{\\{\\s*${escapeRegExp(variable.key)}\\s*(\\|[^}]*)?\\}\\}\\}`, "g")
    html = html.replace(pattern, replacement)
  }
  return html
}

/** Sentinel target meaning "all contacts" (resolved to the default segment). */
export const NEWSLETTER_ALL_CONTACTS = "__all__"

export async function sendNewsletterCampaign(
  id: string,
  name: string,
  input: { templateId: string; segmentId: string; adminValues: Record<string, string>; scheduledAt?: string }
): Promise<void> {
  const template = await getNewsletterTemplate(input.templateId)
  const body = renderNewsletterHtml(template, input.adminValues)
  const html = `<!-- zh-template:${input.templateId} -->\n${body}`
  const segmentId =
    input.segmentId === NEWSLETTER_ALL_CONTACTS ? await resolveDefaultSegmentId() : input.segmentId

  // due to a bug in the API, we need to send the name in the update request to prevent the name is renamed to "Untitled"
  unwrap(await resend.broadcasts.update(id, { name, html, segmentId }), "Failed to prepare broadcast")
  unwrap(
    await resend.broadcasts.send(id, input.scheduledAt ? { scheduledAt: input.scheduledAt } : undefined),
    "Failed to send broadcast"
  )
}
