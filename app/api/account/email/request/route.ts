import { z } from "zod"
import { query } from "@/lib/db"
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { sendNewEmail2FACodeEmail } from "@/lib/transactional-emails"
import { createAccountActionChallenge } from "@/lib/account-actions"

const emailSchema = z
  .string()
  .email()
  .transform((value) => value.toLowerCase())

/**
 * POST /api/account/email/request
 * Starts the email-change flow by sending a confirmation code to the new address.
 */
async function handleRequest(req: AuthenticatedRequest) {
  try {
    const body = await req.json()

    const userResult = await query("SELECT id, email FROM users WHERE id = $1", [req.user!.userId])
    const user = userResult.rows[0]
    if (!user) {
      return validationError("User not found")
    }

    const parsed = emailSchema.safeParse(body.newEmail)
    if (!parsed.success) {
      return validationError("Ungültige neue E-Mail-Adresse")
    }

    const newEmail = parsed.data
    if (newEmail === user.email.toLowerCase()) {
      return validationError("Neue E-Mail muss sich von der aktuellen unterscheiden")
    }

    const existing = await query("SELECT id FROM users WHERE email = $1 AND id <> $2", [newEmail, user.id])
    if (existing.rows.length > 0) {
      return validationError("Diese E-Mail ist bereits registriert")
    }

    const challenge = await createAccountActionChallenge({
      userId: user.id,
      action: "email_change",
      payload: { newEmail },
      expiresInMinutes: 15
    })

    await sendNewEmail2FACodeEmail(newEmail, challenge.code)

    return successResponse({
      destinationEmail: newEmail,
      message: "Confirmation code sent"
    })
  } catch (error) {
    console.error("[Email Change Request] Error:", error)
    return serverError("Failed to create confirmation challenge")
  }
}

export const POST = withAuth(handleRequest)
