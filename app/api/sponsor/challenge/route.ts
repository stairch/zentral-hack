import { query } from "@/lib/db"
import { successResponse, serverError, validationError } from "@/lib/api"
import { withSponsorAuth, type AuthenticatedRequest } from "@/lib/middleware"
import { isMissingTableError } from "@/lib/db-errors"
import {
  createEmptySponsorChallengeData,
  normalizeSponsorChallengeData,
  type SponsorChallengeData,
  type SponsorChallengeRecord
} from "@/lib/sponsor-challenge"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function resolveSponsorCategoryId(
  req: AuthenticatedRequest,
  explicitCategoryId?: string | null
): Promise<string | null> {
  if (req.user?.role === "admin" && explicitCategoryId) {
    return explicitCategoryId
  }

  if (req.user?.categoryId) {
    return req.user.categoryId
  }

  const result = await query("SELECT category_id FROM users WHERE id = $1", [req.user?.userId ?? ""])
  return result.rows[0]?.category_id || null
}

async function loadChallengeRows(req: AuthenticatedRequest, categoryId: string) {
  if (req.user?.role === "admin" || req.user?.role === "category_partner") {
    return query(
      `SELECT id, user_id, category_id, status,
              company_name, branch, contact_name, contact_function,
              contact_email, contact_phone, website, logo_note,
              challenge_title, challenge_title_en, short_description, short_description_en,
              difficulty, team_size,
              challenge_language, prize, sponsor_id, challenge_data, published_at, created_at, updated_at
       FROM sponsor_challenges
       WHERE category_id = $1
       ORDER BY updated_at DESC, created_at DESC`,
      [categoryId]
    )
  }

  return query(
    `SELECT id, user_id, category_id, status,
            company_name, branch, contact_name, contact_function,
            contact_email, contact_phone, website, logo_note,
            challenge_title, challenge_title_en, short_description, short_description_en,
            difficulty, team_size,
            challenge_language, prize, sponsor_id, challenge_data, published_at, created_at, updated_at
     FROM sponsor_challenges
     WHERE user_id = $1 AND category_id = $2
     ORDER BY updated_at DESC, created_at DESC`,
    [req.user?.userId ?? "", categoryId]
  )
}

