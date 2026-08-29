import { query } from "@/lib/db"
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { comparePassword, generateJWT, hashPassword } from "@/lib/auth"
import { passwordSchema, getError } from "@/lib/validation"

/**
 * POST /api/account/password
 * Directly changes the password once the current password is verified – no
 * emailed confirmation code. A fresh JWT is issued so the current session stays
 * valid while any older tokens are invalidated (users.updated_at bump).
 */
async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const currentPassword = String(body.currentPassword || "")
    const newPassword = String(body.newPassword || "")
    const confirmPassword = String(body.confirmPassword || "")

    if (!currentPassword || !newPassword || !confirmPassword) {
      return validationError("Aktuelles Passwort, neues Passwort und Bestätigung sind erforderlich")
    }
    if (newPassword !== confirmPassword) {
      return validationError("Neue Passwörter stimmen nicht überein")
    }

    const passwordValidation = passwordSchema.safeParse(newPassword)
    if (!passwordValidation.success) {
      return validationError(getError(passwordValidation))
    }

    const userResult = await query(
      "SELECT id, email, password_hash, role, category_id, admin_role_id FROM users WHERE id = $1",
      [req.user!.userId]
    )
    const user = userResult.rows[0]
    if (!user) {
      return validationError("Benutzer nicht gefunden")
    }

    const validPassword = await comparePassword(currentPassword, user.password_hash)
    if (!validPassword) {
      return validationError("Aktuelles Passwort ist falsch")
    }

    const newPasswordHash = await hashPassword(passwordValidation.data)
    const updated = await query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, role, category_id, admin_role_id, updated_at`,
      [newPasswordHash, user.id]
    )

    const updatedUser = updated.rows[0]
    const tokenValue = generateJWT({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      categoryId: updatedUser.category_id || undefined,
      adminRoleId: updatedUser.admin_role_id || undefined,
      twoFaVerified: req.user!.twoFaVerified,
      updatedAt: updatedUser.updated_at
    })

    const response = successResponse({ message: "Passwort geändert" })
    response.cookies.set("token", tokenValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/"
    })
    return response
  } catch (error) {
    console.error("[Account Password] Error:", error)
    return serverError("Passwort konnte nicht geändert werden")
  }
}

export const POST = withAuth(handlePost)
