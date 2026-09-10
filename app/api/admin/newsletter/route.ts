import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import {
  createNewsletterCampaign,
  deleteNewsletterCampaign,
  getNewsletterCampaign,
  listNewsletterCampaigns,
  listNewsletterSegments,
  listEmailTemplates,
  updateNewsletterCampaign
} from "@/lib/resend"

function fail(error: unknown, scope: string) {
  console.error(`[Admin Newsletter] ${scope} Error:`, error)
  return serverError(error instanceof Error ? error.message : undefined)
}

async function handleGet(req: AuthenticatedRequest) {
  const id = new URL(req.url).searchParams.get("id")
  try {
    if (id) {
      const campaign = await getNewsletterCampaign(id)
      return successResponse({ campaign })
    }
    const [campaigns, segments, templates] = await Promise.all([
      listNewsletterCampaigns(),
      listNewsletterSegments(),
      listEmailTemplates()
    ])
    return successResponse({ campaigns, segments, templates })
  } catch (error) {
    return fail(error, "GET")
  }
}

async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const subject = typeof body.subject === "string" ? body.subject.trim() : ""
    const previewText = typeof body.previewText === "string" ? body.previewText.trim() : ""

    if (!name || !subject) {
      return validationError("Name and subject are required")
    }

    const newId = await createNewsletterCampaign({ name, subject, previewText })
    return successResponse({ id: newId }, 201)
  } catch (error) {
    return fail(error, "POST")
  }
}

async function handlePatch(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const id = typeof body.id === "string" ? body.id : ""
    if (!id) return validationError("Campaign ID is required")

    const update: { name?: string; subject?: string; previewText?: string } = {}
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return validationError("Name must not be empty")
      }
      update.name = body.name.trim()
    }
    if (body.subject !== undefined) {
      if (typeof body.subject !== "string" || !body.subject.trim()) {
        return validationError("Subject must not be empty")
      }
      update.subject = body.subject.trim()
    }
    if (body.previewText !== undefined) {
      update.previewText = typeof body.previewText === "string" ? body.previewText.trim() : ""
    }

    if (Object.keys(update).length === 0) {
      return validationError("No changes submitted")
    }

    await updateNewsletterCampaign(id, update)
    return successResponse({ message: "Campaign updated" })
  } catch (error) {
    return fail(error, "PATCH")
  }
}

async function handleDelete(req: AuthenticatedRequest) {
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return validationError("Campaign ID is required")
  try {
    await deleteNewsletterCampaign(id)
    return successResponse({ message: "Campaign deleted" })
  } catch (error) {
    return fail(error, "DELETE")
  }
}

export const GET = withAdminAuth(handleGet)
export const POST = withAdminAuth(handlePost)
export const PATCH = withAdminAuth(handlePatch)
export const DELETE = withAdminAuth(handleDelete)
