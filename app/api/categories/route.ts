import { query } from "@/lib/db"
import { successResponse, serverError } from "@/lib/api"
import { buildCategorySelectClause, getAvailableCategoryColumns } from "@/lib/category-db"

/**
 * GET /api/categories
 * Fetches all categories (public endpoint)
 */
export async function GET() {
  try {
    const availableColumns = await getAvailableCategoryColumns()
    const result = await query(
      `SELECT ${buildCategorySelectClause(availableColumns)}
       FROM categories
       ORDER BY name ASC`
    )

    return successResponse({
      categories: result.rows
    })
  } catch (error) {
    console.error("Categories fetch error:", error)
    return serverError("Fehler beim Laden der Kategorien")
  }
}
