import { z } from "zod"
import { query } from "@/lib/db"
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { getError } from "@/lib/validation"

const profileSchema = z
  .object({
    university: z.string().trim().max(100).nullable(),
    studyProgram: z.string().trim().max(100).nullable(),
    semester: z.coerce.number().int().min(1, "Ungültiges Semester").max(30, "Ungültiges Semester").nullable(),
    allergies: z.string().trim().max(500).nullable(),
    dietaryRestrictions: z.string().trim().max(500).nullable(),
    categoryId: z.string().uuid("Ungültige Kategorie")
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "Keine Änderungen übermittelt" })

/**
 * PATCH /api/account/profile
 * Directly updates non-credential profile data: study details (profiles table),
 * allergies / dietary restrictions and the registered category (registrations +
 * users). No email confirmation – none of these affect authentication.
 * users.updated_at is left untouched so an edit doesn't invalidate the session.
 */
async function handlePatch(req: AuthenticatedRequest) {
  try {
    const parsed = profileSchema.safeParse(await req.json())
    if (!parsed.success) {
      return validationError(getError(parsed))
    }

    const { university, studyProgram, semester, allergies, dietaryRestrictions, categoryId } = parsed.data
    const userId = req.user!.userId

    // --- profiles table (study details) ---
    const profileAssignments: string[] = []
    const profileValues: (string | number | null)[] = []
    const addProfile = (column: string, value: string | number | null) => {
      profileValues.push(value)
      profileAssignments.push(`${column} = $${profileValues.length}`)
    }
    if (university !== undefined) addProfile("university", university || null)
    if (studyProgram !== undefined) addProfile("study_program", studyProgram || null)
    if (semester !== undefined) addProfile("semester", semester)

    if (profileAssignments.length > 0) {
      await query("INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [userId])
      profileValues.push(userId)
      await query(
        `UPDATE profiles SET ${profileAssignments.join(", ")}, updated_at = NOW() WHERE user_id = $${profileValues.length}`,
        profileValues
      )
    }

    // --- registrations table (allergies, dietary restrictions, category) ---
    const needsRegistration =
      allergies !== undefined || dietaryRestrictions !== undefined || categoryId !== undefined

    if (needsRegistration) {
      const registration = await query("SELECT id FROM registrations WHERE user_id = $1", [userId])
      if (registration.rows.length === 0) {
        return validationError("Keine aktive Anmeldung vorhanden")
      }

      if (categoryId !== undefined) {
        const category = await query("SELECT id FROM categories WHERE id = $1", [categoryId])
        if (category.rows.length === 0) {
          return validationError("Kategorie nicht gefunden")
        }
      }

      const regAssignments: string[] = []
      const regValues: (string | null)[] = []
      const addReg = (column: string, value: string | null) => {
        regValues.push(value)
        regAssignments.push(`${column} = $${regValues.length}`)
      }
      if (allergies !== undefined) addReg("allergies", allergies || null)
      if (dietaryRestrictions !== undefined) addReg("dietary_restrictions", dietaryRestrictions || null)
      if (categoryId !== undefined) addReg("category_id", categoryId)

      regValues.push(userId)
      await query(
        `UPDATE registrations SET ${regAssignments.join(", ")}, updated_at = NOW() WHERE user_id = $${regValues.length}`,
        regValues
      )

      if (categoryId !== undefined) {
        await query("UPDATE users SET category_id = $1 WHERE id = $2", [categoryId, userId])
      }
    }

    return successResponse({ message: "Profil aktualisiert" })
  } catch (error) {
    console.error("[Account Profile] Error:", error)
    return serverError("Profil konnte nicht aktualisiert werden")
  }
}

export const PATCH = withAuth(handlePatch)
