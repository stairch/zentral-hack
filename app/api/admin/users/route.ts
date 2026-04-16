import { query } from "@/lib/db"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, serverError, validationError } from "@/lib/api"

async function handleGet(_req: AuthenticatedRequest) {
  try {
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

export const GET = withAdminAuth(handleGet)
export const PUT = withAdminAuth(handlePut)
