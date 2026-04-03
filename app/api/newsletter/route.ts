import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, firstName, lastName, source } = body

    if (!email) {
      return NextResponse.json(
        { error: "E-Mail ist erforderlich" },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .upsert({
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        source: source || "website",
        is_active: true,
        subscribed_at: new Date().toISOString(),
      }, { onConflict: "email" })

    if (error) {
      console.error("Newsletter subscription error:", error)
      return NextResponse.json(
        { error: "Anmeldung fehlgeschlagen" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      { error: "Serverfehler" },
      { status: 500 }
    )
  }
}
