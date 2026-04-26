import { query } from "@/lib/db"
import { successResponse, serverError } from "@/lib/api"
import { isMissingTableError } from "@/lib/db-errors"

export async function GET() {
  try {
    const result = await query(
      `SELECT id, name, logo_url, website_url, logo_size, sort_order
       FROM partner_logos
       WHERE is_active = true
       ORDER BY sort_order ASC`
    )
    return successResponse({ logos: result.rows })
  } catch (error) {
    if (isMissingTableError(error, "partner_logos")) {
      return successResponse({ logos: [] })
    }
    return serverError("Failed to load partner logos")
  }
}
