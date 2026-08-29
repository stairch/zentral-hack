import { query } from "@/lib/db"
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError, unauthorizedError } from "@/lib/api"
import { generateJWT, compareCode } from "@/lib/auth"
import {
  cleanupPendingActions,
  getPendingAccountActionByUser,
  markAccountActionVerified
} from "@/lib/account-actions"
import { createRateLimiter } from "@/lib/rate-limit"

const rateLimiter = createRateLimiter("twofa")

/**
 * POST /api/account/email/confirm
 * Confirms an email change with the code sent to the new address.
 */
async function handleConfirm(req: AuthenticatedRequest) {
  try {
    const rateLimitResponse = await rateLimiter(req)
    if (rateLimitResponse) return rateLimitResponse

    const body = await req.json()
    const code = String(body.code || "")
      .trim()
      .toUpperCase()

    if (!code) {
      return validationError("Code is required")
    }

    const challenge = await getPendingAccountActionByUser({
      userId: req.user!.userId,
      action: "email_change"
    })

    if (!challenge || !(await compareCode(code, challenge.code))) {
      return unauthorizedError("Invalid or expired confirmation code")
    }

    const payload = (challenge.payload || {}) as Record<string, string | null>
    const newEmail = String(payload.newEmail || "")
      .trim()
      .toLowerCase()
    if (!newEmail) return validationError("Missing new email")

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
    await cleanupPendingActions(req.user!.userId, "email_change")

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
  } catch (error) {
    console.error("[Email Change Confirm] Error:", error)
    return serverError("Failed to confirm account action")
  }
}

export const POST = withAuth(handleConfirm)
