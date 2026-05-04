import { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { generateJWT, compareCode, JWTPayload } from "@/lib/auth"
import { successResponse, validationError, serverError, unauthorizedError } from "@/lib/api"
import { createRateLimiter } from "@/lib/rate-limit"

const rateLimiter = createRateLimiter("twofa")

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiter(request)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return validationError("Email and code required")
    }

    // Find user by email
    const userResult = await query("SELECT id, role, category_id FROM users WHERE email = $1", [
      email.toLowerCase()
    ])

    if (userResult.rows.length === 0) {
      return unauthorizedError()
    }

    const user = userResult.rows[0]

    // Fetch the latest unverified, non-expired token for this user
    const result = await query(
      "SELECT id, user_id, code, verified, expires_at FROM two_fa_tokens WHERE user_id = $1 AND expires_at > NOW() AND verified = false ORDER BY created_at DESC LIMIT 1",
      [user.id]
    )

    if (result.rows.length === 0) {
      return unauthorizedError("Invalid or expired 2FA code")
    }

    const codeMatches = await compareCode(code, result.rows[0].code)
    if (!codeMatches) {
      return unauthorizedError("Invalid or expired 2FA code")
    }

    const twoFa = result.rows[0]

    // Mark 2FA token as verified
    await query("UPDATE two_fa_tokens SET verified = true WHERE id = $1", [twoFa.id])

    // Mark user's email verified
    await query("UPDATE users SET email_verified = true, email_verified_at = $1 WHERE id = $2", [
      new Date(),
      user.id
    ])

    // Generate JWT with 2FA verified flag
    const payload: JWTPayload = {
      userId: user.id,
      email,
      role: user.role,
      categoryId: user.category_id || undefined,
      twoFaVerified: true,
      updatedAt: new Date().toISOString()
    }

    const authToken = generateJWT(payload)

    const response = successResponse({
      token: authToken,
      user: {
        id: user.id,
        email,
        role: user.role,
        categoryId: user.category_id || null
      },
      message: "2FA verified successfully"
    })

    response.cookies.set("token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/"
    })

    return response
  } catch (error) {
    console.error("2FA verification error:", error)
    return serverError()
  }
}
