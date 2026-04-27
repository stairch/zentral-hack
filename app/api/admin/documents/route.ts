import { query } from "@/lib/db"
import { withCategoryPartnerAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError, errorResponse } from "@/lib/api"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { validateFileUpload, generateSecureFilename, validateCategoryFilePath } from "@/lib/file-upload"
import { adminDocumentsFlag } from "@/lib/flags"

async function handleGet(req: AuthenticatedRequest) {
  try {
    const showDocuments = await adminDocumentsFlag()
    if (!showDocuments) {
      return errorResponse("Not found", 404)
    }

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
    const categoryId = formData.get("categoryId") as string
    const name = formData.get("name") as string

    if (!file || !categoryId) {
      return validationError("File and category required")
    }

    // Use provided name or fall back to original filename
    const docName = name || file.name.replace(/\.[^/.]+$/, "")

    // Verify user can upload to this category
    if (req.user?.role === "category_partner" && req.user.categoryId !== categoryId) {
      return validationError("Cannot upload to other categories")
    }

    // Validate file upload
    const validation = validateFileUpload({ name: file.name, size: file.size, type: file.type }, "document")

    if (!validation.valid) {
      return validationError(validation.error!)
    }

    // Create category-specific upload directory
    const uploadDir = join(process.cwd(), "public", "uploads", "categories", categoryId)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate secure filename
    const secureFileName = generateSecureFilename(file.name)
    const filePath = join(uploadDir, secureFileName)
    const relativePath = `/uploads/categories/${categoryId}/${secureFileName}`

    // Validate path to prevent directory traversal
    if (!validateCategoryFilePath(categoryId, filePath)) {
      return validationError("Invalid file path")
    }

    // Write file
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // Save to database
    const result = await query(
      "INSERT INTO category_documents (name, file_path, file_size, category_id, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, file_path, file_size, created_at",
      [docName, relativePath, file.size, categoryId, req.user?.userId ?? null]
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

    if (!docId) {
      return validationError("Document ID required")
    }

    // Get document info
    const result = await query("SELECT file_path, category_id FROM category_documents WHERE id = $1", [docId])

    if (result.rows.length === 0) {
      return validationError("Document not found")
    }

    // Category partners can only delete from their category
    if (req.user?.role === "category_partner" && req.user.categoryId !== result.rows[0].category_id) {
      return validationError("Cannot delete documents from other categories")
    }

    const filePath = result.rows[0].file_path

    // Delete file from disk
    try {
      const fullPath = join(process.cwd(), "public", filePath)
      await unlink(fullPath)
    } catch (e) {
      console.warn("File deletion failed, continuing with DB deletion:", e)
    }

    // Delete from database
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
