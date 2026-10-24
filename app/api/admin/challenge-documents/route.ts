import { del } from "@vercel/blob"
import { query } from "@/lib/db"
import { withCategoryPartnerAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { canManageChallenge, verifyUploadedBlob } from "@/lib/blob-upload"

async function assertChallengeAccess(req: AuthenticatedRequest, challengeId: string): Promise<boolean> {
  return !!req.user && canManageChallenge(challengeId, req.user)
}

async function handleGet(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const challengeId = searchParams.get("challengeId")
    if (!challengeId) return validationError("challengeId required")

    if (!(await assertChallengeAccess(req, challengeId))) {
      return validationError("Challenge not found or no permission")
    }

    const result = await query(
      "SELECT id, name, description, file_path, file_size, created_at FROM challenge_documents WHERE challenge_id = $1 ORDER BY created_at DESC",
      [challengeId]
    )
    return successResponse({ documents: result.rows })
  } catch (error) {
    console.error("[Challenge Documents] GET Error:", error)
    return serverError()
  }
}

async function handlePost(req: AuthenticatedRequest) {
  try {
    // The browser already uploaded the file to Vercel Blob (lib/client-upload.ts), we only get its URL
    const body = await req.json()
    const challengeId: string | undefined = body.challengeId
    const name: string | undefined = body.name
    const description: string | null = body.description || null

    if (!challengeId) return validationError("challengeId required")

    if (!(await assertChallengeAccess(req, challengeId))) {
      return validationError("Challenge not found or no permission")
    }

    const verified = await verifyUploadedBlob(
      body.url,
      body.fileName,
      `documents/challenges/${challengeId}`,
      ["document"]
    )
    if (!verified.valid) return validationError(verified.error)
    const file = verified.blob

    const docName = name || file.name.replace(/\.[^/.]+$/, "")

    const result = await query(
      "INSERT INTO challenge_documents (challenge_id, name, description, file_path, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, description, file_path, file_size, created_at",
      [challengeId, docName, description, file.url, file.size, req.user?.userId ?? null]
    )

    return successResponse({ document: result.rows[0] }, 201)
  } catch (error) {
    console.error("[Challenge Documents] POST Error:", error)
    return serverError()
  }
}

async function handleDelete(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return validationError("id required")

    const docResult = await query(
      "SELECT cd.file_path, cd.challenge_id, sc.category_id FROM challenge_documents cd JOIN sponsor_challenges sc ON cd.challenge_id = sc.id WHERE cd.id = $1",
      [id]
    )
    if (docResult.rows.length === 0) return validationError("Document not found")

    if (req.user?.role === "category_partner" && docResult.rows[0].category_id !== req.user.categoryId) {
      return validationError("No permission")
    }

    const blobUrl = docResult.rows[0].file_path
    try {
      if (blobUrl?.startsWith("https://")) await del(blobUrl)
    } catch (e) {
      console.warn("Blob deletion failed, continuing:", e)
    }

    await query("DELETE FROM challenge_documents WHERE id = $1", [id])
    return successResponse({ message: "Document deleted" })
  } catch (error) {
    console.error("[Challenge Documents] DELETE Error:", error)
    return serverError()
  }
}

export const GET = withCategoryPartnerAuth(handleGet)
export const POST = withCategoryPartnerAuth(handlePost)
export const DELETE = withCategoryPartnerAuth(handleDelete)
