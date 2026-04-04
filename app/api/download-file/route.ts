import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyJWT } from "@/lib/auth"
import { readFile } from "fs/promises"
import { stat } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

/**
 * GET /api/download-file?fileId=X
 * Authenticated file download with lazy loading and caching
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

    const fileRecord = await query(
      `SELECT f.id, f.team_id, f.original_name, f.file_path, f.file_size, f.mime_type
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

    const filePath = join(process.cwd(), "data", "uploads", file.file_path.replace(/^\/uploads\//, ""))

    if (!existsSync(filePath)) {
      console.error("[Download] File not found on disk:", filePath)
      return new NextResponse(JSON.stringify({ error: "File not found on disk" }), { status: 404 })
    }

    const fileStats = await stat(filePath)
    const fileSize = fileStats.size
    const lastModified = fileStats.mtime.toUTCString()
    const eTag = `"${fileStats.ino}-${fileStats.mtime.getTime()}"`

    const ifNoneMatch = request.headers.get("if-none-match")
    if (ifNoneMatch === eTag) {
      return new NextResponse(null, { status: 304 })
    }

    const fileBuffer = await readFile(filePath)

    const headers = new Headers({
      "Content-Type": file.mime_type || "application/pdf",
      "Content-Length": fileSize.toString(),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.original_name)}"`,
      ETag: eTag,
      "Last-Modified": lastModified,
      "Cache-Control": "private, max-age=2592000, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY"
    })

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error("[Download] Error:", error)
    return new NextResponse(JSON.stringify({ error: "Download failed" }), { status: 500 })
  }
}
