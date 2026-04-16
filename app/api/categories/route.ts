import { query } from "@/lib/db"
import { successResponse, serverError } from "@/lib/api"
import { buildCategorySelectClause, getAvailableCategoryColumns } from "@/lib/category-db"
import { isMissingTableError } from "@/lib/db-errors"

/**
 * GET /api/categories
 * Fetches all categories (public endpoint)
 */
export async function GET() {
  try {
    const availableColumns = await getAvailableCategoryColumns()
    let result

    try {
      result = await query(
        `SELECT c.*,
                COALESCE(sc.challenges, '[]'::jsonb) AS challenges
         FROM (
           SELECT ${buildCategorySelectClause(availableColumns)}
           FROM categories
         ) c
         LEFT JOIN LATERAL (
           SELECT jsonb_agg(
                    jsonb_build_object(
                      'id', id,
                      'title', challenge_title,
                      'short_description', short_description,
                      'challenge_data', challenge_data,
                      'difficulty', difficulty,
                      'team_size', team_size,
                      'challenge_language', challenge_language,
                      'company_name', company_name,
                      'status', status,
                      'updated_at', updated_at
                    )
                    ORDER BY COALESCE(published_at, updated_at) DESC, created_at DESC
                  ) AS challenges
           FROM sponsor_challenges
           WHERE category_id = c.id AND status = 'published'
         ) sc ON TRUE
         ORDER BY c.name ASC`
      )
    } catch (error) {
      if (!isMissingTableError(error, "sponsor_challenges")) {
        throw error
      }

      // Migration not yet applied: keep categories endpoint functional.
      result = await query(
        `SELECT ${buildCategorySelectClause(availableColumns)},
                '[]'::jsonb AS challenges
         FROM categories
         ORDER BY name ASC`
      )
    }

    return successResponse({
      categories: result.rows
    })
  } catch (error) {
    console.error("Categories fetch error:", error)
    return serverError("Fehler beim Laden der Kategorien")
  }
}
