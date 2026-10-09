import { query } from "@/lib/db"
import { withCategoryPartnerAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, errorResponse } from "@/lib/api"
import { adminTeamsFlag } from "@/lib/flags"

export const GET = withCategoryPartnerAuth(async (req: AuthenticatedRequest) => {
  try {
    const showTeams = await adminTeamsFlag()
    if (!showTeams) {
      return errorResponse("Not found", 404)
    }

    const categoryId = req.user?.categoryId
    const filter = categoryId ? "WHERE teams.category_id = $1" : ""
    const params = categoryId ? [categoryId] : []

    const result = await query(
      `SELECT teams.id AS team_id, teams.name AS team_name,
              last_msg.created_at AS last_message_at,
              last_msg.sender_id AS last_sender_id
       FROM teams
       LEFT JOIN LATERAL (
         SELECT created_at, sender_id
         FROM team_chat_messages
         WHERE team_id = teams.id AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT 1
       ) last_msg ON TRUE
       ${filter}
       ORDER BY teams.name ASC`,
      params
    )

    return successResponse({ teams: result.rows })
  } catch (error) {
    console.error("[Teams Chat Summary] GET Error:", error)
    return errorResponse("Failed to load chat summary", 500)
  }
})
