import { query } from "@/lib/db"
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import type { ChallengeSubmissionRecord } from "@/lib/challenge-submission"

async function resolveCategoryId(userId: string): Promise<string | null> {
  const result = await query("SELECT category_id FROM registrations WHERE user_id = $1 LIMIT 1", [userId])
  return result.rows[0]?.category_id || null
}

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user?.userId ?? ""
    const categoryId = await resolveCategoryId(userId)
    if (!categoryId) {
      return successResponse({ eligible: false, challenges: [], submission: null })
    }

    const challengesResult = await query(
      `SELECT id, challenge_title, challenge_title_en, submission_description_required
       FROM sponsor_challenges
       WHERE category_id = $1 AND status = 'published' AND submission_enabled = true
       ORDER BY challenge_title ASC`,
      [categoryId]
    )

    if (challengesResult.rows.length === 0) {
      return successResponse({ eligible: false, challenges: [], submission: null })
    }

    const submissionResult = await query("SELECT * FROM challenge_submissions WHERE user_id = $1", [userId])

    return successResponse({
      eligible: true,
      challenges: challengesResult.rows,
      submission: (submissionResult.rows[0] as ChallengeSubmissionRecord) || null
    })
  } catch (error) {
    console.error("[Challenge Submissions] GET error:", error)
    return serverError("Fehler beim Laden der Challenge-Auswahl")
  }
})

export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user?.userId ?? ""
    const body = await req.json()
    const challengeId = typeof body.challengeId === "string" ? body.challengeId : null
    const description = typeof body.description === "string" ? body.description.trim() : ""

    if (!challengeId) {
      return validationError("Bitte wähle eine Challenge aus")
    }

    const categoryId = await resolveCategoryId(userId)
    if (!categoryId) {
      return validationError("Keine Registrierung gefunden")
    }

    const challengeResult = await query(
      `SELECT id, submission_description_required
       FROM sponsor_challenges
       WHERE id = $1 AND category_id = $2 AND status = 'published' AND submission_enabled = true`,
      [challengeId, categoryId]
    )
    const challenge = challengeResult.rows[0]
    if (!challenge) {
      return validationError("Diese Challenge steht nicht zur Auswahl")
    }

    if (challenge.submission_description_required && !description) {
      return validationError("Bitte gib eine Challengebeschreibung ein")
    }

    const existing = await query("SELECT status FROM challenge_submissions WHERE user_id = $1", [userId])
    if (existing.rows[0]?.status === "accepted") {
      return validationError("Deine Einreichung wurde bereits angenommen und kann nicht mehr geändert werden")
    }

    const result = await query(
      `INSERT INTO challenge_submissions (user_id, category_id, challenge_id, description, status)
       VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT (user_id) DO UPDATE
       SET category_id = $2,
           challenge_id = $3,
           description = $4,
           status = 'pending',
           review_comment = NULL,
           reviewed_by = NULL,
           reviewed_at = NULL,
           updated_at = NOW()
       RETURNING *`,
      [userId, categoryId, challengeId, description || null]
    )

    return successResponse({ submission: result.rows[0] as ChallengeSubmissionRecord })
  } catch (error) {
    console.error("[Challenge Submissions] PUT error:", error)
    return serverError("Fehler beim Einreichen")
  }
})
