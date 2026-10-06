import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { emailSchema } from "@/lib/validation"
import { createRateLimiter } from "@/lib/rate-limit"
import { createOptInToken } from "@/lib/newsletter-opt-in"
import { sendNewsletterOptInEmail } from "@/lib/transactional-emails"

const nameSchema = z.string().trim().min(1).max(50)

const rateLimit = createRateLimiter("newsletter")

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request)
  if (limited) return limited

  try {
    const body = await request.json()
    const parsed = emailSchema.safeParse(body?.email)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid e-mail address" }, { status: 400 })
    }
    const email = parsed.data
    const firstName = nameSchema.safeParse(body?.firstName)
    const lastName = nameSchema.safeParse(body?.lastName)
    const { token } = await createOptInToken(email, {
      firstName: firstName.success ? firstName.data : null,
      lastName: lastName.success ? lastName.data : null
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zentralhack.ch"
    const confirmUrl = `${baseUrl}/api/newsletter/confirm?token=${encodeURIComponent(token)}`

    await sendNewsletterOptInEmail(email, confirmUrl)

    // Always respond generically so the endpoint does not reveal whether an
    // address is already subscribed.
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 })
  }
}
