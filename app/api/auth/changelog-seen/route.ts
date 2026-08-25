import { NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth"
import { query } from "@/lib/db"
import { successResponse } from "@/lib/api"

/**
 * POST /api/auth/changelog-seen
 * Updates last_seen_changelog_version for the current user.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 })
    }

    const payload = verifyJWT(token)

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { version } = body

    if (!version || typeof version !== "string") {
      return NextResponse.json({ error: "Missing version" }, { status: 400 })
    }

    await query(`UPDATE users SET last_seen_changelog_version = $1 WHERE id = $2`, [version, payload.userId])

    return successResponse({ ok: true })
  } catch (error) {
    console.error("[Changelog Seen] Error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
