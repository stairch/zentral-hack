import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { cancelNewsletterCampaign } from "@/lib/resend"

async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const id = typeof body.id === "string" ? body.id : ""
    if (!id) return validationError("Campaign ID is required")

    await cancelNewsletterCampaign(id)
    return successResponse({ message: "Campaign canceled" })
  } catch (error) {
    console.error("[Admin Newsletter] cancel Error:", error)
    return serverError(error instanceof Error ? error.message : undefined)
  }
}

export const POST = withAdminAuth(handlePost)
