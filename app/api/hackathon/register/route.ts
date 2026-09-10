import { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { sendRegisterConfirmationEmail } from "@/lib/email"
import { successResponse, validationError, serverError } from "@/lib/api"
import { RegistrationSchema, validateRequest } from "@/lib/validation"
import { addSubscriber } from "@/lib/resend"

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
    await sendRegisterConfirmationEmail(email, {
      given_name: firstName,
      family_name: lastName,
      category: categoryName,
      university: university || "—",
      study_program: studyProgram || "—",
      semester: semester || "—",
      allergies: allergies || "—",
      dietary_restrictions: dietaryRestrictions || "—"
    })

    // Subscribe to newsletter if requested
    if (subscribeNewsletter) {
      try {
        await addSubscriber(email)
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
