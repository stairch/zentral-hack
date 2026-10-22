import { query } from "@/lib/db"
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const challengeId = searchParams.get("challengeId")
    if (!challengeId) return validationError("challengeId required")

    const challengeResult = await query("SELECT category_id FROM sponsor_challenges WHERE id = $1", [
      challengeId
    ])
    if (challengeResult.rows.length === 0) return validationError("Challenge not found")
    const categoryId = challengeResult.rows[0].category_id

    if (req.user?.role !== "admin" && req.user?.role !== "category_partner") {
      const regCheck = await query("SELECT id FROM registrations WHERE user_id = $1 AND category_id = $2", [
        req.user?.userId ?? "",
        categoryId
      ])
      const sponsorCheck = await query("SELECT id FROM users WHERE id = $1 AND category_id = $2", [
        req.user?.userId ?? "",
        categoryId
      ])
      if (regCheck.rows.length === 0 && sponsorCheck.rows.length === 0) {
        return validationError("Access denied")
      }
    } else if (req.user?.role === "category_partner" && req.user.categoryId !== categoryId) {
      return validationError("Access denied")
    }

    const result = await query(
      "SELECT id, name, description, file_size, created_at FROM challenge_documents WHERE challenge_id = $1 ORDER BY created_at DESC",
      [challengeId]
    )
    return successResponse({ documents: result.rows })
  } catch (error) {
    console.error("[Challenge Documents] Public GET Error:", error)
    return serverError()
  }
})
