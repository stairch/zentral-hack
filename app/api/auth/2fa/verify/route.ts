import { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { generateJWT, JWTPayload } from "@/lib/auth"
import { successResponse, validationError, serverError, unauthorizedError } from "@/lib/api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return validationError("Email and code required")
    }

    // Find user by email
    const userResult = await query("SELECT id, role, category_id FROM users WHERE email = $1", [email.toLowerCase()])

    if (userResult.rows.length === 0) {
      return unauthorizedError()
    }

    const user = userResult.rows[0]

    // Find valid 2FA token with matching code
    const result = await query(
      "SELECT id, user_id, code, verified, expires_at FROM two_fa_tokens WHERE user_id = $1 AND code = $2 AND expires_at > NOW() AND verified = false ORDER BY created_at DESC LIMIT 1",
      [user.id, code]
    )

    if (result.rows.length === 0) {
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
      twoFaVerified: true
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

    console.log("[2FA] Token set in cookie for user:", email)

    return response
  } catch (error) {
    console.error("2FA verification error:", error)
    return serverError()
  }
}
