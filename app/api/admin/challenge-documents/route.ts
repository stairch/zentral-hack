import { put, del } from "@vercel/blob"
import { query } from "@/lib/db"
import { withCategoryPartnerAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { validateFileUpload, generateSecureFilename } from "@/lib/file-upload"

async function assertChallengeAccess(req: AuthenticatedRequest, challengeId: string): Promise<boolean> {
  const result = await query("SELECT category_id FROM sponsor_challenges WHERE id = $1", [challengeId])
  if (result.rows.length === 0) return false
  if (req.user?.role === "category_partner" && result.rows[0].category_id !== req.user.categoryId) {
    return false
  }
  return true
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
    const formData = await req.formData()
    const file = formData.get("file") as File
    const challengeId = formData.get("challengeId") as string
    const name = formData.get("name") as string
    const description = (formData.get("description") as string) || null

    if (!file) return validationError("File required")
    if (!challengeId) return validationError("challengeId required")

    if (!(await assertChallengeAccess(req, challengeId))) {
      return validationError("Challenge not found or no permission")
    }

    const validation = validateFileUpload({ name: file.name, size: file.size, type: file.type }, "document")
    if (!validation.valid) return validationError(validation.error!)

    const docName = name || file.name.replace(/\.[^/.]+$/, "")
    const secureFilename = generateSecureFilename(file.name)
    const blob = await put(`documents/challenges/${challengeId}/${secureFilename}`, file, {
      access: "private"
    })

    const result = await query(
      "INSERT INTO challenge_documents (challenge_id, name, description, file_path, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, description, file_path, file_size, created_at",
      [challengeId, docName, description, blob.url, file.size, req.user?.userId ?? null]
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
