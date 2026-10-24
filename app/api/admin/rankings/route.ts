import { query, getClient } from "@/lib/db"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { getRankingCategories } from "@/lib/event-phase-server"

async function handleGet() {
  try {
    return successResponse({ categories: await getRankingCategories() })
  } catch (error) {
    console.error("[Rankings] GET Error:", error)
    return serverError()
  }
}

// Replaces the placements of one ranking group, teamIds in order of rank
async function handlePut(req: AuthenticatedRequest) {
  const body = await req.json().catch(() => ({}))
  const categoryId = body.categoryId ? String(body.categoryId) : ""
  const challengeId = body.challengeId ? String(body.challengeId) : null
  const teamIds: unknown = body.teamIds

  if (!categoryId) return validationError("Category ID required")
  if (!Array.isArray(teamIds) || teamIds.some((id) => typeof id !== "string")) {
    return validationError("teamIds must be a list of team IDs")
  }
  if (new Set(teamIds).size !== teamIds.length) return validationError("A team can only be ranked once")

  const client = await getClient()
  try {
    const groupResult = await query(
      "SELECT id FROM teams WHERE category_id = $1 AND challenge_id IS NOT DISTINCT FROM $2",
      [categoryId, challengeId]
    )
    const groupTeamIds: string[] = groupResult.rows.map((row) => row.id)
    if (teamIds.some((id) => !groupTeamIds.includes(id))) {
      return validationError("Team does not belong to this challenge")
    }

    await client.query("BEGIN")
    await client.query("DELETE FROM team_rankings WHERE team_id = ANY($1::uuid[])", [groupTeamIds])
    for (const [index, teamId] of teamIds.entries()) {
      await client.query("INSERT INTO team_rankings (team_id, rank, updated_by) VALUES ($1, $2, $3)", [
        teamId,
        index + 1,
        req.user?.userId ?? null
      ])
    }
    await client.query("COMMIT")

    return successResponse({ ranked_team_ids: teamIds })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("[Rankings] PUT Error:", error)
    return serverError()
  } finally {
    client.release()
  }
}

export const GET = withAdminAuth(handleGet)
export const PUT = withAdminAuth(handlePut)
