import { query } from "@/lib/db"
import { withCategoryPartnerAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError, errorResponse } from "@/lib/api"
import { adminTeamsFlag } from "@/lib/flags"
import { canManageTeam } from "@/lib/team-access"

const MAX_RANK = 999

async function handlePut(req: AuthenticatedRequest) {
  try {
    const showTeams = await adminTeamsFlag()
    if (!showTeams) {
      return errorResponse("Not found", 404)
    }

    const body = await req.json()
    const teamId = body.teamId ? String(body.teamId) : ""
    if (!teamId) return validationError("Team ID required")

    if (!(await canManageTeam(teamId, req.user?.role, req.user?.categoryId))) {
      return validationError("Team not found")
    }

    // rank null/"" = remove the placement
    if (body.rank === null || body.rank === "") {
      await query("DELETE FROM team_rankings WHERE team_id = $1", [teamId])
      return successResponse({ ranking: null })
    }

    const rank = Number(body.rank)
    if (!Number.isInteger(rank) || rank < 1 || rank > MAX_RANK) {
      return validationError(`Rank must be a whole number between 1 and ${MAX_RANK}`)
    }

    const result = await query(
      `WITH upserted AS (
         INSERT INTO team_rankings (team_id, rank, updated_by, updated_at) VALUES ($1, $2, $3, NOW())
         ON CONFLICT (team_id) DO UPDATE
           SET rank = EXCLUDED.rank, updated_by = EXCLUDED.updated_by, updated_at = NOW()
         RETURNING rank, updated_at, updated_by
       )
       SELECT upserted.rank, upserted.updated_at,
              u.first_name AS updated_by_first_name, u.last_name AS updated_by_last_name,
              u.email AS updated_by_email
       FROM upserted
       LEFT JOIN users u ON upserted.updated_by = u.id`,
      [teamId, rank, req.user?.userId ?? null]
    )

    return successResponse({ ranking: result.rows[0] })
  } catch (error) {
    console.error("[Team Ranking] PUT Error:", error)
    return serverError()
  }
}

export const PUT = withCategoryPartnerAuth(handlePut)
