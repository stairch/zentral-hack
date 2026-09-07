import { NextResponse } from "next/server"
import { addSubscriber } from "@/lib/resend"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "E-Mail required" }, { status: 400 })
    }

    await addSubscriber(email)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 })
  }
}
