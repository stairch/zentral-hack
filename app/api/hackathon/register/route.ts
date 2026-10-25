import { query } from "@/lib/db"
import { sendRegisterConfirmationEmail } from "@/lib/transactional-emails"
import { successResponse, validationError, serverError } from "@/lib/api"
import { RegistrationSchema, validateRequest } from "@/lib/validation"
import { addSubscriber } from "@/lib/resend"
import { getCategoryRegistrationError } from "@/lib/category-db"
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware"
import { createRateLimiter } from "@/lib/rate-limit"

const rateLimiter = createRateLimiter("signup")

async function handlePost(request: AuthenticatedRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiter(request)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()

    // Validate input
    const validation = validateRequest(RegistrationSchema, body)
    if (!validation.success) {
      console.error("Registration validation errors:", validation.errors)
      return validationError(`Validierungsfehler: ${Object.values(validation.errors).join(", ")}`)
    }

    const {
      university,
      studyProgram,
      semester,
      allergies,
      dietaryRestrictions,
      categoryId,
      subscribeNewsletter
    } = validation.data

    // Identity, name and email come from the session user, never from the request body
    const userResult = await query(
      "SELECT id, email, first_name, last_name, role, email_verified FROM users WHERE id = $1",
      [request.user!.userId]
    )
    const user = userResult.rows[0]

    if (!user || !user.email_verified) {
      return validationError("Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse")
    }

    if (user.role !== "user") {
      return validationError("Nur Teilnehmende können sich für eine Kategorie anmelden")
    }

    const userId = user.id

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

    const categoryError = await getCategoryRegistrationError(categoryId)
    if (categoryError) {
      return validationError(categoryError)
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
    await sendRegisterConfirmationEmail(user.email, {
      given_name: user.first_name,
      family_name: user.last_name,
      category: categoryName,
      university: university || "—",
      study_program: studyProgram || "—",
      semester: semester || "—",
      allergies: allergies || "—",
      dietary_restrictions: dietaryRestrictions || "—"
    })

    // Subscribe to newsletter if requested (the address is verified via 2FA, so no separate opt-in mail)
    if (subscribeNewsletter) {
      try {
        await addSubscriber(user.email, { firstName: user.first_name, lastName: user.last_name })
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

export const POST = withAuth(handlePost)
