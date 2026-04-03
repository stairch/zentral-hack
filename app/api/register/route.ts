import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Use service role key for bypassing RLS in server-side API routes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      userId,
      firstName,
      lastName,
      email,
      categoryId,
      university,
      studyProgram,
      semester,
      linkedinUrl,
      dietaryRestrictions,
      allergies,
      foodIntolerances,
      wantsEmails,
    } = body

    // Generate confirmation token
    const confirmationToken = crypto.randomUUID()

    // Insert registration using service role client (bypasses RLS)
    const { error: registrationError } = await supabaseAdmin
      .from("registrations")
      .insert({
        user_id: userId || null,
        category_id: categoryId || null,
        first_name: firstName,
        last_name: lastName,
        email,
        university: university || null,
        study_program: studyProgram || null,
        semester: semester ? parseInt(semester) : null,
        linkedin_url: linkedinUrl || null,
        dietary_restrictions: dietaryRestrictions || null,
        allergies: allergies || null,
        food_intolerances: foodIntolerances || null,
        wants_emails: wantsEmails ?? true,
        confirmation_token: confirmationToken,
      })

    if (registrationError) {
      console.error("Registration error:", registrationError)
      return NextResponse.json(
        { error: "Registrierung fehlgeschlagen" },
        { status: 500 }
      )
    }

    // Send confirmation email if Resend is configured
    if (resend && process.env.RESEND_FROM_EMAIL) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: email,
          subject: "Willkommen bei Zentral Hack 2026!",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
                  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
                  .header { background: #530A5D; padding: 40px; text-align: center; }
                  .header h1 { color: #E6FF17; margin: 0; font-size: 28px; }
                  .content { padding: 40px; }
                  .content h2 { color: #530A5D; }
                  .button { display: inline-block; background: #E6FF17; color: #530A5D; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
                  .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>ZENTRAL HACK 2026</h1>
                  </div>
                  <div class="content">
                    <h2>Hallo ${firstName}!</h2>
                    <p>Vielen Dank für deine Anmeldung zum Zentral Hack 2026!</p>
                    <p>Wir freuen uns, dich am <strong>23.-24. Oktober 2026</strong> an der HSLU begrüssen zu dürfen.</p>
                    <p>In den kommenden Wochen erhältst du weitere Informationen zu deiner Challenge und wichtige Updates.</p>
                    <p>Bei Fragen erreichst du uns unter <a href="mailto:info@zentralhack.ch">info@zentralhack.ch</a></p>
                    <p>Bis bald!</p>
                    <p><strong>Das Zentral Hack Team</strong></p>
                  </div>
                  <div class="footer">
                    <p>Zentral Hack 2026 | HSLU Luzern</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        })
      } catch (emailError) {
        console.error("Email error:", emailError)
        // Don't fail the registration if email fails
      }
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
