import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, serverError } from "@/lib/api"
import { getNewsletterAudienceCounts } from "@/lib/resend"

async function handleGet(_req: AuthenticatedRequest) {
  try {
    const counts = await getNewsletterAudienceCounts()
    return successResponse(counts)
  } catch (error) {
    console.error("[Admin Newsletter Audience] GET Error:", error)
    return serverError(error instanceof Error ? error.message : undefined)
  }
}

export const GET = withAdminAuth(handleGet)
