import { query } from "@/lib/db"
import { withAdminAuth, withCategoryPartnerAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, serverError, validationError, notFoundError } from "@/lib/api"
import { hashPassword } from "@/lib/auth"

// Builds the per-user registration detail array (category, status, profile info) shown in the user modal / CSV export.
const REGISTRATIONS_SUBQUERY = `
  (
    SELECT json_agg(json_build_object(
      'id', rr.id,
      'category_id', rr.category_id,
      'category_name', rc.name,
      'status', rr.status,
      'university', p.university,
      'study_program', p.study_program,
      'semester', p.semester,
      'allergies', rr.allergies,
      'dietary_restrictions', rr.dietary_restrictions,
      'intolerances', rr.intolerances,
      'created_at', rr.created_at
    ) ORDER BY rr.created_at)
    FROM registrations rr
    JOIN categories rc ON rr.category_id = rc.id
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE rr.user_id = u.id
  )
`

async function handleGet(req: AuthenticatedRequest) {
  try {
    if (req.user?.role === "category_partner") {
      // Category partners only see users registered for their category, with a confirmed email
      const result = await query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.role,
                u.is_active, u.created_at, u.admin_role_id,
                u.email_verified, u.email_verified_at,
                ar.name as admin_role_name,
                ${REGISTRATIONS_SUBQUERY.replace(
                  "WHERE rr.user_id = u.id",
                  "WHERE rr.user_id = u.id AND rr.category_id = $1"
                )} as registrations
         FROM users u
         LEFT JOIN admin_roles ar ON u.admin_role_id = ar.id
         WHERE u.email_verified = true
           AND EXISTS (SELECT 1 FROM registrations rr2 WHERE rr2.user_id = u.id AND rr2.category_id = $1)
         ORDER BY u.created_at DESC`,
        [req.user.categoryId ?? null]
      )
      return successResponse({ users: result.rows })
    }

    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role,
              u.is_active, u.created_at, u.admin_role_id,
              u.email_verified, u.email_verified_at,
              COALESCE(ar.name, '') as admin_role_name,
              COALESCE(cat_role.name, c.name) as category_name,
              ${REGISTRATIONS_SUBQUERY} as registrations
       FROM users u
       LEFT JOIN categories c ON u.category_id = c.id
       LEFT JOIN admin_roles ar ON u.admin_role_id = ar.id
       LEFT JOIN categories cat_role ON ar.category_id = cat_role.id
       WHERE u.email_verified = true
         AND (u.role != 'user' OR EXISTS (SELECT 1 FROM registrations rr2 WHERE rr2.user_id = u.id))
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

async function handlePatch(req: AuthenticatedRequest) {
  try {
    const { registrationId, categoryId } = await req.json()

    if (!registrationId || !categoryId) {
      return validationError("registrationId and categoryId are required")
    }

    const regResult = await query("SELECT id, user_id, category_id FROM registrations WHERE id = $1", [
      registrationId
    ])
    if (regResult.rows.length === 0) return notFoundError("Registration")
    const registration = regResult.rows[0]

    if (registration.category_id === categoryId) {
      return successResponse({ message: "Category unchanged" })
    }

    const catResult = await query("SELECT id FROM categories WHERE id = $1", [categoryId])
    if (catResult.rows.length === 0) return notFoundError("Category")

    const duplicate = await query("SELECT id FROM registrations WHERE user_id = $1 AND category_id = $2", [
      registration.user_id,
      categoryId
    ])
    if (duplicate.rows.length > 0) {
      return validationError("User is already registered for this category")
    }

    await query("UPDATE registrations SET category_id = $1, updated_at = NOW() WHERE id = $2", [
      categoryId,
      registrationId
    ])

    await query("UPDATE users SET category_id = $1 WHERE id = $2 AND role = 'user'", [
      categoryId,
      registration.user_id
    ])

    // Teams belong to a category, so drop memberships in teams of the previous category
    await query(
      `DELETE FROM team_members
       WHERE user_id = $1
         AND team_id IN (SELECT id FROM teams WHERE category_id = $2)`,
      [registration.user_id, registration.category_id]
    )

    // A challenge submission belongs to the old category's challenges, so withdraw it
    // to let the participant apply again in the new category
    await query("DELETE FROM challenge_submissions WHERE user_id = $1", [registration.user_id])

    return successResponse({ message: "Category updated successfully" })
  } catch (error) {
    console.error("[Admin Users] PATCH Error:", error)
    return serverError("Failed to update category")
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
    } else if (role === "user" && !categoryId) {
      return validationError("Category is required for participants")
    }

    if (role === "user") {
      const catCheck = await query("SELECT id FROM categories WHERE id = $1", [categoryId])
      if (catCheck.rows.length === 0) return validationError("Category not found")
    }

    if (role !== "category_partner" && role !== "sponsor" && role !== "user") {
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
    created.email_verified = true
    created.registrations = null

    if (role === "user") {
      const regResult = await query(
        `INSERT INTO registrations (user_id, category_id, status, confirmation_sent)
         VALUES ($1, $2, 'confirmed', false)
         RETURNING id, category_id, status, created_at`,
        [created.id, resolvedCategoryId]
      )
      created.registrations = [
        {
          ...regResult.rows[0],
          category_name: created.category_name,
          university: null,
          study_program: null,
          semester: null,
          allergies: null,
          dietary_restrictions: null,
          intolerances: null
        }
      ]
    }

    return successResponse({ user: created })
  } catch (error) {
    console.error("[Admin Users] POST Error:", error)
    return serverError("Failed to create user")
  }
}

export const GET = withCategoryPartnerAuth(handleGet)
export const POST = withAdminAuth(handlePost)
export const PUT = withAdminAuth(handlePut)
export const PATCH = withAdminAuth(handlePatch)
export const DELETE = withAdminAuth(handleDelete)
