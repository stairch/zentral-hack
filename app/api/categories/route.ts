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
                      'id', sch.id,
                      'title', sch.challenge_title,
                      'title_en', sch.challenge_title_en,
                      'short_description', sch.short_description,
                      'short_description_en', sch.short_description_en,
                      'challenge_data', sch.challenge_data,
                      'prize', sch.prize,
                      'difficulty', sch.difficulty,
                      'team_size', sch.team_size,
                      'challenge_language', sch.challenge_language,
                      'company_name', sch.company_name,
                      'sponsor_name', sco.company_name,
                      'status', sch.status,
                      'updated_at', sch.updated_at
                    )
                    ORDER BY COALESCE(sch.published_at, sch.updated_at) DESC, sch.created_at DESC
                  ) AS challenges
           FROM sponsor_challenges sch
           LEFT JOIN sponsor_contacts sco ON sco.id = sch.sponsor_id
           WHERE sch.category_id = c.id AND sch.status = 'published'
         ) sc ON TRUE
         ORDER BY c.display_order ASC, c.name ASC`
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
         ORDER BY display_order ASC, name ASC`
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
