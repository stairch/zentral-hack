import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyJWT } from "@/lib/auth"

/**
 * GET /api/download-file?fileId=X
 * GET /api/download-file?fileId=X&type=document
 *
 * Auth proxy: fetches file from Vercel Blob server-side so the Blob URL
 * is never exposed to the client.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const fileId = request.nextUrl.searchParams.get("fileId")
    if (!fileId) {
      return new NextResponse(JSON.stringify({ error: "fileId parameter required" }), { status: 400 })
    }

    const type = request.nextUrl.searchParams.get("type") // "document" | null (team file)

    let blobUrl: string
    let originalName: string
    let mimeType: string

    if (type === "document") {
      // Category or global document
      const result = await query(
        "SELECT id, name, file_path, category_id FROM category_documents WHERE id = $1",
        [fileId]
      )

      if (result.rows.length === 0) {
        return new NextResponse(JSON.stringify({ error: "File not found" }), { status: 404 })
      }

      const doc = result.rows[0]

      // Category docs require registration in that category, admin, or category_partner.
      // Global docs (category_id IS NULL) are accessible to any authenticated user.
      if (doc.category_id && payload.role !== "admin" && payload.role !== "category_partner") {
        const regCheck = await query("SELECT id FROM registrations WHERE user_id = $1 AND category_id = $2", [
          payload.userId,
          doc.category_id
        ])
        const sponsorCheck = await query("SELECT id FROM users WHERE id = $1 AND category_id = $2", [
          payload.userId,
          doc.category_id
        ])
        if (regCheck.rows.length === 0 && sponsorCheck.rows.length === 0) {
          return new NextResponse(JSON.stringify({ error: "Access denied" }), { status: 403 })
        }
      }

      blobUrl = doc.file_path
      originalName = doc.name
      mimeType = "application/octet-stream" // overridden by Blob Content-Type below
    } else {
      // Team file
      const fileRecord = await query(
        `SELECT f.id, f.team_id, f.original_name, f.file_path, f.mime_type
         FROM team_files f
         WHERE f.id = $1`,
        [fileId]
      )

      if (fileRecord.rows.length === 0) {
        return new NextResponse(JSON.stringify({ error: "File not found" }), { status: 404 })
      }

      const file = fileRecord.rows[0]

      const memberCheck = await query("SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2", [
        file.team_id,
        payload.userId
      ])

      if (memberCheck.rows.length === 0 && payload.role !== "admin") {
        return new NextResponse(JSON.stringify({ error: "Access denied" }), { status: 403 })
      }

      blobUrl = file.file_path
      originalName = file.original_name
      mimeType = file.mime_type || "application/octet-stream"
    }

    if (!blobUrl) {
      return new NextResponse(JSON.stringify({ error: "File not found" }), { status: 404 })
    }

    // Old files stored on the local filesystem (before Blob migration) are no longer accessible
    if (!blobUrl.startsWith("https://")) {
      return new NextResponse(JSON.stringify({ error: "File is no longer available. Please re-upload." }), {
        status: 410
      })
    }

    const blobResponse = await fetch(blobUrl, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
    })
    if (!blobResponse.ok) {
      console.error("[Download] Blob fetch failed:", blobUrl, blobResponse.status)
      return new NextResponse(JSON.stringify({ error: "File could not be retrieved" }), { status: 502 })
    }

    const contentLength = blobResponse.headers.get("content-length")
    const contentType = blobResponse.headers.get("content-type") || mimeType

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(originalName)}"`,
      "Cache-Control": "private, max-age=2592000, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY"
    })
    if (contentLength) headers.set("Content-Length", contentLength)

    return new NextResponse(blobResponse.body, { status: 200, headers })
  } catch (error) {
    console.error("[Download] Error:", error)
    return new NextResponse(JSON.stringify({ error: "Download failed" }), { status: 500 })
  }
}
