import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, serverError } from "@/lib/api"
import { getNewsletterAudienceCounts } from "@/lib/resend"
import { getParticipantAudienceCounts } from "@/lib/newsletter-participants"

async function handleGet(_req: AuthenticatedRequest) {
  try {
    const [counts, participants] = await Promise.all([
      getNewsletterAudienceCounts(),
      getParticipantAudienceCounts()
    ])
    return successResponse({ ...counts, participants })
  } catch (error) {
    console.error("[Admin Newsletter Audience] GET Error:", error)
    return serverError(error instanceof Error ? error.message : undefined)
  }
}

export const GET = withAdminAuth(handleGet)
