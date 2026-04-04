import { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { successResponse, validationError, serverError } from "@/lib/api"
import { RegistrationSchema, validateRequest } from "@/lib/validation"
import { escapeHtml } from "@/lib/email-templates"
import { getNewsletterColumnSupport } from "@/lib/newsletter-db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = validateRequest(RegistrationSchema, body)
    if (!validation.success) {
      console.error("Registration validation errors:", validation.errors)
      return validationError(`Validierungsfehler: ${Object.values(validation.errors).join(", ")}`)
    }

    const {
      email,
      firstName,
      lastName,
      university,
      studyProgram,
      semester,
      allergies,
      dietaryRestrictions,
      categoryId,
      subscribeNewsletter
    } = validation.data

    const userResult = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()])

    if (userResult.rows.length === 0) {
      return validationError("Benutzer nicht gefunden. Bitte melden Sie sich zuerst an.")
    }

    const userId = userResult.rows[0].id

    // Update profile with university details (allergies/dietary go into registrations table)
    await query(
      `UPDATE profiles 
       SET university = $1, study_program = $2, semester = $3
       WHERE user_id = $4`,
      [university || null, studyProgram || null, semester || null, userId]
    )

    const existing = await query("SELECT id FROM registrations WHERE user_id = $1 AND category_id = $2", [
      userId,
      categoryId
    ])

    if (existing.rows.length > 0) {
      return validationError("Sie sind bereits für diese Kategorie registriert")
    }

    const result = await query(
      `INSERT INTO registrations (user_id, category_id, allergies, dietary_restrictions, status, confirmation_sent)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id`,
      [userId, categoryId, allergies || null, dietaryRestrictions || null, "confirmed"]
    )

    // Get category name for email
    const catResult = await query("SELECT name FROM categories WHERE id = $1", [categoryId])
    const categoryName = catResult.rows[0]?.name || "Hackathon"

    // Send confirmation email
    const confirmationHtml = `
      <h2>Willkommen zum Zentral Hack 2026!</h2>
      <p>Hallo ${escapeHtml(firstName)} ${escapeHtml(lastName)},</p>
      
      <p>Danke dass du dich registriert hast!</p>
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-left: 4px solid #530A5D;">
        <h3>Deine Registrierungsdaten:</h3>
        <p><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</p>
        <p><strong>Kategorie:</strong> ${escapeHtml(categoryName)}</p>
        ${university ? `<p><strong>Universität:</strong> ${escapeHtml(university)}</p>` : ""}
        ${studyProgram ? `<p><strong>Studiengang:</strong> ${escapeHtml(studyProgram)}</p>` : ""}
        ${semester ? `<p><strong>Semester:</strong> ${escapeHtml(String(semester))}</p>` : ""}
        ${allergies ? `<p><strong>Allergien:</strong> ${escapeHtml(allergies)}</p>` : ""}
        ${dietaryRestrictions ? `<p><strong>Diätetische Einschränkungen:</strong> ${escapeHtml(dietaryRestrictions)}</p>` : ""}
      </div>
      
      <p>Du kannst jetzt auf dein Dashboard zugreifen: <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Dashboard</a></p>
      
      <p style="color: #666; font-size: 12px;">Falls du Fragen hast, antworte einfach auf diese E-Mail.</p>
    `

    await sendEmail({
      to: email,
      subject: `Bestätigung: Registrierung für ${escapeHtml(categoryName)}`,
      html: confirmationHtml,
      text: `Willkommen zum Zentral Hack 2026! Du hast dich für die Kategorie "${categoryName}" registriert.`
    })

    // Subscribe to newsletter if requested
    if (subscribeNewsletter) {
      try {
        const columnSupport = await getNewsletterColumnSupport()
        if (columnSupport.weeklyUpdatesSubscribed && columnSupport.updatedAt) {
          await query(
            `INSERT INTO newsletter_subscribers (email, subscribed, weekly_updates_subscribed)
             VALUES ($1, true, true)
             ON CONFLICT (email) DO UPDATE
             SET subscribed = true,
                 weekly_updates_subscribed = true,
                 updated_at = NOW()`,
            [email.toLowerCase()]
          )
        } else {
          await query(
            `INSERT INTO newsletter_subscribers (email, subscribed)
             VALUES ($1, true)
             ON CONFLICT (email) DO UPDATE SET subscribed = true`,
            [email.toLowerCase()]
          )
        }
      } catch (error) {
        console.error("Newsletter subscription failed:", error)
      }
    }

    return successResponse(
      {
        registrationId: result.rows[0].id,
        message: "Registrierung abgeschlossen. Bestätigungsemail versendet."
      },
      201
    )
  } catch (error) {
    console.error("Registration error:", error)
    return serverError("Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.")
  }
}
