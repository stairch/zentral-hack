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
  if (req.user?.role === "admin") {
    return query(
      `SELECT id, user_id, category_id, status,
              company_name, branch, contact_name, contact_function,
              contact_email, contact_phone, website, logo_note,
              challenge_title, short_description, difficulty, team_size,
              challenge_language, challenge_data, published_at, created_at, updated_at
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
            challenge_title, short_description, difficulty, team_size,
            challenge_language, challenge_data, published_at, created_at, updated_at
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
          challenge_data: normalizeSponsorChallengeData(selectedRow.challenge_data as SponsorChallengeData | null)
        }
      : null

    return successResponse({
      challenges: rows.map((row) => ({
        id: row.id,
        challenge_title: row.challenge_title,
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
        short_description: "",
        difficulty: "",
        team_size: "",
        challenge_language: "",
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

    const status = body.status === "published" ? "published" : "draft"
    const challengeData = normalizeSponsorChallengeData(body.challengeData)

    if (!challengeData.challengeTitle.trim()) {
      return validationError("Challenge title is required")
    }

    if (!challengeData.shortDescription.trim()) {
      return validationError("Short description is required")
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
        challengeData.shortDescription || null,
        challengeData.difficulty || null,
        challengeData.teamSize || null,
        challengeData.challengeLanguage || null,
        JSON.stringify(challengeData)
      ]

      if (challengeId) {
        const whereClause =
          req.user?.role === "admin"
            ? "WHERE id = $18 AND category_id = $2"
            : "WHERE id = $18 AND user_id = $1 AND category_id = $2"

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
               short_description = $13,
               difficulty = $14,
               team_size = $15,
               challenge_language = $16,
               challenge_data = $17::jsonb,
               published_at = CASE
                 WHEN $3 = 'published' AND sponsor_challenges.published_at IS NULL THEN NOW()
                 WHEN $3 = 'published' THEN sponsor_challenges.published_at
                 ELSE NULL
               END,
               updated_at = NOW()
           ${whereClause}
           RETURNING id, user_id, category_id, status,
                     company_name, branch, contact_name, contact_function,
                     contact_email, contact_phone, website, logo_note,
                     challenge_title, short_description, difficulty, team_size,
                     challenge_language, challenge_data, published_at, created_at, updated_at`,
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
             challenge_title, short_description, difficulty, team_size,
             challenge_language, challenge_data, published_at, updated_at
           ) VALUES (
             $1, $2, $3,
             $4, $5, $6, $7,
             $8, $9, $10, $11,
             $12, $13, $14, $15,
             $16, $17::jsonb,
             CASE WHEN $3 = 'published' THEN NOW() ELSE NULL END,
             NOW()
           )
           RETURNING id, user_id, category_id, status,
                     company_name, branch, contact_name, contact_function,
                     contact_email, contact_phone, website, logo_note,
                     challenge_title, short_description, difficulty, team_size,
                     challenge_language, challenge_data, published_at, created_at, updated_at`,
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
