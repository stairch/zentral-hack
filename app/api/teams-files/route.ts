import { del } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { successResponse, serverError } from "@/lib/api"
import { verifyJWT } from "@/lib/auth"
import { verifyUploadedBlob } from "@/lib/blob-upload"
import {
  getTeamSubmissionDeadline,
  hasTeamAccess,
  isTeamSubmissionClosed,
  SUBMISSION_CLOSED_ERROR
} from "@/lib/team-access"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

    const payload = verifyJWT(token)
    if (!payload) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

    const activeUser = await query("SELECT is_active FROM users WHERE id = $1", [payload.userId])
    if (activeUser.rows.length === 0 || !activeUser.rows[0].is_active) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const teamId = request.nextUrl.searchParams.get("teamId")
    if (!teamId)
      return new NextResponse(JSON.stringify({ error: "teamId parameter required" }), { status: 400 })

    if (!(await hasTeamAccess(teamId, payload.userId, payload.role, payload.categoryId))) {
      return new NextResponse(JSON.stringify({ error: "Not a team member" }), { status: 403 })
    }

    const result = await query(
      `SELECT id, original_name, file_path, file_size, mime_type, uploaded_by, created_at
       FROM team_files
       WHERE team_id = $1
       ORDER BY created_at DESC`,
      [teamId]
    )

    const submissionDeadline = await getTeamSubmissionDeadline(teamId)
    // Staff can still edit after the deadline, so the UI only locks for participants
    const submissionClosed = await isTeamSubmissionClosed(teamId, payload.role)

    return successResponse({ files: result.rows, submissionDeadline, submissionClosed })
  } catch (error) {
    console.error("Team files fetch error:", error)
    return serverError("Fehler beim Laden der Dateien")
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

    const payload = verifyJWT(token)
    if (!payload) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

    const activeUser = await query("SELECT is_active FROM users WHERE id = $1", [payload.userId])
    if (activeUser.rows.length === 0 || !activeUser.rows[0].is_active) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const teamId = request.nextUrl.searchParams.get("teamId")
    if (!teamId)
      return new NextResponse(JSON.stringify({ error: "teamId parameter required" }), { status: 400 })

    if (!(await hasTeamAccess(teamId, payload.userId, payload.role, payload.categoryId))) {
      return new NextResponse(JSON.stringify({ error: "Not a team member" }), { status: 403 })
    }

    if (await isTeamSubmissionClosed(teamId, payload.role)) {
      return new NextResponse(JSON.stringify({ error: SUBMISSION_CLOSED_ERROR }), { status: 403 })
    }

    // The browser already uploaded the file to Vercel Blob (lib/client-upload.ts), we only get its URL
    const { url, name } = await request.json()
    const verified = await verifyUploadedBlob(url, name, `teams/${teamId}`, payload)
    if (!verified.valid) {
      return new NextResponse(JSON.stringify({ error: verified.error }), { status: 400 })
    }
    const file = verified.blob

    const result = await query(
      `INSERT INTO team_files (team_id, original_name, file_path, file_size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, original_name, file_path, file_size, created_at`,
      [teamId, file.name, file.url, file.size, file.type, payload.userId]
    )

    return successResponse({ file: result.rows[0], message: "File uploaded successfully" }, 201)
  } catch (error) {
    console.error("Team file upload error:", error)
    return serverError("Fehler beim Hochladen der Datei")
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

    const payload = verifyJWT(token)
    if (!payload) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

    const activeUser = await query("SELECT is_active FROM users WHERE id = $1", [payload.userId])
    if (activeUser.rows.length === 0 || !activeUser.rows[0].is_active) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const teamId = request.nextUrl.searchParams.get("teamId")
    const fileId = request.nextUrl.searchParams.get("fileId")

    if (!teamId)
      return new NextResponse(JSON.stringify({ error: "teamId parameter required" }), { status: 400 })
    if (!fileId)
      return new NextResponse(JSON.stringify({ error: "fileId parameter required" }), { status: 400 })

    if (!(await hasTeamAccess(teamId, payload.userId, payload.role, payload.categoryId))) {
      return new NextResponse(JSON.stringify({ error: "Not a team member" }), { status: 403 })
    }

    if (await isTeamSubmissionClosed(teamId, payload.role)) {
      return new NextResponse(JSON.stringify({ error: SUBMISSION_CLOSED_ERROR }), { status: 403 })
    }

    const fileRecord = await query("SELECT id, file_path FROM team_files WHERE id = $1 AND team_id = $2", [
      fileId,
      teamId
    ])

    if (fileRecord.rows.length === 0) {
      return new NextResponse(JSON.stringify({ error: "File not found" }), { status: 404 })
    }

    const blobUrl = fileRecord.rows[0].file_path
    try {
      if (blobUrl?.startsWith("https://")) {
        await del(blobUrl)
      }
    } catch (e) {
      console.warn("Blob deletion failed, continuing:", e)
    }

    await query("DELETE FROM team_files WHERE id = $1", [fileId])

    return successResponse({ message: "File deleted successfully" })
  } catch (error) {
    console.error("Team file delete error:", error)
    return serverError("Fehler beim Löschen der Datei")
  }
}
