import { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { successResponse, validationError, serverError, unauthorizedError } from "@/lib/api"
import { hashPassword, compareCode } from "@/lib/auth"
import {
  getPendingAccountActionByUser,
  markAccountActionVerified,
  cleanupPendingActions
} from "@/lib/account-actions"
import { createRateLimiter } from "@/lib/rate-limit"
import { emailSchema, passwordSchema, getError } from "@/lib/validation"

const rateLimiter = createRateLimiter("twofa")

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiter(request)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()

    const rawEmail = body.email
    if (!rawEmail) {
      return validationError("Email is required")
    }
    const rawCode = body.code
    const rawNewPassword = body.newPassword
    const rawConfirmPassword = body.confirmPassword
    if (!rawCode || !rawNewPassword || !rawConfirmPassword) {
      return validationError("Code and passwords are required")
    }

    const emailParsed = emailSchema.safeParse(body.email)
    if (!emailParsed.success) {
      return validationError(getError(emailParsed))
    }

    const code = String(body.code || "")
      .trim()
      .toUpperCase()
    const newPasswordValidation = passwordSchema.safeParse(body.newPassword)
    if (!newPasswordValidation.success) {
      return validationError(getError(newPasswordValidation))
    }

    const confirmPassword = String(body.confirmPassword || "")
    const newPasswordParsed = newPasswordValidation.data
    if (newPasswordParsed !== confirmPassword) {
      return validationError("Passwords not matching")
    }

    const userResult = await query("SELECT id FROM users WHERE email = $1 AND is_active = true", [
      emailParsed.data
    ])

    if (userResult.rows.length === 0) {
      return unauthorizedError("Invalid reset request")
    }

    const userId = userResult.rows[0].id

    const challenge = await getPendingAccountActionByUser({
      userId,
      action: "password_reset"
    })

    if (!challenge) {
      return unauthorizedError("Invalid or expired reset code")
    }

    const codeMatches = await compareCode(code, challenge.code)
    if (!codeMatches) {
      return unauthorizedError("Invalid or expired reset code")
    }

    const newPasswordHash = await hashPassword(newPasswordParsed)

    await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
      newPasswordHash,
      userId
    ])

    await markAccountActionVerified(challenge.id)
    await cleanupPendingActions(userId)

    return successResponse({ message: "Password updated" })
  } catch (error) {
    console.error("[Password Reset Confirm] Error:", error)
    return serverError("Failed to reset password")
  }
}
