import { query } from "@/lib/db"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, serverError, validationError } from "@/lib/api"

type QueryValue = string | number | boolean | null | string[]

const VALID_ICONS = [
  "clock",
  "coffee",
  "utensils",
  "presentation",
  "code",
  "party-popper",
  "sun",
  "moon",
  "star",
  "zap",
  "music",
  "trophy"
]

async function handleGet() {
  try {
    const result = await query(
      `SELECT id, day, time, icon, title_de, title_en, description_de, description_en, sort_order
       FROM schedule_items ORDER BY day ASC, sort_order ASC`
    )
    return successResponse({ items: result.rows })
  } catch {
    return serverError("Failed to load schedule")
  }
}

async function handlePost(req: AuthenticatedRequest) {
  try {
    const { day, time, icon, title_de, title_en, description_de, description_en, sort_order } =
      await req.json()

    if (!day || !time || !title_de || !title_en) {
      return validationError("day, time, title_de and title_en are required")
    }
    if (![1, 2].includes(Number(day))) {
      return validationError("day must be 1 or 2")
    }

    const result = await query(
      `INSERT INTO schedule_items (day, time, icon, title_de, title_en, description_de, description_en, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        Number(day),
        String(time).trim(),
        VALID_ICONS.includes(icon) ? icon : "clock",
        String(title_de).trim(),
        String(title_en).trim(),
        String(description_de || "").trim(),
        String(description_en || "").trim(),
        Number(sort_order) || 0
      ]
    )
    return successResponse({ item: result.rows[0] })
  } catch {
    return serverError("Failed to create schedule item")
  }
}

async function handlePut(req: AuthenticatedRequest) {
  try {
    const { id, day, time, icon, title_de, title_en, description_de, description_en, sort_order } =
      await req.json()

    if (!id) return validationError("id required")

    const fields: string[] = []
    const values: QueryValue[] = []

    if (time !== undefined) {
      values.push(String(time).trim())
      fields.push(`time = $${values.length}`)
    }
    if (icon !== undefined) {
      values.push(VALID_ICONS.includes(icon) ? icon : "clock")
      fields.push(`icon = $${values.length}`)
    }
    if (title_de !== undefined) {
      values.push(String(title_de).trim())
      fields.push(`title_de = $${values.length}`)
    }
    if (title_en !== undefined) {
      values.push(String(title_en).trim())
      fields.push(`title_en = $${values.length}`)
    }
    if (description_de !== undefined) {
      values.push(String(description_de).trim())
      fields.push(`description_de = $${values.length}`)
    }
    if (description_en !== undefined) {
      values.push(String(description_en).trim())
      fields.push(`description_en = $${values.length}`)
    }
    if (sort_order !== undefined) {
      values.push(Number(sort_order))
      fields.push(`sort_order = $${values.length}`)
    }
    if (day !== undefined) {
      values.push(Number(day))
      fields.push(`day = $${values.length}`)
    }

    if (fields.length === 0) return validationError("No fields to update")

    fields.push("updated_at = NOW()")
    values.push(String(id))

    await query(`UPDATE schedule_items SET ${fields.join(", ")} WHERE id = $${values.length}`, values)
    return successResponse({ message: "Item updated" })
  } catch {
    return serverError("Failed to update schedule item")
  }
}

async function handleDelete(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return validationError("id required")

    await query("DELETE FROM schedule_items WHERE id = $1", [id])
    return successResponse({ message: "Item deleted" })
  } catch {
    return serverError("Failed to delete schedule item")
  }
}

export const GET = withAdminAuth(handleGet as Parameters<typeof withAdminAuth>[0])
export const POST = withAdminAuth(handlePost)
export const PUT = withAdminAuth(handlePut)
export const DELETE = withAdminAuth(handleDelete)
