import { put, del } from "@vercel/blob"
import { query } from "@/lib/db"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { validateFileUpload, generateSecureFilename } from "@/lib/file-upload"

async function handleGet() {
  try {
    const result = await query(
      "SELECT id, caption, display_order, created_at FROM event_photos ORDER BY display_order ASC, created_at ASC"
    )
    return successResponse({ photos: result.rows })
  } catch (error) {
    console.error("[Event Photos] GET Error:", error)
    return serverError()
  }
}

async function handlePost(req: AuthenticatedRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const caption = (formData.get("caption") as string) || null

    if (!file) return validationError("File required")

    const validation = validateFileUpload({ name: file.name, size: file.size, type: file.type }, "image")
    if (!validation.valid) return validationError(validation.error!)

    const secureFilename = generateSecureFilename(file.name)
    // The blob store is private, photos are served through /api/event-photo
    const blob = await put(`event-photos/${secureFilename}`, file, {
      access: "private",
      contentType: file.type
    })

    const countResult = await query("SELECT COUNT(*)::integer AS count FROM event_photos")
    const nextOrder = countResult.rows[0]?.count ?? 0

    const result = await query(
      "INSERT INTO event_photos (image_url, caption, display_order, uploaded_by) VALUES ($1, $2, $3, $4) RETURNING id, caption, display_order, created_at",
      [blob.url, caption, nextOrder, req.user?.userId ?? null]
    )

    return successResponse({ photo: result.rows[0] }, 201)
  } catch (error) {
    console.error("[Event Photos] POST Error:", error)
    return serverError()
  }
}

async function handleDelete(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return validationError("id required")

    const result = await query("SELECT image_url FROM event_photos WHERE id = $1", [id])
    if (result.rows.length === 0) return validationError("Photo not found")

    const blobUrl = result.rows[0].image_url
    try {
      if (blobUrl?.startsWith("https://")) await del(blobUrl)
    } catch (e) {
      console.warn("Blob deletion failed, continuing:", e)
    }

    await query("DELETE FROM event_photos WHERE id = $1", [id])
    return successResponse({ message: "Photo deleted" })
  } catch (error) {
    console.error("[Event Photos] DELETE Error:", error)
    return serverError()
  }
}

export const GET = withAdminAuth(handleGet)
export const POST = withAdminAuth(handlePost)
export const DELETE = withAdminAuth(handleDelete)
