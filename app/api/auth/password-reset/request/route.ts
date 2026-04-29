import { NextRequest } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { successResponse, serverError } from "@/lib/api"
import { sendEmail } from "@/lib/email"
import { createAccountActionChallenge } from "@/lib/account-actions"

const emailSchema = z
  .string()
  .email()
  .transform((value) => value.toLowerCase())

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = emailSchema.safeParse(body.email)

    if (!parsed.success) {
      return successResponse({ message: "If the email exists, a reset code will be sent." })
    }

    const email = parsed.data
    const result = await query("SELECT id FROM users WHERE email = $1 AND is_active = true", [email])

    let challengeToken: string | null = null

    if (result.rows.length > 0) {
      const challenge = await createAccountActionChallenge({
        userId: result.rows[0].id,
        action: "password_reset",
        payload: {},
        expiresInMinutes: 15
      })

      challengeToken = challenge.token

      await sendEmail({
        to: email,
        subject: "Zentral Hack - Passwort zurücksetzen",
        html: `
          <h2>Passwort zurücksetzen</h2>
          <p>Du hast ein neues Passwort angefordert.</p>
          <h1 style="letter-spacing: 0.1em; font-size: 32px; margin: 24px 0; color: #530A5D;">${challenge.code}</h1>
          <p>Gib diesen Code zusammen mit deinem neuen Passwort auf der Reset-Seite ein.</p>
          <p style="color: #666; font-size: 12px;">Falls du das nicht warst, kannst du diese E-Mail ignorieren.</p>
        `,
        text: `Dein Passwort-Reset-Code lautet: ${challenge.code}`
      })
    }

    return successResponse({ message: "If the email exists, a reset code will be sent.", challengeToken })
  } catch (error) {
    console.error("[Password Reset Request] Error:", error)
    return serverError("Failed to create password reset challenge")
  }
}
