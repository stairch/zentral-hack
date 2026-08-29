import { z } from "zod"
import { query } from "@/lib/db"
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { sendEmail } from "@/lib/email"
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

    await sendEmail({
      to: newEmail,
      subject: "Zentral Hack - E-Mail-Änderung bestätigen",
      html: `
        <h2>Bitte bestätige deine neue E-Mail-Adresse</h2>
        <p>Du hast eine Änderung auf <strong>${newEmail}</strong> angefordert.</p>
        <p>Verwende den Bestätigungscode, um die neue Adresse zu aktivieren.</p>
        <p style="color: #666; font-size: 12px;">Falls du das nicht warst, kannst du diese E-Mail ignorieren.</p>
        <h1 style="letter-spacing: 0.1em; font-size: 32px; margin: 24px 0; color: #530A5D;">${challenge.code}</h1>
        <p>Dieser Code verfällt in 15 Minuten.</p>
      `,
      text: `Dein Bestätigungscode lautet: ${challenge.code}`
    })

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
