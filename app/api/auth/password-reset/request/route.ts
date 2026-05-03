import { NextRequest } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { successResponse, serverError } from "@/lib/api"
import { sendEmail } from "@/lib/email"
import { createAccountActionChallenge } from "@/lib/account-actions"
import { renderAuthCodeEmail } from "@/lib/email-templates"
import { createRateLimiter } from "@/lib/rate-limit"

const emailSchema = z
  .string()
  .email()
  .transform((value) => value.toLowerCase())

const rateLimiter = createRateLimiter("auth")

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimiter(request)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const parsed = emailSchema.safeParse(body.email)

    const genericResponse = successResponse({
      message: "If the email exists, a reset code will be sent."
    })

    if (!parsed.success) {
      return genericResponse
    }

    const email = parsed.data
    const result = await query("SELECT id FROM users WHERE email = $1 AND is_active = true", [email])

    if (result.rows.length > 0) {
      try {
        const challenge = await createAccountActionChallenge({
          userId: result.rows[0].id,
          action: "password_reset",
          payload: {},
          expiresInMinutes: 15
        })

        await sendEmail({
          to: email,
          subject: "Zentral Hack – Passwort zurücksetzen",
          html: renderAuthCodeEmail({
            label: "Sicherheit",
            headline: "Passwort zurücksetzen",
            intro:
              "Du hast ein neues Passwort angefordert. Gib diesen Code zusammen mit deinem neuen Passwort auf der Reset-Seite ein.",
            code: challenge.code,
            footerNote:
              "Falls du das nicht warst, kannst du diese E-Mail ignorieren. Der Code ist 15 Minuten gültig.",
            englishHeadline: "Reset your password",
            englishIntro:
              "You requested a new password. Enter this code along with your new password on the reset page.",
            englishFooterNote:
              "If you didn't request this, you can safely ignore this email. The code is valid for 15 minutes."
          }),
          text: `Dein Passwort-Reset-Code lautet: ${challenge.code}\n\nFalls du das nicht warst, kannst du diese E-Mail ignorieren.`
        })
      } catch (emailError) {
        console.error("[Password Reset Request] Email send error:", emailError)
      }
    }

    return genericResponse
  } catch (error) {
    console.error("[Password Reset Request] Error:", error)
    return serverError("Failed to create password reset challenge")
  }
}
