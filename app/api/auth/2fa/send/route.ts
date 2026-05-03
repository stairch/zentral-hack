import { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { generateTwoFAToken, generateVerificationCode, hashCode } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { successResponse, validationError, serverError, unauthorizedError } from "@/lib/api"
import { renderAuthCodeEmail } from "@/lib/email-templates"

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
    const codeHash = await hashCode(code)
    const token = generateTwoFAToken()
    const expiresAt = new Date(Date.now() + 15 * 60000)

    await query("INSERT INTO two_fa_tokens (user_id, token, code, expires_at) VALUES ($1, $2, $3, $4)", [
      userId,
      token,
      codeHash,
      expiresAt
    ])

    await sendEmail({
      to: email,
      subject: "Zentral Hack – Admin Authentifizierung",
      html: renderAuthCodeEmail({
        label: "Sicherheit",
        headline: "Admin Authentifizierung",
        intro: "Gib diesen Code ein, um deine Identität zu bestätigen.",
        code,
        footerNote: "Der Code ist 15 Minuten gültig. Falls du das nicht warst, ignoriere diese E-Mail.",
        englishHeadline: "Admin Authentication",
        englishIntro: "Enter this code to confirm your identity.",
        englishFooterNote: "The code is valid for 15 minutes. If you didn't request this, ignore this email."
      }),
      text: `Dein Admin-Bestätigungscode: ${code}\n\nDer Code ist 15 Minuten gültig.`
    })

    return successResponse({ token, message: "2FA code sent" })
  } catch (error) {
    console.error(error)
    return serverError()
  }
}
