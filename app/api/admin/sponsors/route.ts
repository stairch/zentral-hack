import { query } from "@/lib/db"
import { successResponse, serverError, validationError } from "@/lib/api"
import { withAdminAuth, type AuthenticatedRequest } from "@/lib/middleware"
import { normalizeHexColor } from "@/lib/helpers"
import { type SponsorPackagePriceStatus } from "@/lib/sponsorship-packages"

type SponsorPackageRow = {
  id: string
  name: string
  name_en: string | null
  short_description: string | null
  short_description_en: string | null
  description: string | null
  description_en: string | null
  color: string | null
  benefits: string[] | null
  benefits_en: string[] | null
  price: number | null
  price_status: SponsorPackagePriceStatus
  display_order: number
  created_at: string
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

function normalizePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null
}

function normalizePriceStatus(value: unknown): SponsorPackagePriceStatus {
  return value === "show" || value === "on_request" ? value : "hidden"
}

export const GET = withAdminAuth(async () => {
  try {
    const result = await query(`
      SELECT
        id::text,
        name,
        name_en,
        short_description,
        short_description_en,
        description,
        description_en,
        color,
        benefits,
        benefits_en,
        price,
        price_status,
        display_order,
        created_at
      FROM sponsor_packages
      ORDER BY display_order ASC, created_at ASC`)

    return successResponse({
      packages: result.rows as SponsorPackageRow[]
    })
  } catch (error) {
    console.error("[Admin Sponsors] GET error:", error)
    return serverError("Fehler beim Laden der Sponsorpakete")
  }
})

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const name = String(body.name || "").trim()
    const nameEn = String(body.nameEn || "").trim()
    const shortDescription = String(body.shortDescription || "").trim()
    const shortDescriptionEn = String(body.shortDescriptionEn || "").trim()
    const description = String(body.description || "").trim()
    const descriptionEn = String(body.descriptionEn || "").trim()
    const displayOrder = Number(body.displayOrder)
    const color = normalizeHexColor(body.color)
    const benefits = normalizeBenefits(body.benefits)
    const benefitsEn = normalizeBenefits(body.benefitsEn)
    const price = normalizePrice(body.price)
    const priceStatus = normalizePriceStatus(body.priceStatus)

    if (!name) {
      return validationError("Name ist erforderlich")
    }

    if (!Number.isFinite(displayOrder)) {
      return validationError("Display-Order ist erforderlich")
    }

    if (priceStatus === "show" && price === null) {
      return validationError("Preis ist erforderlich, wenn der Status auf Anzeigen steht")
    }

    const result = await query(
      `INSERT INTO sponsor_packages (
         name,
         name_en,
         short_description,
         short_description_en,
         display_order,
         description,
         description_en,
         color,
         benefits,
         benefits_en,
         price,
         price_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING
         id::text,
         name,
         name_en,
         short_description,
         short_description_en,
         description,
         description_en,
         color,
         benefits,
         benefits_en,
         price,
         price_status,
         display_order,
         created_at`,
      [
        name,
        nameEn || null,
        shortDescription || null,
        shortDescriptionEn || null,
        displayOrder,
        description || null,
        descriptionEn || null,
        color,
        benefits,
        benefitsEn,
        price,
        priceStatus
      ]
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
    const nameEn = String(body.nameEn || "").trim()
    const shortDescription = String(body.shortDescription || "").trim()
    const shortDescriptionEn = String(body.shortDescriptionEn || "").trim()
    const description = String(body.description || "").trim()
    const descriptionEn = String(body.descriptionEn || "").trim()
    const displayOrder = Number(body.displayOrder)
    const color = normalizeHexColor(body.color)
    const benefits = normalizeBenefits(body.benefits)
    const benefitsEn = normalizeBenefits(body.benefitsEn)
    const price = normalizePrice(body.price)
    const priceStatus = normalizePriceStatus(body.priceStatus)

    if (!id) {
      return validationError("ID ist erforderlich")
    }

    if (!name) {
      return validationError("Name ist erforderlich")
    }

    if (!Number.isFinite(displayOrder)) {
      return validationError("Display-Order ist erforderlich")
    }

    if (priceStatus === "show" && price === null) {
      return validationError("Preis ist erforderlich, wenn der Status auf Anzeigen steht")
    }

    const result = await query(
      `UPDATE sponsor_packages
       SET name = $1,
           name_en = $2,
           short_description = $3,
           short_description_en = $4,
           display_order = $5,
           description = $6,
           description_en = $7,
           color = $8,
           benefits = $9,
           benefits_en = $10,
           price = $11,
           price_status = $12,
           created_at = created_at
       WHERE id = $13::uuid
       RETURNING
         id::text,
         name,
         name_en,
         short_description,
         short_description_en,
         description,
         description_en,
         color,
         benefits,
         benefits_en,
         price,
         price_status,
         display_order,
         created_at`,
      [
        name,
        nameEn || null,
        shortDescription || null,
        shortDescriptionEn || null,
        displayOrder,
        description || null,
        descriptionEn || null,
        color,
        benefits,
        benefitsEn,
        price,
        priceStatus,
        id
      ]
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
