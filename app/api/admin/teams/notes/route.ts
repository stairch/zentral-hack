import { query } from "@/lib/db"
import { withCategoryPartnerAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError, errorResponse } from "@/lib/api"
import { adminTeamsFlag } from "@/lib/flags"
import { canManageTeam } from "@/lib/team-access"

const MAX_NOTE_LENGTH = 5000

async function handleGet(req: AuthenticatedRequest) {
  try {
    const showTeams = await adminTeamsFlag()
    if (!showTeams) {
      return errorResponse("Not found", 404)
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get("teamId")
    if (!teamId) return validationError("Team ID required")

    if (!(await canManageTeam(teamId, req.user?.role, req.user?.categoryId))) {
      return validationError("Team not found")
    }

    const [notesResult, rankingResult] = await Promise.all([
      query(
        `SELECT n.id, n.content, n.created_at, n.author_id,
                u.first_name AS author_first_name, u.last_name AS author_last_name, u.email AS author_email
         FROM team_notes n
         LEFT JOIN users u ON n.author_id = u.id
         WHERE n.team_id = $1
         ORDER BY n.created_at DESC`,
        [teamId]
      ),
      query(
        `SELECT r.rank, r.updated_at,
                u.first_name AS updated_by_first_name, u.last_name AS updated_by_last_name,
                u.email AS updated_by_email
         FROM team_rankings r
         LEFT JOIN users u ON r.updated_by = u.id
         WHERE r.team_id = $1`,
        [teamId]
      )
    ])

    return successResponse({ notes: notesResult.rows, ranking: rankingResult.rows[0] || null })
  } catch (error) {
    console.error("[Team Notes] GET Error:", error)
    return serverError()
  }
}

async function handlePost(req: AuthenticatedRequest) {
  try {
    const showTeams = await adminTeamsFlag()
    if (!showTeams) {
      return errorResponse("Not found", 404)
    }

    const body = await req.json()
    const teamId = body.teamId ? String(body.teamId) : ""
    const content = typeof body.content === "string" ? body.content.trim() : ""

    if (!teamId || !content) return validationError("Team ID and content required")
    if (content.length > MAX_NOTE_LENGTH) return validationError("Note is too long")

    if (!(await canManageTeam(teamId, req.user?.role, req.user?.categoryId))) {
      return validationError("Team not found")
    }

    const result = await query(
      `WITH inserted AS (
         INSERT INTO team_notes (team_id, author_id, content) VALUES ($1, $2, $3)
         RETURNING id, content, created_at, author_id
       )
       SELECT inserted.*, u.first_name AS author_first_name, u.last_name AS author_last_name,
              u.email AS author_email
       FROM inserted
       LEFT JOIN users u ON inserted.author_id = u.id`,
      [teamId, req.user?.userId ?? null, content]
    )

    return successResponse({ note: result.rows[0] }, 201)
  } catch (error) {
    console.error("[Team Notes] POST Error:", error)
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
    const noteId = searchParams.get("noteId")
    if (!noteId) return validationError("Note ID required")

    const noteCheck = await query("SELECT team_id, author_id FROM team_notes WHERE id = $1", [noteId])
    if (noteCheck.rows.length === 0) return validationError("Note not found")

    const note = noteCheck.rows[0]
    if (!(await canManageTeam(note.team_id, req.user?.role, req.user?.categoryId))) {
      return validationError("Note not found")
    }

    // Notes are documentation, so only their author or a super admin may remove them.
    if (req.user?.role !== "admin" && note.author_id !== req.user?.userId) {
      return errorResponse("Only the author can delete this note", 403)
    }

    await query("DELETE FROM team_notes WHERE id = $1", [noteId])
    return successResponse({ message: "Note deleted" })
  } catch (error) {
    console.error("[Team Notes] DELETE Error:", error)
    return serverError()
  }
}

export const GET = withCategoryPartnerAuth(handleGet)
export const POST = withCategoryPartnerAuth(handlePost)
export const DELETE = withCategoryPartnerAuth(handleDelete)
