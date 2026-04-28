import { query } from "@/lib/db"
import { withAdminAuth, withCategoryPartnerAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, serverError, validationError, notFoundError } from "@/lib/api"
import { hashPassword } from "@/lib/auth"

async function handleGet(req: AuthenticatedRequest) {
  try {
    if (req.user?.role === "category_partner") {
      // Category partners only see users registered for their category
      const result = await query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.role,
                u.is_active, u.created_at, u.admin_role_id,
                rc.name as category_name,
                ar.name as admin_role_name
         FROM users u
         JOIN registrations r ON u.id = r.user_id
         JOIN categories rc ON r.category_id = rc.id
         LEFT JOIN admin_roles ar ON u.admin_role_id = ar.id
         WHERE rc.id = $1
         ORDER BY u.created_at DESC`,
        [req.user.categoryId ?? null]
      )
      return successResponse({ users: result.rows })
    }

    // Super admins see all users
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role,
              u.is_active, u.created_at, u.admin_role_id,
              COALESCE(ar.name, '') as admin_role_name,
              COALESCE(cat_role.name, c.name, rc.name) as category_name
       FROM users u
       LEFT JOIN categories c ON u.category_id = c.id
       LEFT JOIN admin_roles ar ON u.admin_role_id = ar.id
       LEFT JOIN categories cat_role ON ar.category_id = cat_role.id
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
    const { userId, role, categoryId, adminRoleId } = body

    if (!userId || !role) {
      return validationError("userId and role are required")
    }

    const validRoles = ["user", "category_partner", "sponsor", "admin"]
    if (!validRoles.includes(role)) {
      return validationError("Invalid role. Must be: user, category_partner, sponsor, or admin")
    }

    // If assigning a custom admin role, resolve the category from it
    let resolvedCategoryId = categoryId || null
    let resolvedAdminRoleId: string | null = null

    if (role === "category_partner" && adminRoleId) {
      const roleResult = await query("SELECT id, category_id FROM admin_roles WHERE id = $1", [adminRoleId])
      if (roleResult.rows.length === 0) return validationError("Admin role not found")
      resolvedAdminRoleId = roleResult.rows[0].id
      resolvedCategoryId = roleResult.rows[0].category_id
    } else if (role === "category_partner" && !categoryId) {
      return validationError("Category or admin role is required for category_partner")
    } else if (role === "sponsor" && !categoryId) {
      return validationError("Category is required for sponsor role")
    }

    if (role !== "category_partner" && role !== "sponsor") {
      resolvedCategoryId = null
      resolvedAdminRoleId = null
    }

    await query(
      "UPDATE users SET role = $1, category_id = $2, admin_role_id = $3, updated_at = NOW() WHERE id = $4",
      [role, resolvedCategoryId, resolvedAdminRoleId, userId]
    )
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

async function handlePost(req: AuthenticatedRequest) {
  try {
    const { email, firstName, lastName, password, role, categoryId, adminRoleId } = await req.json()

    if (!email || !password || !firstName || !lastName || !role) {
      return validationError("email, firstName, lastName, password, and role are required")
    }

    const validRoles = ["user", "category_partner", "sponsor", "admin"]
    if (!validRoles.includes(role)) {
      return validationError("Invalid role")
    }

    if (password.length < 8) {
      return validationError("Password must be at least 8 characters")
    }

    // Resolve category from admin role if provided
    let resolvedCategoryId = categoryId || null
    let resolvedAdminRoleId: string | null = null

    if (role === "category_partner" && adminRoleId) {
      const roleResult = await query("SELECT id, category_id FROM admin_roles WHERE id = $1", [adminRoleId])
      if (roleResult.rows.length === 0) return validationError("Admin role not found")
      resolvedAdminRoleId = roleResult.rows[0].id
      resolvedCategoryId = roleResult.rows[0].category_id
    } else if (role === "category_partner" && !categoryId) {
      return validationError("Category or admin role is required for category_partner")
    } else if (role === "sponsor" && !categoryId) {
      return validationError("Category is required for sponsor role")
    }

    if (role !== "category_partner" && role !== "sponsor") {
      resolvedCategoryId = null
      resolvedAdminRoleId = null
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()])
    if (existing.rows.length > 0) {
      return validationError("A user with this email already exists")
    }

    const passwordHash = await hashPassword(password)

    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, category_id, admin_role_id, email_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, true)
       RETURNING id, email, first_name, last_name, role, is_active, created_at, admin_role_id`,
      [
        email.toLowerCase(),
        passwordHash,
        firstName.trim(),
        lastName.trim(),
        role,
        resolvedCategoryId,
        resolvedAdminRoleId
      ]
    )

    const created = result.rows[0]
    if (resolvedCategoryId) {
      const catResult = await query("SELECT name FROM categories WHERE id = $1", [resolvedCategoryId])
      created.category_name = catResult.rows[0]?.name || null
    } else {
      created.category_name = null
    }
    created.admin_role_name = resolvedAdminRoleId
      ? (await query("SELECT name FROM admin_roles WHERE id = $1", [resolvedAdminRoleId])).rows[0]?.name ||
        null
      : null

    return successResponse({ user: created })
  } catch (error) {
    console.error("[Admin Users] POST Error:", error)
    return serverError("Failed to create user")
  }
}

export const GET = withCategoryPartnerAuth(handleGet)
export const POST = withAdminAuth(handlePost)
export const PUT = withAdminAuth(handlePut)
export const DELETE = withAdminAuth(handleDelete)
