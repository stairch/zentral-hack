import { query } from "@/lib/db"
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const result = await query(
      `SELECT t.id, t.name
       FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = $1
       LIMIT 1`,
      [req.user?.userId ?? ""]
    )
    return successResponse({ team: result.rows[0] || null })
  } catch (error) {
    console.error("[Team] GET error:", error)
    return serverError("Fehler beim Laden des Teams")
  }
})

export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { teamId, name } = await req.json()
    if (!teamId || typeof name !== "string" || !name.trim()) {
      return validationError("Team ID and name required")
    }

    const memberCheck = await query("SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2", [
      teamId,
      req.user?.userId ?? ""
    ])
    if (memberCheck.rows.length === 0) {
      return validationError("Not a team member")
    }

    const result = await query(
      "UPDATE teams SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name",
      [name.trim(), teamId]
    )
    if (!result.rows[0]) return validationError("Team not found")

    return successResponse({ team: result.rows[0] })
  } catch (error) {
    console.error("[Team] PUT error:", error)
    return serverError("Fehler beim Umbenennen des Teams")
  }
})
