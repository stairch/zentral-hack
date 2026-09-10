import { NextRequest } from "next/server"
import { query } from "@/lib/db"
import {
  comparePassword,
  generateVerificationCode,
  hashCode,
  generateJWT,
  isTwoFaBypassEnabled,
  JWTPayload
} from "@/lib/auth"
import { successResponse, validationError, serverError, unauthorizedError } from "@/lib/api"
import { LoginSchema, validateRequest } from "@/lib/validation"
import { createRateLimiter } from "@/lib/rate-limit"
import { sendGeneral2FACodeEmail } from "@/lib/transactional-emails"

const rateLimiter = createRateLimiter("auth")

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiter(request)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()

    // Validate input
    const validation = validateRequest(LoginSchema, body)
    if (!validation.success) {
      return validationError("Validation failed", validation.errors)
    }

    const { email, password } = validation.data

    const result = await query(
      "SELECT id, email, password_hash, role, category_id, is_active, email_verified FROM users WHERE email = $1",
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return unauthorizedError()
    }

    const user = result.rows[0]

    if (!user.email_verified) {
      return unauthorizedError()
    }

    if (!user.is_active) {
      return unauthorizedError()
    }

    const validPassword = await comparePassword(password, user.password_hash)
    if (!validPassword) {
      return unauthorizedError()
    }

    // Development-only: skip the whole 2FA challenge and log the user in directly.
    if (isTwoFaBypassEnabled()) {
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        categoryId: user.category_id || undefined,
        twoFaVerified: true,
        updatedAt: new Date().toISOString()
      }
      const authToken = generateJWT(payload)

      const bypassResponse = successResponse({
        token: authToken,
        user: { id: user.id, email: user.email, role: user.role, categoryId: user.category_id || null },
        message: "2FA bypassed (development)"
      })
      bypassResponse.cookies.set("token", authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400,
        path: "/"
      })
      return bypassResponse
    }

    // Generate 2FA code for ALL users
    const code = generateVerificationCode()
    const codeHash = await hashCode(code)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await query("DELETE FROM two_fa_tokens WHERE user_id = $1 AND verified = false", [user.id])

    // Save hashed 2FA code to database
    await query("INSERT INTO two_fa_tokens (user_id, code, expires_at) VALUES ($1, $2, $3)", [
      user.id,
      codeHash,
      expiresAt
    ])

    // Send 2FA code via email
    try {
      await sendGeneral2FACodeEmail(user.email, code)
    } catch (emailError) {
      console.error("Failed to send 2FA email:", emailError)
      return serverError("Failed to send 2FA code")
    }

    // Return temporary auth response indicating 2FA is required
    const response = successResponse({
      user: { id: user.id, email: user.email, role: user.role },
      requiresTwoFa: true,
      message: "2FA code sent to email"
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return serverError()
  }
}
