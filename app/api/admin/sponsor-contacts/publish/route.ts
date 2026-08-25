import { query } from "@/lib/db"
import { del } from "@vercel/blob"
import { successResponse, serverError, validationError, notFoundError } from "@/lib/api"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { isValidHex, isValidUrl } from "@/lib/helpers"

async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const { id, logoUrl, websiteUrl, logoBgColor, logoSize, tier, description, descriptionEn } = body

    if (!id) return validationError("Sponsor ID required")
    if (!logoUrl) return validationError("Sponsor logo URL required")
    // logo background color must be a hex value or null (= transparent)
    if (logoBgColor === undefined) return validationError("Sponsor logo background color required")
    if (!logoSize) return validationError("Sponsor logo size required")
    if (!tier) return validationError("Sponsor tier required")

    // Delete existing blob if a logo already exists and differs from current logo
    const existing = await query(`SELECT logo_url FROM sponsor_contacts WHERE id = $1`, [String(id)])
    const oldUrl = existing.rows[0]?.logo_url
    if (oldUrl && oldUrl !== logoUrl) {
      try {
        await del(oldUrl)
      } catch (e) {
        console.warn("[Admin Sponsors Publish] Blob deletion failed, continuing:", e)
      }
    }

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

    const sizeNum = Number(logoSize)
    const validSize = Number.isInteger(sizeNum) && sizeNum >= 5 && sizeNum <= 100 && sizeNum % 5 === 0
    if (!validSize) {
      return validationError(`Invalid logo size. Must be an integer between 5 and 100 in steps of 5.`)
    }
    fields.push("logo_size = $" + idx)
    values.push(sizeNum)
    idx++

    fields.push("tier = $" + idx)
    values.push(tier)
    idx++

    fields.push("description = $" + idx)
    values.push(description || null)
    idx++

    fields.push("description_en = $" + idx)
    values.push(descriptionEn || null)
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
