import { query } from "@/lib/db"
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { hashPassword } from "@/lib/auth"

/**
 * POST /api/account/delete
 * Directly deletes the account once the user typed "DELETE <email>" – no emailed
 * confirmation code. Registrations, team memberships and the profile are removed
 * and the user row is anonymised & deactivated. Uploaded documents are kept.
 */
async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const confirmation = String(body.confirmation || "").trim()

    const userResult = await query("SELECT id, email FROM users WHERE id = $1", [req.user!.userId])
    const user = userResult.rows[0]
    if (!user) {
      return validationError("Benutzer nicht gefunden")
    }

    if (confirmation !== `DELETE ${user.email}`) {
      return validationError("Bestätigungstext stimmt nicht überein")
    }

    const randomPassword = await hashPassword(`deleted-${user.id}-${Date.now()}`)

    await query("DELETE FROM registrations WHERE user_id = $1", [user.id])
    await query("DELETE FROM team_members WHERE user_id = $1", [user.id])
    await query("DELETE FROM profiles WHERE user_id = $1", [user.id])
    await query(
      "UPDATE newsletter_subscribers SET subscribed = false WHERE email = (SELECT email FROM users WHERE id = $1)",
      [user.id]
    )
    await query(
      `UPDATE users
       SET email = CONCAT('deleted+', id::text, '@deleted.local'),
           password_hash = $1,
           first_name = NULL,
           last_name = NULL,
           role = 'user',
           category_id = NULL,
           admin_role_id = NULL,
           is_active = false,
           email_verified = false,
           updated_at = NOW()
       WHERE id = $2`,
      [randomPassword, user.id]
    )

    const response = successResponse({ message: "Konto gelöscht" })
    response.cookies.delete("token")
    return response
  } catch (error) {
    console.error("[Account Delete] Error:", error)
    return serverError("Konto konnte nicht gelöscht werden")
  }
}

export const POST = withAuth(handlePost)
