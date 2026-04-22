import { query } from "@/lib/db"
import { successResponse, serverError, validationError, notFoundError } from "@/lib/api"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { isValidHex, isValidUrl } from "@/lib/helpers"

async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    console.log(body)
    const { id, logoUrl, websiteUrl, logoBgColor, logoSize, tier } = body

    if (!id) return validationError("Sponsor ID required")
    if (!logoUrl) return validationError("Sponsor logo URL required")
    // logo background color must be a hex value or null (= transparent)
    if (logoBgColor === undefined) return validationError("Sponsor logo background color required")
    if (!logoSize) return validationError("Sponsor logo size required")
    if (!tier) return validationError("Sponsor tier required")

    const ALLOWED_LOGO_SIZES = ["small", "medium", "large"]
    const ALLOWED_TIERS = ["platin", "gold", "silber", "bronze"]

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

    if (!ALLOWED_TIERS.includes(tier)) {
      return validationError(`Invalid tier. Allowed: ${ALLOWED_TIERS.join(", ")}`)
    }
    fields.push("tier = $" + idx)
    values.push(tier)
    idx++

    fields.push("status = 'published'")
    fields.push("updated_at = NOW()")
    values.push(id)

    const result = await query(
      `UPDATE sponsor_contacts SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
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
