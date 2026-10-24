import { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { successResponse, serverError } from "@/lib/api"
import { verifyJWT } from "@/lib/auth"
import { z } from "zod"
import { hasTeamAccess, isTeamSubmissionClosed, SUBMISSION_CLOSED_ERROR } from "@/lib/team-access"

const INVALID_REPO_URL_ERROR =
  "Bitte gib einen gültigen Repository-Link ein, der mit https:// beginnt (z.B. https://gitlab.com/username/repo)"

const githubLinkSchema = z.object({
  repositoryUrl: z
    .string()
    .trim()
    .url(INVALID_REPO_URL_ERROR)
    .regex(/^https?:\/\//i, INVALID_REPO_URL_ERROR),
  title: z.string().min(1).max(100, "Der Titel darf maximal 100 Zeichen lang sein").optional(),
  description: z.string().max(500, "Die Beschreibung darf maximal 500 Zeichen lang sein").optional()
})

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

    const payload = verifyJWT(token)
    if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

    const activeUser = await query("SELECT is_active FROM users WHERE id = $1", [payload.userId])
    if (activeUser.rows.length === 0 || !activeUser.rows[0].is_active) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const teamId = request.nextUrl.searchParams.get("teamId")
    if (!teamId) return new Response(JSON.stringify({ error: "teamId parameter required" }), { status: 400 })

    const memberCheck = await query("SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2", [
      teamId,
      payload.userId
    ])

    if (memberCheck.rows.length === 0 && payload.role !== "admin") {
      return new Response(JSON.stringify({ error: "Not a team member" }), { status: 403 })
    }

    if (await isTeamSubmissionClosed(teamId, payload.role)) {
      return new Response(JSON.stringify({ error: SUBMISSION_CLOSED_ERROR }), { status: 403 })
    }

    const body = await request.json()
    const validation = githubLinkSchema.safeParse(body)

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: validation.error.issues[0]?.message ?? "Validierungsfehler",
          details: validation.error.flatten()
        }),
        { status: 400 }
      )
    }

    const { repositoryUrl, title, description } = validation.data

    const result = await query(
      `INSERT INTO team_github_repos (team_id, repository_url, title, description, added_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, repository_url, title, description, created_at`,
      [teamId, repositoryUrl, title || null, description || null, payload.userId]
    )

    return successResponse(
      {
        repo: result.rows[0],
        message: "GitHub repository link added successfully"
      },
      201
    )
  } catch (error) {
    console.error("GitHub link error:", error)
    return serverError("Fehler beim Hinzufügen des GitHub-Links")
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

    const payload = verifyJWT(token)
    if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

    const activeUser = await query("SELECT is_active FROM users WHERE id = $1", [payload.userId])
    if (activeUser.rows.length === 0 || !activeUser.rows[0].is_active) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const teamId = request.nextUrl.searchParams.get("teamId")
    if (!teamId) return new Response(JSON.stringify({ error: "teamId parameter required" }), { status: 400 })

    if (!(await hasTeamAccess(teamId, payload.userId, payload.role, payload.categoryId))) {
      return new Response(JSON.stringify({ error: "Not a team member" }), { status: 403 })
    }

    const result = await query(
      `SELECT id, repository_url, title, description, created_at
       FROM team_github_repos
       WHERE team_id = $1
       ORDER BY created_at DESC`,
      [teamId]
    )

    return successResponse({
      repos: result.rows
    })
  } catch (error) {
    console.error("GitHub repos fetch error:", error)
    return serverError("Fehler beim Laden der GitHub-Links")
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

    const payload = verifyJWT(token)
    if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

    const activeUser = await query("SELECT is_active FROM users WHERE id = $1", [payload.userId])
    if (activeUser.rows.length === 0 || !activeUser.rows[0].is_active) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const teamId = request.nextUrl.searchParams.get("teamId")
    const repoId = request.nextUrl.searchParams.get("repoId")

    if (!teamId || !repoId) {
      return new Response(JSON.stringify({ error: "teamId and repoId parameters required" }), { status: 400 })
    }

    const repo = await query("SELECT added_by FROM team_github_repos WHERE id = $1 AND team_id = $2", [
      repoId,
      teamId
    ])

    if (repo.rows.length === 0) {
      return new Response(JSON.stringify({ error: "Repository not found" }), { status: 404 })
    }

    if (repo.rows[0].added_by !== payload.userId && payload.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 })
    }

    if (await isTeamSubmissionClosed(teamId, payload.role)) {
      return new Response(JSON.stringify({ error: SUBMISSION_CLOSED_ERROR }), { status: 403 })
    }

    await query("DELETE FROM team_github_repos WHERE id = $1", [repoId])

    return successResponse({ message: "Repository deleted successfully" })
  } catch (error) {
    console.error("GitHub delete error:", error)
    return serverError("Fehler beim Löschen des GitHub-Links")
  }
}
