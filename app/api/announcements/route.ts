import { query } from "@/lib/db"
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, serverError } from "@/lib/api"

async function resolveViewerCategoryId(req: AuthenticatedRequest): Promise<string | null> {
  if (req.user?.role === "category_partner" || req.user?.role === "sponsor") {
    return req.user.categoryId || null
  }
  const result = await query("SELECT category_id FROM registrations WHERE user_id = $1 LIMIT 1", [
    req.user?.userId ?? ""
  ])
  return result.rows[0]?.category_id || null
}

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    let sql = `
      SELECT a.id, a.title, a.content, a.created_at, a.created_by, a.category_id,
             c.name AS category_name, c.color AS category_color
      FROM announcements a
      LEFT JOIN categories c ON a.category_id = c.id
    `
    const values: string[] = []

    if (req.user?.role !== "admin") {
      const categoryId = await resolveViewerCategoryId(req)
      if (categoryId) {
        values.push(categoryId)
        sql += ` WHERE a.category_id IS NULL OR a.category_id = $1`
      } else {
        sql += ` WHERE a.category_id IS NULL`
      }
    }

    sql += " ORDER BY a.created_at DESC LIMIT 50"

    const result = await query(sql, values)
    return successResponse({ announcements: result.rows })
  } catch (error) {
    console.error("[Announcements] Public GET Error:", error)
    return serverError()
  }
})
