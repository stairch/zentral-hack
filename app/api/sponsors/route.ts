import { query } from "@/lib/db"
import { successResponse } from "@/lib/api"

export async function GET() {
  try {
    const result = await query(
      `SELECT
         id,
         company_name,
         status,
         logo_url,
         website_url,
         logo_size,
         tier,
         logo_bg_color,
         description,
         description_en,
         updated_at
       FROM sponsor_contacts
       ORDER BY created_at ASC`
    )

    if (result.rows.length > 0) {
      const sponsors = result.rows.map((row) => {
        return {
          ...row,
          updated_at: new Date(row.updated_at).getTime()
        }
      })

      return successResponse({ sponsors })
    }
  } catch (error) {
    console.error("Sponsors fetch error:", error)
  }

  return successResponse({ sponsors: [] })
}
