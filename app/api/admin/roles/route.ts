import { query } from "@/lib/db"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, serverError, validationError, notFoundError } from "@/lib/api"

async function handleGet() {
  try {
    const result = await query(
      `SELECT ar.id, ar.name, ar.category_id, ar.permissions, ar.created_at, ar.updated_at,
              c.name AS category_name
       FROM admin_roles ar
       LEFT JOIN categories c ON ar.category_id = c.id
       ORDER BY ar.name`
    )
    return successResponse({ roles: result.rows })
  } catch (error) {
    console.error("[Admin Roles] GET Error:", error)
    return serverError("Failed to load roles")
  }
}

async function handlePost(req: AuthenticatedRequest) {
  try {
    const { name, categoryId, permissions } = await req.json()

    if (!name || !name.trim()) {
      return validationError("Role name is required")
    }

    if (!Array.isArray(permissions)) {
      return validationError("Permissions must be an array")
    }

    const result = await query(
      `INSERT INTO admin_roles (name, category_id, permissions)
       VALUES ($1, $2, $3::jsonb)
       RETURNING id, name, category_id, permissions, created_at, updated_at`,
      [name.trim(), categoryId || null, JSON.stringify(permissions)]
    )

    const role = result.rows[0]
    if (role.category_id) {
      const cat = await query("SELECT name FROM categories WHERE id = $1", [role.category_id])
      role.category_name = cat.rows[0]?.name || null
    } else {
      role.category_name = null
    }

    return successResponse({ role })
  } catch (error) {
    console.error("[Admin Roles] POST Error:", error)
    return serverError("Failed to create role")
  }
}

async function handlePut(req: AuthenticatedRequest) {
  try {
    const { id, name, categoryId, permissions } = await req.json()

    if (!id) return validationError("Role ID required")
    if (!name || !name.trim()) return validationError("Role name is required")
    if (!Array.isArray(permissions)) return validationError("Permissions must be an array")

    const result = await query(
      `UPDATE admin_roles
       SET name = $1, category_id = $2, permissions = $3::jsonb, updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, category_id, permissions, created_at, updated_at`,
      [name.trim(), categoryId || null, JSON.stringify(permissions), id]
    )

    if (result.rows.length === 0) return notFoundError("Role")

    const role = result.rows[0]
    if (role.category_id) {
      const cat = await query("SELECT name FROM categories WHERE id = $1", [role.category_id])
      role.category_name = cat.rows[0]?.name || null
    } else {
      role.category_name = null
    }

    // Sync category_id on users that have this role assigned
    await query(`UPDATE users SET category_id = $1 WHERE admin_role_id = $2`, [categoryId || null, id])

    return successResponse({ role })
  } catch (error) {
    console.error("[Admin Roles] PUT Error:", error)
    return serverError("Failed to update role")
  }
}

async function handleDelete(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return validationError("Role ID required")

    const usersWithRole = await query("SELECT COUNT(*) FROM users WHERE admin_role_id = $1", [id])
    const count = Number(usersWithRole.rows[0]?.count || 0)
    if (count > 0) {
      return validationError(`Cannot delete role: ${count} user(s) are assigned to it. Reassign them first.`)
    }

    const result = await query("DELETE FROM admin_roles WHERE id = $1 RETURNING id", [id])
    if (result.rows.length === 0) return notFoundError("Role")

    return successResponse({ message: "Role deleted" })
  } catch (error) {
    console.error("[Admin Roles] DELETE Error:", error)
    return serverError("Failed to delete role")
  }
}

export const GET = withAdminAuth(handleGet)
export const POST = withAdminAuth(handlePost)
export const PUT = withAdminAuth(handlePut)
export const DELETE = withAdminAuth(handleDelete)
