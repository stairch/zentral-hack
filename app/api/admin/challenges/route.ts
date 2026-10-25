import { query } from "@/lib/db"
import { withCategoryPartnerAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, serverError, validationError } from "@/lib/api"
import { sponsorNamesSql } from "@/lib/sponsor-challenge"

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
        sc.website, sc.logo_note,
        sc.challenge_title, sc.challenge_title_en, sc.short_description, sc.short_description_en,
        sc.difficulty, sc.team_size, sc.challenge_language,
        sc.challenge_data, sc.prize, sc.sponsor_ids,
        sc.submission_enabled, sc.submission_description_required, sc.info_published, sc.submission_deadline,
        sc.published_at, sc.created_at, sc.updated_at,
        c.name AS category_name, c.id AS category_id, c.slug AS category_slug,
        u.email AS user_email, u.first_name, u.last_name,
        ${sponsorNamesSql("sc")} AS sponsor_names
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
    const {
      id,
      status,
      prize,
      infoPublished,
      submissionDeadline,
      submissionEnabled,
      submissionDescriptionRequired
    } = await req.json()
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

    if (infoPublished !== undefined) {
      if (typeof infoPublished !== "boolean") return validationError("Invalid infoPublished")
      values.push(infoPublished)
      fields.push(`info_published = $${values.length}`)
    }

    if (submissionEnabled !== undefined) {
      if (typeof submissionEnabled !== "boolean") return validationError("Invalid submissionEnabled")
      values.push(submissionEnabled)
      fields.push(`submission_enabled = $${values.length}`)
      // Closing the submission also drops the description requirement (same as the editor did)
      if (!submissionEnabled) fields.push("submission_description_required = false")
    }

    if (submissionDescriptionRequired !== undefined && submissionEnabled !== false) {
      if (typeof submissionDescriptionRequired !== "boolean") {
        return validationError("Invalid submissionDescriptionRequired")
      }
      values.push(submissionDescriptionRequired)
      fields.push(`submission_description_required = $${values.length}`)
    }

    if (submissionDeadline !== undefined) {
      if (submissionDeadline !== null && Number.isNaN(Date.parse(String(submissionDeadline)))) {
        return validationError("Invalid submissionDeadline")
      }
      values.push(submissionDeadline === null ? null : new Date(String(submissionDeadline)).toISOString())
      fields.push(`submission_deadline = $${values.length}`)
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
