import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { getNewsletterTemplate, renderNewsletterHtml } from "@/lib/resend"

/**
 * Renders a template with the current admin variable values and returns the
 * resulting HTML for the send dialog's live preview.
 */
async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const templateId = typeof body.templateId === "string" ? body.templateId : ""
    if (!templateId) return validationError("Template ID is required")

    const adminValues: Record<string, string> = {}
    if (body.adminValues && typeof body.adminValues === "object") {
      for (const [key, value] of Object.entries(body.adminValues as Record<string, unknown>)) {
        if (key.startsWith("admin_")) adminValues[key] = value == null ? "" : String(value)
      }
    }

    const template = await getNewsletterTemplate(templateId)
    const html = renderNewsletterHtml(template, adminValues)
    return successResponse({ html })
  } catch (error) {
    console.error("[Admin Newsletter] preview Error:", error)
    return serverError(error instanceof Error ? error.message : undefined)
  }
}

export const POST = withAdminAuth(handlePost)
