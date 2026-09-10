import { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { successResponse, serverError } from "@/lib/api"
import { sendPasswordReset2FACodeEmail } from "@/lib/transactional-emails"
import { createAccountActionChallenge } from "@/lib/account-actions"
import { createRateLimiter } from "@/lib/rate-limit"
import { emailSchema } from "@/lib/validation"

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

        await sendPasswordReset2FACodeEmail(email, challenge.code)
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