export const GET = withSponsorAuth(async (req: AuthenticatedRequest) => {
  try {
    const requestedCategoryId = req.nextUrl.searchParams.get("categoryId")
    const requestedChallengeId = req.nextUrl.searchParams.get("challengeId")
    const categoryId = await resolveSponsorCategoryId(req, requestedCategoryId)
    if (!categoryId) {
      return validationError(
        req.user?.role === "admin" ? "Category is required" : "No category assigned to sponsor"
      )
    }

    let result
    try {
      result = await loadChallengeRows(req, categoryId)
    } catch (error) {
      if (!isMissingTableError(error, "sponsor_challenges")) {
        throw error
      }

      return successResponse({
        challenges: [],
        challenge: null
      })
    }

    const rows = (result.rows || []) as SponsorChallengeRecord[]
    const selectedRow = requestedChallengeId
      ? rows.find((row) => row.id === requestedChallengeId) || rows[0] || null
      : rows[0] || null
    const challenge = selectedRow
      ? {
          ...selectedRow,
          challenge_data: normalizeSponsorChallengeData(
            selectedRow.challenge_data as SponsorChallengeData | null
          )
        }
      : null

    return successResponse({
      challenges: rows.map((row) => ({
        id: row.id,
        challenge_title: row.challenge_title,
        challenge_title_en: row.challenge_title_en,
        status: row.status,
        updated_at: row.updated_at,
        category_id: row.category_id
      })),
      challenge,
      emptyChallengeTemplate: {
        id: null,
        user_id: req.user?.userId ?? null,
        category_id: categoryId,
        status: "draft",
        company_name: "",
        branch: "",
        contact_name: "",
        contact_function: "",
        contact_email: req.user?.email ?? "",
        contact_phone: "",
        website: "",
        logo_note: "",
        challenge_title: "",
        challenge_title_en: "",
        short_description: "",
        short_description_en: "",
        difficulty: "",
        team_size: "",
        challenge_language: "",
        sponsor_id: null,
        challenge_data: createEmptySponsorChallengeData(),
        published_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("[Sponsor Challenge] GET error:", error)
    return serverError("Fehler beim Laden der Challenge")
  }
})

export const PUT = withSponsorAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const requestedCategoryId = typeof body.categoryId === "string" ? body.categoryId : null
    const challengeId = typeof body.challengeId === "string" ? body.challengeId : null
    const categoryId = await resolveSponsorCategoryId(req, requestedCategoryId)

    if (!categoryId) {
      return validationError(
        req.user?.role === "admin" ? "Category is required" : "No category assigned to sponsor"
      )
    }

    const isSponsorOnly = req.user?.role === "sponsor"
    const status = body.status === "published" && !isSponsorOnly ? "published" : "draft"
    const challengeData = normalizeSponsorChallengeData(body.challengeData)
    const prize = typeof body.prize === "string" ? body.prize.trim() || null : null
    const sponsorId =
      typeof body.sponsorId === "string" && UUID_RE.test(body.sponsorId) ? body.sponsorId : null

    if (!challengeData.challengeTitle.trim()) {
      return validationError("German challenge title is required")
    }

    if (!challengeData.shortDescription.trim()) {
      return validationError("German short description is required")
    }

    let result
    try {
      const payload = [
        req.user?.userId ?? "",
        categoryId,
        status,
        challengeData.companyName || null,
        challengeData.branch || null,
        challengeData.contactName || null,
        challengeData.contactFunction || null,
        challengeData.contactEmail || null,
        challengeData.contactPhone || null,
        challengeData.website || null,
        challengeData.logoNote || null,
        challengeData.challengeTitle || null,
        challengeData.challengeTitleEn || null,
        challengeData.shortDescription || null,
        challengeData.shortDescriptionEn || null,
        challengeData.difficulty || null,
        challengeData.teamSize || null,
        challengeData.challengeLanguage || null,
        JSON.stringify(challengeData),
        prize,
        sponsorId
      ]

      if (challengeId) {
        // Non-privileged sponsors may only edit their own challenge (user_id = $1).
        // Admins / category partners may edit any challenge in the category, but $1
        // must still be referenced so Postgres can infer the parameter's type.
        const whereClause =
          req.user?.role === "admin" || req.user?.role === "category_partner"
            ? "WHERE id = $22 AND category_id = $2 AND $1::text = $1::text"
            : "WHERE id = $22 AND user_id = $1 AND category_id = $2"

        result = await query(
          `UPDATE sponsor_challenges
           SET status = $3,
               company_name = $4,
               branch = $5,
               contact_name = $6,
               contact_function = $7,
               contact_email = $8,
               contact_phone = $9,
               website = $10,
               logo_note = $11,
               challenge_title = $12,
               challenge_title_en = $13,
               short_description = $14,
               short_description_en = $15,
               difficulty = $16,
               team_size = $17,
               challenge_language = $18,
               challenge_data = $19::jsonb,
               prize = $20,
               sponsor_id = $21,
               published_at = CASE
                 WHEN $3::text = 'published' AND sponsor_challenges.published_at IS NULL THEN NOW()
                 WHEN $3::text = 'published' THEN sponsor_challenges.published_at
                 ELSE NULL
               END,
               updated_at = NOW()
           ${whereClause}
           RETURNING id, user_id, category_id, status,
                     company_name, branch, contact_name, contact_function,
                     contact_email, contact_phone, website, logo_note,
                     challenge_title, challenge_title_en, short_description, short_description_en,
                     difficulty, team_size,
                     challenge_language, prize, sponsor_id, challenge_data, published_at, created_at, updated_at`,
          [...payload, challengeId]
        )

        if (!result.rows[0]) {
          return validationError("Challenge not found or no permission")
        }
      } else {
        result = await query(
          `INSERT INTO sponsor_challenges (
             user_id, category_id, status,
             company_name, branch, contact_name, contact_function,
             contact_email, contact_phone, website, logo_note,
             challenge_title, challenge_title_en, short_description, short_description_en,
             difficulty, team_size,
             challenge_language, challenge_data, prize, sponsor_id, published_at, updated_at
           ) VALUES (
             $1, $2, $3,
             $4, $5, $6, $7,
             $8, $9, $10, $11,
             $12, $13, $14, $15,
             $16, $17,
             $18, $19::jsonb, $20, $21,
             CASE WHEN $3::text = 'published' THEN NOW() ELSE NULL END,
             NOW()
           )
           RETURNING id, user_id, category_id, status,
                     company_name, branch, contact_name, contact_function,
                     contact_email, contact_phone, website, logo_note,
                     challenge_title, challenge_title_en, short_description, short_description_en,
                     difficulty, team_size,
                     challenge_language, prize, sponsor_id, challenge_data, published_at, created_at, updated_at`,
          payload
        )
      }
    } catch (error) {
      if (!isMissingTableError(error, "sponsor_challenges")) {
        throw error
      }

      return validationError("Sponsor challenge migration is not applied yet")
    }

    return successResponse({
      challenge: {
        ...(result.rows[0] as SponsorChallengeRecord),
        challenge_data: normalizeSponsorChallengeData(
          (result.rows[0] as SponsorChallengeRecord).challenge_data as SponsorChallengeData | null
        )
      }
    })
  } catch (error) {
    console.error("[Sponsor Challenge] PUT error:", error)
    return serverError("Fehler beim Speichern der Challenge")
  }
})
