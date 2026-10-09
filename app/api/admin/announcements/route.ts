import { query } from "@/lib/db"
import { withCategoryPartnerAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"

async function handleGet(req: AuthenticatedRequest) {
  try {
    const isCategoryPartner = req.user?.role === "category_partner"

    let sql = `
      SELECT a.id, a.title, a.content, a.created_at, a.category_id,
             c.name AS category_name, c.color AS category_color, u.first_name, u.last_name
      FROM announcements a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
    `
    const values: string[] = []

    if (isCategoryPartner) {
      if (!req.user?.categoryId) return validationError("No category assigned")
      values.push(req.user.categoryId)
      sql += ` WHERE a.category_id IS NULL OR a.category_id = $1`
    }

    sql += " ORDER BY a.created_at DESC"

    const result = await query(sql, values)
    return successResponse({ announcements: result.rows })
  } catch (error) {
    console.error("[Announcements] GET Error:", error)
    return serverError()
  }
}

async function handlePost(req: AuthenticatedRequest) {
  try {
    const { title, content, categoryId } = await req.json()
    if (!content || !String(content).trim()) {
      return validationError("Inhalt erforderlich")
    }

    const isCategoryPartner = req.user?.role === "category_partner"

    // Category admins may only announce to their own category, never globally.
    let resolvedCategoryId: string | null = null
    if (isCategoryPartner) {
      if (!req.user?.categoryId) return validationError("No category assigned")
      resolvedCategoryId = req.user.categoryId
    } else if (categoryId) {
      const catCheck = await query("SELECT id FROM categories WHERE id = $1", [categoryId])
      if (catCheck.rows.length === 0) return validationError("Kategorie nicht gefunden")
      resolvedCategoryId = categoryId
    }

    const result = await query(
      `INSERT INTO announcements (title, content, created_by, category_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, content, created_at, category_id`,
      [title?.trim() || null, String(content).trim(), req.user?.userId ?? null, resolvedCategoryId]
    )

    return successResponse({ announcement: result.rows[0] }, 201)
  } catch (error) {
    console.error("[Announcements] POST Error:", error)
    return serverError()
  }
}

async function handleDelete(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return validationError("ID erforderlich")

    if (req.user?.role === "category_partner") {
      const check = await query("SELECT category_id FROM announcements WHERE id = $1", [id])
      if (check.rows.length === 0) return validationError("Ankündigung nicht gefunden")
      if (check.rows[0].category_id !== req.user.categoryId) {
        return validationError("Cannot delete announcements from other categories")
      }
    }

    await query("DELETE FROM announcements WHERE id = $1", [id])
    return successResponse({ message: "Ankündigung gelöscht" })
  } catch (error) {
    console.error("[Announcements] DELETE Error:", error)
    return serverError()
  }
}

export const GET = withCategoryPartnerAuth(handleGet)
export const POST = withCategoryPartnerAuth(handlePost)
export const DELETE = withCategoryPartnerAuth(handleDelete)
