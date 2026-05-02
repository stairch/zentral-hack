import { query } from "@/lib/db"
import { withCategoryPartnerAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, serverError, validationError } from "@/lib/api"

type QueryValue = string | number | boolean | null | string[]

async function handleGet(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get("category")
    const status = searchParams.get("status")
    const isCategoryPartner = req.user?.role === "category_partner"

    let sql = `
      SELECT
        sc.id, sc.user_id, sc.status, sc.company_name, sc.branch,
        sc.contact_name, sc.contact_function, sc.contact_email, sc.contact_phone,
        sc.website, sc.logo_note, sc.challenge_title, sc.short_description,
        sc.difficulty, sc.team_size, sc.challenge_language,
        sc.challenge_data, sc.prize, sc.published_at, sc.created_at, sc.updated_at,
        c.name AS category_name, c.id AS category_id, c.slug AS category_slug,
        u.email AS user_email, u.first_name, u.last_name
      FROM sponsor_challenges sc
      JOIN categories c ON sc.category_id = c.id
      JOIN users u ON sc.user_id = u.id
      WHERE 1=1
    `
    const values: QueryValue[] = []

    if (isCategoryPartner) {
      if (!req.user?.categoryId) return validationError("No category assigned")
      values.push(req.user.categoryId)
      sql += ` AND sc.category_id = $${values.length}`
    } else if (categoryId) {
      values.push(categoryId)
      sql += ` AND sc.category_id = $${values.length}`
    }

    if (status) {
      values.push(status)
      sql += ` AND sc.status = $${values.length}`
    }

    sql += " ORDER BY sc.created_at DESC"

    const result = await query(sql, values)
    return successResponse({ challenges: result.rows })
  } catch (error) {
    console.error("[Admin Challenges] GET Error:", error)
    return serverError("Failed to load challenges")
  }
}

async function handlePut(req: AuthenticatedRequest) {
  try {
    const { id, status, prize } = await req.json()
    if (!id) return validationError("id required")
    const isCategoryPartner = req.user?.role === "category_partner"

    if (isCategoryPartner) {
      const check = await query("SELECT id FROM sponsor_challenges WHERE id = $1 AND category_id = $2", [
        id,
        req.user?.categoryId ?? null
      ])
      if (check.rows.length === 0) return validationError("Challenge not found in your category")
    }

    const fields: string[] = []
    const values: QueryValue[] = []

    if (status !== undefined) {
      if (!["draft", "published"].includes(status)) return validationError("Invalid status")
      values.push(status)
      fields.push(`status = $${values.length}`)
      if (status === "published") {
        fields.push("published_at = COALESCE(published_at, NOW())")
      }
    }

    if (prize !== undefined) {
      values.push(prize === "" ? null : String(prize).trim())
      fields.push(`prize = $${values.length}`)
    }

    if (fields.length === 0) return validationError("No fields to update")

    fields.push("updated_at = NOW()")
    values.push(String(id))

    await query(`UPDATE sponsor_challenges SET ${fields.join(", ")} WHERE id = $${values.length}`, values)
    return successResponse({ message: "Challenge updated" })
  } catch (error) {
    console.error("[Admin Challenges] PUT Error:", error)
    return serverError("Failed to update challenge")
  }
}

async function handleDelete(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return validationError("id required")
    const isCategoryPartner = req.user?.role === "category_partner"

    if (isCategoryPartner) {
      const check = await query("SELECT id FROM sponsor_challenges WHERE id = $1 AND category_id = $2", [
        id,
        req.user?.categoryId ?? null
      ])
      if (check.rows.length === 0) return validationError("Challenge not found in your category")
    }

    await query("DELETE FROM sponsor_challenges WHERE id = $1", [id])
    return successResponse({ message: "Challenge deleted" })
  } catch (error) {
    console.error("[Admin Challenges] DELETE Error:", error)
    return serverError("Failed to delete challenge")
  }
}

export const GET = withCategoryPartnerAuth(handleGet)
export const PUT = withCategoryPartnerAuth(handlePut)
export const DELETE = withCategoryPartnerAuth(handleDelete)
