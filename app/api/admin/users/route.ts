import { query } from "@/lib/db"
import { withAdminAuth, withCategoryPartnerAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, serverError, validationError, notFoundError } from "@/lib/api"

async function handleGet(req: AuthenticatedRequest) {
  try {
    if (req.user?.role === "category_partner") {
      // Category partners only see users registered for their category
      const result = await query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.role,
                u.is_active, u.created_at,
                rc.name as category_name
         FROM users u
         JOIN registrations r ON u.id = r.user_id
         JOIN categories rc ON r.category_id = rc.id
         WHERE rc.id = $1
         ORDER BY u.created_at DESC`,
        [req.user.categoryId ?? null]
      )
      return successResponse({ users: result.rows })
    }

    // Super admins see all users
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role,
              u.is_active, u.created_at,
              COALESCE(rc.name, c.name) as category_name
       FROM users u
       LEFT JOIN categories c ON u.category_id = c.id
       LEFT JOIN registrations r ON u.id = r.user_id
       LEFT JOIN categories rc ON r.category_id = rc.id
       ORDER BY u.created_at DESC`
    )
    return successResponse({ users: result.rows })
  } catch (error) {
    console.error("[Admin Users] GET Error:", error)
    return serverError("Failed to load users")
  }
}

async function handlePut(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const { userId, role, categoryId } = body

    if (!userId || !role) {
      return validationError("userId and role are required")
    }

    const validRoles = ["user", "category_partner", "sponsor", "admin"]
    if (!validRoles.includes(role)) {
      return validationError("Invalid role. Must be: user, category_partner, sponsor, or admin")
    }

    if ((role === "category_partner" || role === "sponsor") && !categoryId) {
      return validationError("Category is required for category_partner and sponsor roles")
    }

    const newCategoryId = role === "category_partner" || role === "sponsor" ? categoryId : null
    await query("UPDATE users SET role = $1, category_id = $2, updated_at = NOW() WHERE id = $3", [
      role,
      newCategoryId,
      userId
    ])
    return successResponse({ message: "Role updated successfully" })
  } catch (error) {
    console.error("[Admin Users] PUT Error:", error)

    const pgError = error as { code?: string; constraint?: string } | null
    if (pgError?.code === "23514" && pgError?.constraint === "users_role_check") {
      return validationError(
        "Database role constraint not updated yet. Please run scripts/119_sponsor_role_constraint_fix.sql"
      )
    }

    return serverError("Failed to update role")
  }
}

async function handleDelete(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return validationError("User ID required")
    }

    if (req.user?.userId === userId) {
      return validationError("Cannot delete your own account")
    }

    const userResult = await query("SELECT id, email, role FROM users WHERE id = $1", [userId])
    if (userResult.rows.length === 0) {
      return notFoundError("User")
    }

    const targetUser = userResult.rows[0]
    if (targetUser.role === "admin") {
      return validationError("Cannot delete another super admin account")
    }

    // Delete in correct order to respect FK constraints
    await query("DELETE FROM team_members WHERE user_id = $1", [userId])
    await query("DELETE FROM registrations WHERE user_id = $1", [userId])
    await query("DELETE FROM users WHERE id = $1", [userId])

    return successResponse({ message: "User deleted successfully" })
  } catch (error) {
    console.error("[Admin Users] DELETE Error:", error)
    return serverError("Failed to delete user")
  }
}

export const GET = withCategoryPartnerAuth(handleGet)
export const PUT = withAdminAuth(handlePut)
export const DELETE = withAdminAuth(handleDelete)
