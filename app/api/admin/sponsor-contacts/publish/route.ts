import { query } from "@/lib/db"
import { successResponse, serverError, validationError, notFoundError } from "@/lib/api"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { isValidHex, isValidUrl } from "@/lib/helpers"

async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const { id, logoUrl, websiteUrl, logoBgColor, logoSize, tier } = body

    if (!id) return validationError("Sponsor ID required")
    if (!logoUrl) return validationError("Sponsor logo URL required")
    // logo background color must be a hex value or null (= transparent)
    if (logoBgColor === undefined) return validationError("Sponsor logo background color required")
    if (!logoSize) return validationError("Sponsor logo size required")
    if (!tier) return validationError("Sponsor tier required")

    const ALLOWED_LOGO_SIZES = ["small", "medium", "large"]
    const ALLOWED_TIERS = ["platin", "gold", "silber", "bronze"]
    const normalizedTier = String(tier).trim().toLowerCase()

    const fields: string[] = []
    const values: (string | number | boolean)[] = []
    let idx = 1

    if (!isValidUrl(logoUrl)) {
      return validationError(`Invalid sponsor logo URL`)
    }
    fields.push("logo_url = $" + idx)
    values.push(logoUrl)
    idx++

    if (websiteUrl && !isValidUrl(websiteUrl)) {
      return validationError(`Invalid sponsor website URL`)
    }

    fields.push("website_url = $" + idx)
    values.push(websiteUrl || null)
    idx++

    if (logoBgColor !== null && !isValidHex(logoBgColor)) {
      return validationError(`Invalid sponsor logo background color`)
    }
    fields.push("logo_bg_color = $" + idx)
    values.push(logoBgColor)
    idx++

    if (!ALLOWED_LOGO_SIZES.includes(logoSize)) {
      return validationError(`Invalid logo size. Allowed: ${ALLOWED_LOGO_SIZES.join(", ")}`)
    }
    fields.push("logo_size = $" + idx)
    values.push(logoSize)
    idx++

    if (!ALLOWED_TIERS.includes(normalizedTier)) {
      return validationError(`Invalid tier. Allowed: ${ALLOWED_TIERS.join(", ")}`)
    }

    const tierResult = await query(
      `SELECT id::text
       FROM sponsor_packages
       WHERE LOWER(name) = $1 OR id::text = $1
       ORDER BY display_order ASC
       LIMIT 1`,
      [normalizedTier]
    )

    if (tierResult.rows.length === 0) {
      return validationError(`Invalid tier. Allowed: ${ALLOWED_TIERS.join(", ")}`)
    }

    fields.push("tier = $" + idx)
    values.push(tierResult.rows[0].id)
    idx++

    fields.push("status = 'published'")
    fields.push("updated_at = NOW()")
    values.push(id)

    const result = await query(
      `WITH updated AS (
         UPDATE sponsor_contacts
         SET ${fields.join(", ")}
         WHERE id = $${idx}
         RETURNING *
       )
       SELECT
         u.id,
         u.company_name,
         u.contact_name,
         u.email,
         u.phone,
         COALESCE(LOWER(sp_interest.name), NULL) AS interested_in,
         u.message,
         u.status,
         u.created_at,
         u.logo_url,
         u.website_url,
         u.logo_size,
         COALESCE(LOWER(sp_tier.name), NULL) AS tier,
         u.logo_bg_color
       FROM updated u
       LEFT JOIN sponsor_packages sp_interest ON sp_interest.id::text = u.interested_in::text
       LEFT JOIN sponsor_packages sp_tier ON sp_tier.id::text = u.tier::text`,
      values
    )

    if (result.rows.length === 0) return notFoundError("Sponsor not found")

    return successResponse({ sponsor: result.rows[0] })
  } catch (error) {
    console.error("[Admin Sponsors Publish] POST Error:", error)
    return serverError()
  }
}

export const POST = withAdminAuth(handlePost)
