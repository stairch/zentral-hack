import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { listNewsletterTemplates } from "@/lib/resend"
import {
  TRANSACTIONAL_EMAILS,
  getTransactionalEmailDef,
  getTransactionalTemplateMap,
  setTransactionalTemplateId
} from "@/lib/transactional-emails"

async function handleGet() {
  try {
    const [templates, configured] = await Promise.all([
      listNewsletterTemplates(),
      getTransactionalTemplateMap()
    ])
    const emails = TRANSACTIONAL_EMAILS.map((email) => ({
      key: email.key,
      name: email.name,
      description: email.description,
      defaultAlias: email.defaultAlias,
      templateId: configured[email.key] ?? null
    }))
    return successResponse({ emails, templates })
  } catch (error) {
    console.error("[Admin Transactional Emails] GET Error:", error)
    return serverError(error instanceof Error ? error.message : undefined)
  }
}

async function handlePut(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const key = typeof body.key === "string" ? body.key : ""
    if (!key || !getTransactionalEmailDef(key)) {
      return validationError("Unknown transactional email key")
    }

    const templateId = typeof body.templateId === "string" ? body.templateId.trim() : ""
    if (templateId) {
      const templates = await listNewsletterTemplates()
      if (!templates.some((template) => template.id === templateId)) {
        return validationError("Template not found or not published")
      }
    }

    await setTransactionalTemplateId(key, templateId || null)
    return successResponse({ message: "Template saved" })
  } catch (error) {
    console.error("[Admin Transactional Emails] PUT Error:", error)
    return serverError(error instanceof Error ? error.message : undefined)
  }
}

export const GET = withAdminAuth(handleGet as Parameters<typeof withAdminAuth>[0])
export const PUT = withAdminAuth(handlePut)
