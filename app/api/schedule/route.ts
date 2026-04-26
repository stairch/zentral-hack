import { query } from "@/lib/db"
import { successResponse, serverError } from "@/lib/api"
import { isMissingTableError } from "@/lib/db-errors"

export async function GET() {
  try {
    const result = await query(
      `SELECT id, day, time, icon, title_de, title_en, description_de, description_en, sort_order
       FROM schedule_items
       ORDER BY day ASC, sort_order ASC`
    )
    return successResponse({ items: result.rows })
  } catch (error) {
    if (isMissingTableError(error, "schedule_items")) {
      return successResponse({ items: [] })
    }
    return serverError("Failed to load schedule")
  }
}
