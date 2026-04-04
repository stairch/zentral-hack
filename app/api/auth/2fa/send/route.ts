import { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { generateTwoFAToken, generateVerificationCode } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { successResponse, validationError, serverError, unauthorizedError } from "@/lib/api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return validationError("Email required")
    }

    const result = await query("SELECT id FROM users WHERE email = $1 AND role = $2", [
      email.toLowerCase(),
      "admin"
    ])

    if (result.rows.length === 0) {
      return unauthorizedError()
    }

    const userId = result.rows[0].id
    const code = generateVerificationCode()
    const token = generateTwoFAToken()
    const expiresAt = new Date(Date.now() + 15 * 60000)

    await query("INSERT INTO two_fa_tokens (user_id, token, code, expires_at) VALUES ($1, $2, $3, $4)", [
      userId,
      token,
      code,
      expiresAt
    ])

    const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/2fa/verify?token=${token}`
    await sendEmail({
      to: email,
      subject: "Admin Zugang - Bestätige deine Identität",
      html: `
        <h2>Admin Authentifizierung erforderlich</h2>
        <p>Dein Bestätigungscode:</p>
        <h1 style="letter-spacing: 0.1em; font-size: 32px;">${code}</h1>
        <p><a href="${verifyLink}" style="display: inline-block; padding: 10px 20px; background: #530A5D; color: white; text-decoration: none; border-radius: 5px;">Bestätigen</a></p>
        <p style="color: #666; font-size: 12px;">Code verfällt in 15 Minuten.</p>
      `
    })

    return successResponse({ token, message: "2FA code sent" })
  } catch (error) {
    console.error(error)
    return serverError()
  }
}
