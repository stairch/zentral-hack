import { NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth"
import { query } from "@/lib/db"
import { successResponse } from "@/lib/api"

/**
 * GET /api/check-auth
 * Verify current session via httpOnly cookie (backward compatibility alias)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "No token" }, { status: 401 })

    const payload = verifyJWT(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const result = await query("SELECT id, email, first_name, last_name, role FROM users WHERE id = $1", [
      payload.userId
    ])

    if (result.rows.length === 0) return NextResponse.json({ error: "User not found" }, { status: 401 })

    const user = result.rows[0]
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token
    })
  } catch (error) {
    console.error("[Check-Auth] Error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
