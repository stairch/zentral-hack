import { del } from "@vercel/blob"
import { query } from "@/lib/db"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, serverError, validationError } from "@/lib/api"

type QueryValue = string | number | boolean | null | string[]

async function handleGet() {
  try {
    const result = await query(
      `SELECT id, name, logo_url, website_url, logo_size, sort_order, is_active, updated_at
       FROM partner_logos ORDER BY sort_order ASC`
    )

    const logos = result.rows.map((row) => ({
      ...row,
      updated_at: new Date(row.updated_at).getTime()
    }))

    return successResponse({ logos })
  } catch {
    return serverError("Failed to load partner logos")
  }
}

async function handlePost(req: AuthenticatedRequest) {
  try {
    const { name, logo_url, website_url, logo_size, sort_order } = await req.json()
    if (!name || !logo_url) return validationError("name and logo_url are required")

    const result = await query(
      `INSERT INTO partner_logos (name, logo_url, website_url, logo_size, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        String(name).trim(),
        String(logo_url).trim(),
        website_url ? String(website_url).trim() : null,
        ["small", "medium", "large"].includes(logo_size) ? logo_size : "medium",
        Number(sort_order) || 0
      ]
    )
    return successResponse({ logo: result.rows[0] })
  } catch {
    return serverError("Failed to create partner logo")
  }
}

async function handlePut(req: AuthenticatedRequest) {
  try {
    const { id, name, logo_url, website_url, logo_size, sort_order, is_active } = await req.json()
    if (!id) return validationError("id required")

    // Delete existing blob if a logo already exists and differs from current one
    if (logo_url !== undefined) {
      const existing = await query(`SELECT logo_url FROM partner_logos WHERE id = $1`, [String(id)])
      const oldUrl = existing.rows[0]?.logo_url
      if (oldUrl !== logo_url) {
        try {
          await del(oldUrl)
        } catch (e) {
          console.warn("[Partner Logos] Blob deletion failed, continuing:", e)
        }
      }
    }

    const fields: string[] = []
    const values: QueryValue[] = []

    if (name !== undefined) {
      values.push(String(name).trim())
      fields.push(`name = $${values.length}`)
    }
    if (logo_url !== undefined) {
      values.push(String(logo_url).trim())
      fields.push(`logo_url = $${values.length}`)
    }
    if (website_url !== undefined) {
      values.push(website_url ? String(website_url).trim() : null)
      fields.push(`website_url = $${values.length}`)
    }
    if (logo_size !== undefined) {
      values.push(["small", "medium", "large"].includes(logo_size) ? logo_size : "medium")
      fields.push(`logo_size = $${values.length}`)
    }
    if (sort_order !== undefined) {
      values.push(Number(sort_order))
      fields.push(`sort_order = $${values.length}`)
    }
    if (is_active !== undefined) {
      values.push(Boolean(is_active))
      fields.push(`is_active = $${values.length}`)
    }

    if (fields.length === 0) return validationError("No fields to update")
    fields.push("updated_at = NOW()")
    values.push(String(id))

    await query(`UPDATE partner_logos SET ${fields.join(", ")} WHERE id = $${values.length}`, values)
    return successResponse({ message: "Logo updated" })
  } catch {
    return serverError("Failed to update partner logo")
  }
}

async function handleDelete(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return validationError("id required")

    const result = await query("SELECT logo_url FROM partner_logos WHERE id = $1", [id])
    if (result.rows.length === 0) return validationError("Logo not found")

    const logoUrl: string | null = result.rows[0].logo_url
    await query("DELETE FROM partner_logos WHERE id = $1", [id])

    if (logoUrl?.startsWith("https://")) {
      try {
        await del(logoUrl)
      } catch (e) {
        console.warn("[Partner Logos] Blob deletion failed, continuing:", e)
      }
    }

    return successResponse({ message: "Logo deleted" })
  } catch {
    return serverError("Failed to delete partner logo")
  }
}

export const GET = withAdminAuth(handleGet as Parameters<typeof withAdminAuth>[0])
export const POST = withAdminAuth(handlePost)
export const PUT = withAdminAuth(handlePut)
export const DELETE = withAdminAuth(handleDelete)
