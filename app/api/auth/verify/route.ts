import { NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth"
import { query } from "@/lib/db"
import { successResponse } from "@/lib/api"

/**
 * GET /api/auth/verify
 * Verify current session via httpOnly cookie
 * Consolidated endpoint - consolidates all three previous endpoints:
 * - /api/verify
 * - /api/auth-verify
 * - /api/check-auth
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from httpOnly cookie
    const token = request.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 })
    }

    const payload = verifyJWT(token)

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Fetch user details and their custom role permissions
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role,
              COALESCE(ar.category_id, u.category_id) AS category_id,
              u.is_active,
              u.admin_role_id,
              ar.name AS admin_role_name,
              ar.permissions AS role_permissions
       FROM users u
       LEFT JOIN admin_roles ar ON u.admin_role_id = ar.id
       WHERE u.id = $1`,
      [payload.userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const user = result.rows[0]
    if (!user.is_active) {
      return NextResponse.json({ error: "Inactive user" }, { status: 401 })
    }

    const permissions: string[] | null = Array.isArray(user.role_permissions) ? user.role_permissions : null

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        categoryId: user.category_id || null,
        adminRoleId: user.admin_role_id || null,
        adminRoleName: user.admin_role_name || null,
        permissions
      },
      token
    })
  } catch (error) {
    console.error("[Verify] Error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
