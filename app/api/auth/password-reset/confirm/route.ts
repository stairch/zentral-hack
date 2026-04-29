import { NextRequest } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { successResponse, validationError, serverError, unauthorizedError } from "@/lib/api"
import { hashPassword } from "@/lib/auth"
import {
  getPendingAccountAction,
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
    const token = String(body.challengeToken || "").trim()
    const code = String(body.code || "")
      .trim()
      .toUpperCase()
    const newPassword = String(body.newPassword || "")
    const confirmPassword = String(body.confirmPassword || "")

    if (!emailParsed.success || !token || !code || !newPassword || !confirmPassword) {
      return validationError("Email, challenge token, code and passwords are required")
    }

    if (newPassword !== confirmPassword) {
      return validationError("Neue Passwörter stimmen nicht überein")
    }

    const userResult = await query("SELECT id, email FROM users WHERE email = $1 AND is_active = true", [
      emailParsed.data
    ])
    if (userResult.rows.length === 0) {
      return unauthorizedError("Invalid reset request")
    }

    const challenge = await getPendingAccountAction({
      token,
      action: "password_reset",
      userId: userResult.rows[0].id
    })

    if (!challenge || challenge.code !== code) {
      return unauthorizedError("Invalid or expired reset code")
    }

    const newPasswordHash = await hashPassword(newPassword)
    await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
      newPasswordHash,
      userResult.rows[0].id
    ])

    await markAccountActionVerified(challenge.id)
    await cleanupPendingActions(userResult.rows[0].id)

    return successResponse({ message: "Password updated" })
  } catch (error) {
    console.error("[Password Reset Confirm] Error:", error)
    return serverError("Failed to reset password")
  }
}
