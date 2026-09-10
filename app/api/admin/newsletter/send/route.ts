import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { sendNewsletterCampaign } from "@/lib/resend"

async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const id = typeof body.id === "string" ? body.id : ""
    const name = typeof body.name === "string" ? body.name : ""
    const templateId = typeof body.templateId === "string" ? body.templateId : ""
    const segmentId = typeof body.segmentId === "string" ? body.segmentId : ""
    const scheduledAt =
      typeof body.scheduledAt === "string" && body.scheduledAt ? body.scheduledAt : undefined

    const adminValues: Record<string, string> = {}
    if (body.adminValues && typeof body.adminValues === "object") {
      for (const [key, value] of Object.entries(body.adminValues as Record<string, unknown>)) {
        if (key.startsWith("admin_")) adminValues[key] = value == null ? "" : String(value)
      }
    }

    if (!id) return validationError("Campaign ID is required")
    if (!templateId) return validationError("Please select a template")
    if (!segmentId) return validationError("Please select an audience")

    await sendNewsletterCampaign(id, name, { templateId, segmentId, adminValues, scheduledAt })
    return successResponse({ message: scheduledAt ? "Campaign scheduled" : "Campaign sent" })
  } catch (error) {
    console.error("[Admin Newsletter] send Error:", error)
    return serverError(error instanceof Error ? error.message : undefined)
  }
}

export const POST = withAdminAuth(handlePost)
