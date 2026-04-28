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
         logo_bg_color
       FROM sponsor_contacts
       ORDER BY created_at ASC`
    )

    if (result.rows.length > 0) {
      const sponsors = result.rows.map((row) => {
        return {
          id: row.id,
          company_name: row.company_name,
          status: row.status,
          logo_url: row.logo_url,
          website_url: row.website_url,
          logo_size: row.logo_size,
          tier: row.tier,
          logo_bg_color: row.logo_bg_color
        }
      })

      return successResponse({ sponsors })
    }
  } catch (error) {
    console.error("Sponsors fetch error:", error)
  }

  return successResponse({ sponsors: [] })
}
