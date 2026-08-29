import { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { successResponse, validationError, serverError } from "@/lib/api"
import { SignupSchema, validateRequest } from "@/lib/validation"
import { createRateLimiter } from "@/lib/rate-limit"
import { generateVerificationCode, hashCode } from "@/lib/auth"
import { send2FACodeEmail } from "@/lib/email"

const rateLimiter = createRateLimiter("signup")

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiter(request)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()

    // Validate input
    const validation = validateRequest(SignupSchema, body)
    if (!validation.success) {
      console.error("Signup validation errors:", validation.errors)
      return validationError(`Validierungsfehler: ${Object.values(validation.errors).join(", ")}`)
    }

    const { email, password, firstName, lastName } = validation.data

    const hash = await hashPassword(password)

    // Check if email already exists
    const existing = await query("SELECT id, email_verified FROM users WHERE email = $1", [
      email.toLowerCase()
    ])

    let user: { id: string; email: string; role: string }

    if (existing.rows.length > 0) {
      // A verified account already owns this email
      if (existing.rows[0].email_verified) {
        return validationError("Diese Email ist bereits registriert")
      }

      // Otherwise unverified account (e.g. previous signup was abandoned)
      // Nobody proved ownership of this address, so we let the new signup through
      const updated = await query(
        `UPDATE users
         SET password_hash = $1, first_name = $2, last_name = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING id, email, role`,
        [hash, firstName, lastName, existing.rows[0].id]
      )
      user = updated.rows[0]

      // Make sure a profile row exists and drop any stale unverified 2FA codes.
      await query("INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [user.id])
      await query("DELETE FROM two_fa_tokens WHERE user_id = $1 AND verified = false", [user.id])
    } else {
      const result = await query(
        "INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, role",
        [email.toLowerCase(), hash, firstName, lastName]
      )
      user = result.rows[0]
      await query("INSERT INTO profiles (user_id) VALUES ($1)", [user.id])
    }

    // Generate 2FA code for ALL users
    const code = generateVerificationCode()
    const codeHash = await hashCode(code)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Save hashed 2FA code to database
    await query("INSERT INTO two_fa_tokens (user_id, code, expires_at) VALUES ($1, $2, $3)", [
      user.id,
      codeHash,
      expiresAt.toISOString()
    ])

    // Send 2FA code via email
    try {
      await send2FACodeEmail(email, code)
    } catch (emailError) {
      console.error("Failed to send 2FA email:", emailError)
      return serverError("Failed to send 2FA code")
    }

    // Return temporary auth response indicating verification is required
    const response = successResponse({
      user: { id: user.id, email: user.email, role: user.role },
      requiresTwoFa: true,
      message: "2FA code sent to email"
    })

    return response
  } catch (error) {
    console.error("Signup error:", error)
    return serverError("Fehler bei der Anmeldung. Bitte versuchen Sie es später erneut.")
  }
}
