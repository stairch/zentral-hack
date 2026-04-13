import { query } from "@/lib/db"
import { successResponse } from "@/lib/api"
import { withAdminAuth } from "@/lib/middleware"

export async function handleGet() {
  try {
    const result = await query(
      `SELECT
         id,
         company_name,
         contact_name,
         email,
         phone,
         interested_in,
         message,
         status,
         created_at
       FROM sponsor_contacts
       ORDER BY created_at ASC`
    )

    if (result.rows.length > 0) {
      const contacts = result.rows.map((row) => {
        return {
          id: row.id,
          companyName: row.company_name,
          contactName: row.contact_name,
          email: row.email,
          phone: row.phone,
          interestedIn: row.interested_in,
          message: row.message,
          status: row.status,
          created_at: row.created_at
        }
      })

      return successResponse({ contacts })
    }
  } catch (error) {
    console.error("Sponsor contacts fetch error:", error)
  }

  return successResponse({ contacts: [] })
}

export const GET = withAdminAuth(handleGet)
