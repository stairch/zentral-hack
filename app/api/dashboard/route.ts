import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyJWT } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userId = payload.userId

    // Fetch profile
    const profileResult = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role,
              p.university, p.study_program, p.semester, p.linkedin_url
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    )
    const profile = profileResult.rows[0] || null

    // Fetch registration with category
    const regResult = await query(
      `SELECT r.id, r.category_id, r.dietary_restrictions, r.allergies, r.status,
              c.name as category_name, c.slug as category_slug, c.description as category_description
       FROM registrations r
       JOIN categories c ON r.category_id = c.id
       WHERE r.user_id = $1`,
      [userId]
    )
    const registration = regResult.rows[0]
      ? {
          id: regResult.rows[0].id,
          status: regResult.rows[0].status,
          dietary_restrictions: regResult.rows[0].dietary_restrictions,
          allergies: regResult.rows[0].allergies,
          category: {
            id: regResult.rows[0].category_id,
            name: regResult.rows[0].category_name,
            slug: regResult.rows[0].category_slug,
            description: regResult.rows[0].category_description
          }
        }
      : null

    // Fetch team membership
    const teamResult = await query(
      `SELECT t.id, t.name, t.description,
              c.name as category_name,
              tm.role as member_role
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       JOIN categories c ON t.category_id = c.id
       WHERE tm.user_id = $1`,
      [userId]
    )
    const team = teamResult.rows[0]
      ? {
          id: teamResult.rows[0].id,
          name: teamResult.rows[0].name,
          description: teamResult.rows[0].description,
          member_role: teamResult.rows[0].member_role,
          category: { name: teamResult.rows[0].category_name }
        }
      : null

    // Fetch team files & repos if in a team
    let teamFiles: {
      id: string
      original_name: string
      file_size: number
      mime_type: string
      created_at: string
    }[] = []
    let teamRepos: {
      id: string
      repository_url: string
      title: string
      description: string
      created_at: string
    }[] = []
    if (team) {
      const filesResult = await query(
        "SELECT id, original_name, file_size, mime_type, created_at FROM team_files WHERE team_id = $1 ORDER BY created_at DESC",
        [team.id]
      )
      teamFiles = filesResult.rows

      const reposResult = await query(
        "SELECT id, repository_url, title, description, created_at FROM team_github_repos WHERE team_id = $1 ORDER BY created_at DESC",
        [team.id]
      )
      teamRepos = reposResult.rows
    }

    // Fetch category documents (if registered)
    let categoryDocuments: {
      id: string
      name: string
      description: string
      file_path: string
      created_at: string
    }[] = []
    if (registration) {
      const catDocsResult = await query(
        "SELECT id, name, description, file_path, created_at FROM category_documents WHERE category_id = $1 ORDER BY created_at DESC",
        [registration.category.id]
      )
      categoryDocuments = catDocsResult.rows
    }

    // Fetch global documents (admin uploads for everyone)
    const globalDocsResult = await query(
      `SELECT id, name, description, file_path, created_at
       FROM category_documents
       WHERE category_id IS NULL
       ORDER BY created_at DESC`
    )
    const globalDocuments = globalDocsResult.rows

    return NextResponse.json({
      data: {
        profile,
        registration,
        team,
        teamFiles,
        teamRepos,
        categoryDocuments,
        globalDocuments
      }
    })
  } catch (error) {
    console.error("[Dashboard API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
