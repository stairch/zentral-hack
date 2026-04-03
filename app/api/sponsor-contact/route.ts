import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { companyName, contactName, email, phone, message, interestLevel } = body

    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { error: "Firmenname, Kontaktname und E-Mail sind erforderlich" },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from("sponsor_contacts")
      .insert({
        company_name: companyName,
        contact_name: contactName,
        email,
        phone: phone || null,
        message: message || null,
        interest_level: interestLevel || "other",
        status: "new",
      })

    if (error) {
      console.error("Sponsor contact error:", error)
      return NextResponse.json(
        { error: "Anfrage fehlgeschlagen" },
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
