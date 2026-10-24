import { query } from "@/lib/db"
import { withCategoryPartnerAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError, errorResponse } from "@/lib/api"
import { adminTeamsFlag } from "@/lib/flags"
import { syncTeamChallengeToMembers } from "@/lib/team-access"

async function handleGet(req: AuthenticatedRequest) {
  try {
    const showTeams = await adminTeamsFlag()
    if (!showTeams) {
      return errorResponse("Not found", 404)
    }

    // Super admins see every team, even when they have a category assigned.
    const categoryId = req.user?.role === "admin" ? undefined : req.user?.categoryId

    if (!categoryId && req.user?.role !== "admin") {
      return validationError("Category ID required")
    }

    const filter = categoryId ? "WHERE teams.category_id = $1" : ""
    const params = categoryId ? [categoryId] : []

    const result = await query(
      `SELECT teams.id, teams.name, teams.description, teams.category_id, teams.challenge_id,
              c.name as category_name, c.color as category_color,
              sc.challenge_title, sc.challenge_title_en,
              COUNT(DISTINCT team_members.id) as member_count,
              teams.created_at
       FROM teams
       LEFT JOIN team_members ON teams.id = team_members.team_id
       JOIN categories c ON teams.category_id = c.id
       LEFT JOIN sponsor_challenges sc ON teams.challenge_id = sc.id
       ${filter}
       GROUP BY teams.id, c.name, c.color, sc.challenge_title, sc.challenge_title_en
       ORDER BY teams.created_at DESC`,
      params
    )

    return successResponse({ teams: result.rows })
  } catch (error) {
    console.error("[Teams] GET Error:", error)
    return serverError()
  }
}

async function resolveChallengeId(
  challengeId: unknown,
  categoryId: string
): Promise<{ ok: true; challengeId: string | null } | { ok: false }> {
  if (!challengeId) return { ok: true, challengeId: null }
  const check = await query("SELECT id FROM sponsor_challenges WHERE id = $1 AND category_id = $2", [
    String(challengeId),
    categoryId
  ])
  if (check.rows.length === 0) return { ok: false }
  return { ok: true, challengeId: String(challengeId) }
}

async function handlePost(req: AuthenticatedRequest) {
  try {
    const showTeams = await adminTeamsFlag()
    if (!showTeams) {
      return errorResponse("Not found", 404)
    }

    const body = await req.json()
    const { name, description, categoryId, challengeId } = body

    if (!name || !categoryId) {
      return validationError("Name and category required")
    }

    if (req.user?.role === "category_partner" && req.user.categoryId !== categoryId) {
      return validationError("Cannot create teams in other categories")
    }

    const resolvedChallenge = await resolveChallengeId(challengeId, categoryId)
    if (!resolvedChallenge.ok) return validationError("Challenge not found in this category")

    const catResult = await query("SELECT name FROM categories WHERE id = $1", [categoryId])
    const categoryName = catResult.rows[0]?.name || ""

    const result = await query(
      "INSERT INTO teams (name, description, category_id, challenge_id, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, description, category_id, challenge_id, created_at",
      [name, description || null, categoryId, resolvedChallenge.challengeId, req.user?.userId ?? null]
    )

    return successResponse(
      {
        team: { ...result.rows[0], category_name: categoryName, member_count: 0 }
      },
      201
    )
  } catch (error) {
    console.error("[Teams] POST Error:", error)
    return serverError()
  }
}

async function handlePut(req: AuthenticatedRequest) {
  try {
    const showTeams = await adminTeamsFlag()
    if (!showTeams) {
      return errorResponse("Not found", 404)
    }

    const body = await req.json()
    const { id, name, description, challengeId } = body

    if (!id || !name) {
      return validationError("ID and name required")
    }

    const teamCheck = await query("SELECT category_id FROM teams WHERE id = $1", [id])
    if (teamCheck.rows.length === 0) return validationError("Team not found")

    if (req.user?.role === "category_partner" && teamCheck.rows[0].category_id !== req.user.categoryId) {
      return validationError("Cannot edit teams from other categories")
    }

    // challengeId omitted entirely = leave the existing assignment untouched;
    // challengeId explicitly null/"" = clear it; a real id = reassign (validated below).
    let result
    if (challengeId !== undefined) {
      const resolvedChallenge = await resolveChallengeId(challengeId, teamCheck.rows[0].category_id)
      if (!resolvedChallenge.ok) return validationError("Challenge not found in this category")

      result = await query(
        "UPDATE teams SET name = $1, description = $2, challenge_id = $3, updated_at = NOW() WHERE id = $4 RETURNING id, name, description, category_id, challenge_id",
        [name, description || null, resolvedChallenge.challengeId, id]
      )
      await syncTeamChallengeToMembers(id)
    } else {
      result = await query(
        "UPDATE teams SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, description, category_id, challenge_id",
        [name, description || null, id]
      )
    }

    if (!result.rows[0]) return validationError("Team not found")

    return successResponse({ team: result.rows[0] })
  } catch (error) {
    console.error("[Teams] PUT Error:", error)
    return serverError()
  }
}

async function handleDelete(req: AuthenticatedRequest) {
  try {
    const showTeams = await adminTeamsFlag()
    if (!showTeams) {
      return errorResponse("Not found", 404)
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get("id")

    if (!teamId) return validationError("Team ID required")

    // Verify access
    if (req.user?.role === "category_partner") {
      const teamCheck = await query("SELECT category_id FROM teams WHERE id = $1", [teamId])
      if (teamCheck.rows.length === 0) return validationError("Team not found")
      if (teamCheck.rows[0].category_id !== req.user.categoryId) {
        return validationError("Cannot delete teams from other categories")
      }
    }

    await query("DELETE FROM teams WHERE id = $1", [teamId])
    return successResponse({ message: "Team deleted" })
  } catch (error) {
    console.error("[Teams] DELETE Error:", error)
    return serverError()
  }
}

export const GET = withCategoryPartnerAuth(handleGet)
export const POST = withCategoryPartnerAuth(handlePost)
export const PUT = withCategoryPartnerAuth(handlePut)
export const DELETE = withCategoryPartnerAuth(handleDelete)
