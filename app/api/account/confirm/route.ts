import { query } from "@/lib/db"
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError, unauthorizedError } from "@/lib/api"
import { generateJWT, hashPassword, compareCode } from "@/lib/auth"
import {
  cleanupPendingActions,
  getPendingAccountAction,
  markAccountActionVerified,
  type AccountAction
} from "@/lib/account-actions"

async function handleConfirm(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const action = String(body.action || "").trim() as AccountAction
    const token = String(body.challengeToken || "").trim()
    const code = String(body.code || "")
      .trim()
      .toUpperCase()

    if (!["email_change", "password_change", "category_change", "delete_account"].includes(action)) {
      return validationError("Invalid action")
    }

    if (!token || !code) {
      return validationError("Challenge token and code are required")
    }

    const challenge = await getPendingAccountAction({ token, action, userId: req.user!.userId })
    if (!challenge || !(await compareCode(code, challenge.code))) {
      return unauthorizedError("Invalid or expired confirmation code")
    }

    const payload = (challenge.payload || {}) as Record<string, string | null>

    if (action === "email_change") {
      const newEmail = String(payload.newEmail || "")
        .trim()
        .toLowerCase()
      if (!newEmail) {
        return validationError("Missing new email")
      }

      const existing = await query("SELECT id FROM users WHERE email = $1 AND id <> $2", [
        newEmail,
        req.user!.userId
      ])
      if (existing.rows.length > 0) {
        return validationError("Diese E-Mail ist bereits registriert")
      }

      const updated = await query(
        `UPDATE users
         SET email = $1, email_verified = true, email_verified_at = NOW(), updated_at = NOW()
         WHERE id = $2
         RETURNING id, email, first_name, last_name, role, category_id, admin_role_id`,
        [newEmail, req.user!.userId]
      )

      await markAccountActionVerified(challenge.id)
      await cleanupPendingActions(req.user!.userId, action)

      const user = updated.rows[0]
      const tokenValue = generateJWT({
        userId: user.id,
        email: user.email,
        role: user.role,
        categoryId: user.category_id || undefined,
        adminRoleId: user.admin_role_id || undefined,
        twoFaVerified: true
      })

      const response = successResponse({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          categoryId: user.category_id || null,
          adminRoleId: user.admin_role_id || null
        },
        token: tokenValue,
        message: "Email updated"
      })
      response.cookies.set("token", tokenValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400,
        path: "/"
      })
      return response
    }

    if (action === "password_change") {
      const newPasswordHash = String(payload.newPasswordHash || "")
      if (!newPasswordHash) {
        return validationError("Missing password payload")
      }

      const updated = await query(
        `UPDATE users
         SET password_hash = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, email, first_name, last_name, role, category_id, admin_role_id, updated_at`,
        [newPasswordHash, req.user!.userId]
      )

      await markAccountActionVerified(challenge.id)
      await cleanupPendingActions(req.user!.userId, action)

      const user = updated.rows[0]
      const tokenValue = generateJWT({
        userId: user.id,
        email: user.email,
        role: user.role,
        categoryId: user.category_id || undefined,
        adminRoleId: user.admin_role_id || undefined,
        twoFaVerified: true,
        updatedAt: user.updated_at
      })

      const response = successResponse({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          categoryId: user.category_id || null,
          adminRoleId: user.admin_role_id || null
        },
        token: tokenValue,
        message: "Password updated"
      })
      response.cookies.set("token", tokenValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400,
        path: "/"
      })
      return response
    }

    if (action === "category_change") {
      const categoryId = String(payload.categoryId || "").trim()
      if (!categoryId) {
        return validationError("Missing category payload")
      }

      const registrationResult = await query("SELECT id FROM registrations WHERE user_id = $1", [
        req.user!.userId
      ])
      if (registrationResult.rows.length === 0) {
        return validationError("Keine bestehende Anmeldung gefunden")
      }

      await query("UPDATE registrations SET category_id = $1, updated_at = NOW() WHERE user_id = $2", [
        categoryId,
        req.user!.userId
      ])

      await query("UPDATE users SET category_id = $1, updated_at = NOW() WHERE id = $2", [
        categoryId,
        req.user!.userId
      ])

      await markAccountActionVerified(challenge.id)
      await cleanupPendingActions(req.user!.userId, action)

      const updatedUser = await query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.category_id, u.admin_role_id
         FROM users u
         WHERE u.id = $1`,
        [req.user!.userId]
      )

      const user = updatedUser.rows[0]
      const tokenValue = generateJWT({
        userId: user.id,
        email: user.email,
        role: user.role,
        categoryId: user.category_id || undefined,
        adminRoleId: user.admin_role_id || undefined,
        twoFaVerified: true
      })

      const response = successResponse({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          categoryId: user.category_id || null,
          adminRoleId: user.admin_role_id || null
        },
        token: tokenValue,
        message: "Category updated"
      })
      response.cookies.set("token", tokenValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400,
        path: "/"
      })
      return response
    }

    if (action === "delete_account") {
      const randomPassword = await hashPassword(`deleted-${req.user!.userId}-${Date.now()}`)

      await query("DELETE FROM registrations WHERE user_id = $1", [req.user!.userId])
      await query("DELETE FROM team_members WHERE user_id = $1", [req.user!.userId])
      await query("DELETE FROM profiles WHERE user_id = $1", [req.user!.userId])
      await query(
        "UPDATE newsletter_subscribers SET subscribed = false WHERE email = (SELECT email FROM users WHERE id = $1)",
        [req.user!.userId]
      )

      await query(
        `UPDATE users
         SET email = CONCAT('deleted+', id::text, '@deleted.local'),
             password_hash = $1,
             first_name = NULL,
             last_name = NULL,
             role = 'user',
             category_id = NULL,
             admin_role_id = NULL,
             is_active = false,
             email_verified = false,
             updated_at = NOW()
         WHERE id = $2`,
        [randomPassword, req.user!.userId]
      )

      await markAccountActionVerified(challenge.id)
      await cleanupPendingActions(req.user!.userId, action)

      const response = successResponse({ message: "Account deleted" })
      response.cookies.delete("token")
      return response
    }

    return validationError("Invalid action")
  } catch (error) {
    console.error("[Account Confirm] Error:", error)
    return serverError("Failed to confirm account action")
  }
}

export const POST = withAuth(handleConfirm)
