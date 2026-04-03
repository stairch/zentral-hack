import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "E-Mail ist erforderlich" },
        { status: 400 }
      )
    }

    await query(
      `INSERT INTO newsletter_subscribers (email, subscribed)
       VALUES ($1, true)
       ON CONFLICT (email) DO UPDATE SET subscribed = true`,
      [email]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return NextResponse.json(
      { error: "Serverfehler" },
      { status: 500 }
    )
  }
}
