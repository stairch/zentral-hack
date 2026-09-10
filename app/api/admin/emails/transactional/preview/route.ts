import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { getNewsletterTemplate, type NewsletterTemplateDetail } from "@/lib/resend"
import { findMissingTemplateVariables, renderTransactionalPreview } from "@/lib/email-render"
import { getTransactionalEmailDef, resolveTransactionalTemplate } from "@/lib/transactional-emails"

/**
 * Renders the live preview for a transactional email. When `templateId` is given
 * that template is previewed (before saving); otherwise the currently configured
 * template is used. When no template can be resolved, the definition's built-in
 * `fallbackHtml` is previewed.
 */
async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const key = typeof body.key === "string" ? body.key : ""
    const def = getTransactionalEmailDef(key)
    if (!def) return validationError("Unknown transactional email key")

    const templateId = typeof body.templateId === "string" ? body.templateId.trim() : ""

    let template: NewsletterTemplateDetail | null = null
    try {
      template = templateId
        ? await getNewsletterTemplate(templateId)
        : await resolveTransactionalTemplate(key)
    } catch (error) {
      if (templateId || !def.fallbackHtml) throw error
    }

    if (!template) {
      return successResponse({
        html: def.fallbackHtml!(def.previewValues),
        missingVariables: []
      })
    }

    return successResponse({
      html: renderTransactionalPreview(template, def),
      missingVariables: findMissingTemplateVariables(template, def)
    })
  } catch (error) {
    console.error("[Admin Transactional Emails] preview Error:", error)
    return serverError(error instanceof Error ? error.message : undefined)
  }
}

export const POST = withAdminAuth(handlePost)
