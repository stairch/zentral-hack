import { NextRequest, NextResponse } from "next/server"
import { consumeOptInToken } from "@/lib/newsletter-opt-in"
import { addSubscriber } from "@/lib/resend"

function redirectTo(request: NextRequest, status: "success" | "invalid" | "error") {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
  return NextResponse.redirect(`${baseUrl}/newsletter/confirmed?status=${status}`)
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token") ?? ""

  const email = await consumeOptInToken(token)
  if (!email) {
    return redirectTo(request, "invalid")
  }

  try {
    await addSubscriber(email)
  } catch (error) {
    console.error("Newsletter confirmation error:", error)
    return redirectTo(request, "error")
  }

  return redirectTo(request, "success")
}
