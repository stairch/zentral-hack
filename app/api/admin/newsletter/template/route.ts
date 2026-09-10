import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { getEmailTemplate } from "@/lib/resend"

/**
 * Returns a template's editable variables for the send dialog. The raw template
 * HTML is intentionally not exposed to the client.
 */
async function handleGet(req: AuthenticatedRequest) {
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return validationError("Template ID is required")

  try {
    const template = await getEmailTemplate(id)
    return successResponse({
      template: {
        id: template.id,
        name: template.name,
        alias: template.alias,
        subject: template.subject,
        updatedAt: template.updatedAt,
        variables: template.variables
      }
    })
  } catch (error) {
    console.error("[Admin Newsletter] template GET Error:", error)
    return serverError(error instanceof Error ? error.message : undefined)
  }
}

export const GET = withAdminAuth(handleGet)
