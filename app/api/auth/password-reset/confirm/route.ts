import { NextRequest } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { successResponse, validationError, serverError, unauthorizedError } from "@/lib/api"
import { hashPassword, compareCode } from "@/lib/auth"
import {
  getPendingAccountActionByUser,
  markAccountActionVerified,
  cleanupPendingActions
} from "@/lib/account-actions"

const emailSchema = z
  .string()
  .email()
  .transform((value) => value.toLowerCase())

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const emailParsed = emailSchema.safeParse(body.email)
    const code = String(body.code || "")
      .trim()
      .toUpperCase()
    const newPassword = String(body.newPassword || "")
    const confirmPassword = String(body.confirmPassword || "")

    if (!emailParsed.success || !code || !newPassword || !confirmPassword) {
      return validationError("Email, code and passwords are required")
    }

    if (newPassword !== confirmPassword) {
      return validationError("Neue Passwörter stimmen nicht überein")
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

    const newPasswordHash = await hashPassword(newPassword)

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
