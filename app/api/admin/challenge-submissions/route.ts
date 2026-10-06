import { query } from "@/lib/db"
import { withCategoryPartnerAuth, type AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"

type QueryValue = string | number | null

async function handleGet(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const categoryId = searchParams.get("category")
    const isCategoryPartner = req.user?.role === "category_partner"

    let sql = `
      SELECT
        cs.id, cs.user_id, cs.category_id, cs.challenge_id, cs.description, cs.status,
        cs.review_comment, cs.reviewed_by, cs.reviewed_at, cs.created_at, cs.updated_at,
        u.email AS user_email, u.first_name, u.last_name,
        c.name AS category_name, c.color AS category_color,
        sc.challenge_title, sc.challenge_title_en
      FROM challenge_submissions cs
      JOIN users u ON cs.user_id = u.id
      JOIN categories c ON cs.category_id = c.id
      JOIN sponsor_challenges sc ON cs.challenge_id = sc.id
      WHERE 1=1
    `
    const values: QueryValue[] = []

    if (isCategoryPartner) {
      if (!req.user?.categoryId) return validationError("No category assigned")
      values.push(req.user.categoryId)
      sql += ` AND cs.category_id = $${values.length}`
    } else if (categoryId) {
      values.push(categoryId)
      sql += ` AND cs.category_id = $${values.length}`
    }

    if (status) {
      values.push(status)
      sql += ` AND cs.status = $${values.length}`
    }

    sql += " ORDER BY cs.created_at DESC"

    const result = await query(sql, values)
    return successResponse({ submissions: result.rows })
  } catch (error) {
    console.error("[Admin Challenge Submissions] GET error:", error)
    return serverError("Failed to load challenge submissions")
  }
}

async function handlePut(req: AuthenticatedRequest) {
  try {
    const { id, status, reviewComment } = await req.json()
    if (!id) return validationError("id required")
    if (!["accepted", "rejected"].includes(status)) return validationError("Invalid status")

    const comment = typeof reviewComment === "string" ? reviewComment.trim() : ""
    if (status === "rejected" && !comment) {
      return validationError("A comment is required when rejecting a submission")
    }

    const isCategoryPartner = req.user?.role === "category_partner"
    if (isCategoryPartner) {
      const check = await query("SELECT id FROM challenge_submissions WHERE id = $1 AND category_id = $2", [
        id,
        req.user?.categoryId ?? null
      ])
      if (check.rows.length === 0) return validationError("Submission not found in your category")
    }

    const result = await query(
      `UPDATE challenge_submissions
       SET status = $1,
           review_comment = $2,
           reviewed_by = $3,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, comment || null, req.user?.userId ?? null, id]
    )

    if (!result.rows[0]) return validationError("Submission not found")

    return successResponse({ submission: result.rows[0] })
  } catch (error) {
    console.error("[Admin Challenge Submissions] PUT error:", error)
    return serverError("Failed to update submission")
  }
}

export const GET = withCategoryPartnerAuth(handleGet)
export const PUT = withCategoryPartnerAuth(handlePut)
