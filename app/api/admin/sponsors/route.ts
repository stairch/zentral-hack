import { query } from "@/lib/db"
import { successResponse, serverError, validationError } from "@/lib/api"
import { withAdminAuth, type AuthenticatedRequest } from "@/lib/middleware"

type SponsorPackageRow = {
  id: string
  name: string
  description: string | null
  color: string | null
  benefits: string[] | null
  display_order: number
  created_at: string
}

function normalizeHexColor(value?: string | null): string {
  const trimmed = (value || "").trim().toUpperCase()
  if (!trimmed) return "#530A5D"
  if (/^#[0-9A-F]{6}$/.test(trimmed)) return trimmed
  return "#530A5D"
}

function normalizeBenefits(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

export const GET = withAdminAuth(async () => {
  try {
    const [packagesResult, contactsResult] = await Promise.all([
      query(
        `SELECT id::text, name, description, color, benefits, display_order, created_at
         FROM sponsor_packages
         ORDER BY display_order ASC, created_at ASC`
      ),
      query(
        `SELECT id::text, company_name, contact_name, email, phone, interested_in, message, status, created_at
         FROM sponsor_contacts
         ORDER BY created_at DESC`
      )
    ])

    return successResponse({
      packages: packagesResult.rows as SponsorPackageRow[],
      contacts: contactsResult.rows
    })
  } catch (error) {
    console.error("[Admin Sponsors] GET error:", error)
    return serverError("Fehler beim Laden der Sponsordaten")
  }
})

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const name = String(body.name || "").trim()
    const description = String(body.description || "").trim()
    const displayOrder = Number(body.displayOrder)
    const color = normalizeHexColor(body.color)
    const benefits = normalizeBenefits(body.benefits)

    if (!name) {
      return validationError("Name ist erforderlich")
    }

    if (!Number.isFinite(displayOrder)) {
      return validationError("Display-Order ist erforderlich")
    }

    const result = await query(
      `INSERT INTO sponsor_packages (name, display_order, description, color, benefits)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id::text, name, description, color, benefits, display_order, created_at`,
      [name, displayOrder, description || null, color, benefits]
    )

    return successResponse({ package: result.rows[0] }, 201)
  } catch (error) {
    console.error("[Admin Sponsors] POST error:", error)
    return serverError("Fehler beim Erstellen des Sponsorpakets")
  }
})

export const PUT = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const id = String(body.id || "").trim()
    const name = String(body.name || "").trim()
    const description = String(body.description || "").trim()
    const displayOrder = Number(body.displayOrder)
    const color = normalizeHexColor(body.color)
    const benefits = normalizeBenefits(body.benefits)

    if (!id) {
      return validationError("ID ist erforderlich")
    }

    if (!name) {
      return validationError("Name ist erforderlich")
    }

    if (!Number.isFinite(displayOrder)) {
      return validationError("Display-Order ist erforderlich")
    }

    const result = await query(
      `UPDATE sponsor_packages
       SET name = $1,
           display_order = $2,
           description = $3,
           color = $4,
           benefits = $5,
           created_at = created_at
       WHERE id = $6::uuid
       RETURNING id::text, name, description, color, benefits, display_order, created_at`,
      [name, displayOrder, description || null, color, benefits, id]
    )

    if (!result.rows[0]) {
      return validationError("Sponsorpaket nicht gefunden")
    }

    return successResponse({ package: result.rows[0] })
  } catch (error) {
    console.error("[Admin Sponsors] PUT error:", error)
    return serverError("Fehler beim Speichern des Sponsorpakets")
  }
})

export const DELETE = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const id = String(body.id || "").trim()

    if (!id) {
      return validationError("ID ist erforderlich")
    }

    await query("DELETE FROM sponsor_packages WHERE id = $1::uuid", [id])

    return successResponse({ message: "Sponsorpaket gelöscht" })
  } catch (error) {
    console.error("[Admin Sponsors] DELETE error:", error)
    return serverError("Fehler beim Löschen des Sponsorpakets")
  }
})
