import { query } from "@/lib/db"
import { successResponse, serverError } from "@/lib/api"
import { withCategoryPartnerAuth } from "@/lib/middleware"
import { getAllSubscribers } from "@/lib/resend"

/**
 * GET /api/admin/dashboard-stats
 * Fetches dashboard statistics (admins and category partners; aggregate counts only)
 */
export const GET = withCategoryPartnerAuth(async () => {
  try {
    const [registrationsRes, newsletterRes, teamsRes, documentsRes] = await Promise.all([
      query(
        `SELECT COUNT(*) as count
         FROM users u
         WHERE u.email_verified = true
           AND u.role = 'user'
           AND EXISTS (SELECT 1 FROM registrations r WHERE r.user_id = u.id)`
      ),
      getAllSubscribers(),
      query("SELECT COUNT(*) as count FROM teams"),
      query("SELECT COUNT(*) as count FROM category_documents")
    ])

    const stats = {
      registrations: parseInt(registrationsRes.rows[0]?.count || 0),
      newsletter: newsletterRes.length,
      teams: parseInt(teamsRes.rows[0]?.count || 0),
      documents: parseInt(documentsRes.rows[0]?.count || 0)
    }

    return successResponse({ stats })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return serverError("Fehler beim Laden der Statistiken")
  }
})
