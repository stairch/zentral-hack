import { put, del } from "@vercel/blob"
import { query } from "@/lib/db"
import { withCategoryPartnerAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { validateFileUpload, generateSecureFilename } from "@/lib/file-upload"

async function handleGet(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get("categoryId")

    if (req.user?.role === "category_partner") {
      const catId = categoryId || req.user.categoryId
      if (!catId) return validationError("Category required")
      const result = await query(
        "SELECT id, name, description, file_path, file_size, created_at FROM category_documents WHERE category_id = $1 ORDER BY created_at DESC",
        [catId]
      )
      return successResponse({ documents: result.rows })
    }

    // Admin: all documents or filtered by category
    if (categoryId) {
      const result = await query(
        "SELECT cd.id, cd.name, cd.description, cd.file_path, cd.file_size, cd.created_at, c.name as category_name FROM category_documents cd JOIN categories c ON cd.category_id = c.id WHERE cd.category_id = $1 ORDER BY cd.created_at DESC",
        [categoryId]
      )
      return successResponse({ documents: result.rows })
    }

    const result = await query(
      "SELECT cd.id, cd.name, cd.description, cd.file_path, cd.file_size, cd.created_at, c.name as category_name FROM category_documents cd JOIN categories c ON cd.category_id = c.id ORDER BY cd.created_at DESC"
    )
    return successResponse({ documents: result.rows })
  } catch (error) {
    console.error("[Documents] GET Error:", error)
    return serverError()
  }
}

async function handlePost(req: AuthenticatedRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const categoryId = (formData.get("categoryId") as string) || null
    const name = formData.get("name") as string
    const description = (formData.get("description") as string) || null

    if (!file) return validationError("File required")

    const docName = name || file.name.replace(/\.[^/.]+$/, "")

    if (req.user?.role === "category_partner" && req.user.categoryId !== categoryId) {
      return validationError("Cannot upload to other categories")
    }

    const validation = validateFileUpload({ name: file.name, size: file.size, type: file.type }, "document")
    if (!validation.valid) return validationError(validation.error!)

    const secureFilename = generateSecureFilename(file.name)
    const blobPath = categoryId
      ? `documents/categories/${categoryId}/${secureFilename}`
      : `documents/global/${secureFilename}`

    const blob = await put(blobPath, file, { access: "private" })

    const result = await query(
      "INSERT INTO category_documents (name, description, file_path, file_size, category_id, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, description, file_path, file_size, created_at",
      [docName, description, blob.url, file.size, categoryId, req.user?.userId ?? null]
    )

    return successResponse({ document: result.rows[0] }, 201)
  } catch (error) {
    console.error("[Documents] POST Error:", error)
    return serverError()
  }
}

async function handleDelete(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const docId = searchParams.get("id") || searchParams.get("docId")

    if (!docId) return validationError("Document ID required")

    const result = await query("SELECT file_path, category_id FROM category_documents WHERE id = $1", [docId])

    if (result.rows.length === 0) return validationError("Document not found")

    if (req.user?.role === "category_partner" && req.user.categoryId !== result.rows[0].category_id) {
      return validationError("Cannot delete documents from other categories")
    }

    const blobUrl = result.rows[0].file_path
    try {
      if (blobUrl?.startsWith("https://")) {
        await del(blobUrl)
      }
    } catch (e) {
      console.warn("[Documents] Blob deletion failed, continuing:", e)
    }

    await query("DELETE FROM category_documents WHERE id = $1", [docId])

    return successResponse({ message: "Document deleted successfully" })
  } catch (error) {
    console.error("[Documents] DELETE Error:", error)
    return serverError()
  }
}

export const GET = withCategoryPartnerAuth(handleGet)
export const POST = withCategoryPartnerAuth(handlePost)
export const DELETE = withCategoryPartnerAuth(handleDelete)
