import { query } from "@/lib/db"
import { successResponse, serverError, validationError, notFoundError } from "@/lib/api"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"

async function handleGet() {
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
         created_at,
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
      const contacts = result.rows.map((row) => {
        return {
          id: row.id,
          company_name: row.company_name,
          contact_name: row.contact_name,
          email: row.email,
          phone: row.phone,
          interested_in: row.interested_in,
          message: row.message,
          status: row.status,
          created_at: row.created_at,
          logo_url: row.logo_url,
          website_url: row.website_url,
          logo_size: row.logo_size,
          tier: row.tier,
          logo_bg_color: row.logo_bg_color,
          description: row.description,
          description_en: row.description_en,
          updated_at: new Date(row.updated_at).getTime()
        }
      })

      return successResponse({ contacts })
    }
  } catch (error) {
    console.error("Sponsor contacts fetch error:", error)
  }

  return successResponse({ contacts: [] })
}

async function handlePatch(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const { id, status } = body

    if (!id) return validationError("Sponsor ID required")

    const ALLOWED_STATUS = ["new", "contacted", "confirmed", "rejected"]

    const fields: string[] = []
    const values: (string | number | boolean)[] = []
    let idx = 1

    if (status !== undefined) {
      if (!ALLOWED_STATUS.includes(status)) {
        return validationError(`Invalid status. Allowed: ${ALLOWED_STATUS.join(", ")}`)
      }
      fields.push("status = $" + idx)
      values.push(status)
      idx++
    }

    if (fields.length === 0) return validationError("No fields to update")

    fields.push("updated_at = NOW()")
    values.push(id)

    const result = await query(
      `UPDATE sponsor_contacts SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    )

    if (result.rows.length === 0) return notFoundError("Sponsor not found")

    return successResponse({ sponsor: result.rows[0] })
  } catch (error) {
    console.error("[Admin Sponsors] PATCH Error:", error)
    return serverError()
  }
}

async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const { companyName, contactName, email, phone, message, interestedIn } = body

    if (!companyName || !contactName || !email) {
      return validationError("Company name, contact name and e-mail required")
    }

    const result = await query(
      `INSERT INTO sponsor_contacts (company_name, contact_name, email, phone, message, interested_in, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmed')
       RETURNING id, company_name, contact_name, email, phone, interested_in, message, status, created_at, logo_url, website_url, logo_size, tier, logo_bg_color, description, description_en, updated_at`,
      [companyName, contactName, email, phone || null, message || null, interestedIn || null]
    )

    const row = result.rows[0]
    return successResponse({
      contact: {
        ...row,
        updated_at: new Date(row.updated_at).getTime()
      }
    })
  } catch (error) {
    console.error("[Admin Sponsors] POST Error:", error)
    return serverError()
  }
}

export const GET = withAdminAuth(handleGet)
export const PATCH = withAdminAuth(handlePatch)
export const POST = withAdminAuth(handlePost)
