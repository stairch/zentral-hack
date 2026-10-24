import { put, del } from "@vercel/blob"
import { query } from "@/lib/db"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { verifyUploadedBlob } from "@/lib/blob-upload"
import { EVENT_PHOTO_UPLOAD_FOLDER } from "@/lib/file-upload"
import { compressEventPhoto } from "@/lib/event-photo-processing"

async function deleteBlob(blobUrl: string | undefined) {
  try {
    if (blobUrl?.startsWith("https://")) await del(blobUrl)
  } catch (e) {
    console.warn("Blob deletion failed, continuing:", e)
  }
}

async function handleGet() {
  try {
    // Winner photos are loaded with the rankings
    const result = await query(
      "SELECT id, caption, display_order, created_at FROM event_photos WHERE category_id IS NULL ORDER BY display_order ASC, created_at ASC"
    )
    return successResponse({ photos: result.rows })
  } catch (error) {
    console.error("[Event Photos] GET Error:", error)
    return serverError()
  }
}

async function handlePost(req: AuthenticatedRequest) {
  // The original was uploaded from the browser (see lib/client-upload.ts) and only lives until it is compressed
  let originalUrl: string | null = null
  try {
    const body = await req.json().catch(() => ({}))
    const caption = typeof body.caption === "string" && body.caption.trim() ? body.caption.trim() : null
    // Set for a challenge's winner photo, which replaces the previous one and stays out of the gallery.
    // Teams without a challenge are ranked per category, so challenge_id may be empty.
    const categoryId = typeof body.category_id === "string" && body.category_id ? body.category_id : null
    const challengeId =
      categoryId && typeof body.challenge_id === "string" && body.challenge_id ? body.challenge_id : null

    const verified = await verifyUploadedBlob(body.url, body.name, EVENT_PHOTO_UPLOAD_FOLDER, req.user!)
    if (!verified.valid) return validationError(verified.error)
    originalUrl = verified.blob.url

    const originalResponse = await fetch(originalUrl, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
    })
    if (!originalResponse.ok) throw new Error(`Failed to read original (${originalResponse.status})`)

    let compressed
    try {
      compressed = await compressEventPhoto(Buffer.from(await originalResponse.arrayBuffer()))
    } catch (error) {
      console.warn("[Event Photos] Image could not be processed:", error)
      return validationError("Image could not be processed")
    }

    // The blob store is private, photos are served through /api/event-photo
    const filename = `${crypto.randomUUID()}.webp`
    const [full, thumbnail] = await Promise.all([
      put(`event-photos/${filename}`, compressed.full, { access: "private", contentType: "image/webp" }),
      put(`event-photos/thumbnails/${filename}`, compressed.thumbnail, {
        access: "private",
        contentType: "image/webp"
      })
    ])

    if (categoryId) {
      const previous = await query(
        "DELETE FROM event_photos WHERE category_id = $1 AND challenge_id IS NOT DISTINCT FROM $2 RETURNING image_url, thumbnail_url",
        [categoryId, challengeId]
      )
      await deleteBlob(previous.rows[0]?.image_url)
      await deleteBlob(previous.rows[0]?.thumbnail_url)
    }

    const countResult = await query("SELECT COUNT(*)::integer AS count FROM event_photos")
    const nextOrder = countResult.rows[0]?.count ?? 0

    const result = await query(
      "INSERT INTO event_photos (image_url, thumbnail_url, caption, display_order, uploaded_by, category_id, challenge_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, caption, display_order, created_at",
      [full.url, thumbnail.url, caption, nextOrder, req.user?.userId ?? null, categoryId, challengeId]
    )

    return successResponse({ photo: result.rows[0] }, 201)
  } catch (error) {
    console.error("[Event Photos] POST Error:", error)
    return serverError()
  } finally {
    await deleteBlob(originalUrl ?? undefined)
  }
}

async function handleDelete(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return validationError("id required")

    const result = await query("SELECT image_url, thumbnail_url FROM event_photos WHERE id = $1", [id])
    if (result.rows.length === 0) return validationError("Photo not found")

    await deleteBlob(result.rows[0].image_url)
    await deleteBlob(result.rows[0].thumbnail_url)

    await query("DELETE FROM event_photos WHERE id = $1", [id])
    return successResponse({ message: "Photo deleted" })
  } catch (error) {
    console.error("[Event Photos] DELETE Error:", error)
    return serverError()
  }
}

// Compressing a large camera photo can take a few seconds
export const maxDuration = 60

export const GET = withAdminAuth(handleGet)
export const POST = withAdminAuth(handlePost)
export const DELETE = withAdminAuth(handleDelete)
