import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { successResponse } from "@/lib/api"
import {
  getSponsorPackageBySlug,
  normalizeSponsorInterest,
  sponsorPackages
} from "@/lib/sponsorship-packages"

export async function GET() {
  try {
    const result = await query(
      `SELECT
         COALESCE(id::text, LOWER(name)) AS id,
         LOWER(name) AS slug,
         name,
         COALESCE(description, '') AS description,
         color,
         benefits,
         display_order
       FROM sponsor_packages
       ORDER BY display_order ASC`
    )

    if (result.rows.length > 0) {
      const packages = result.rows.map((row) => {
        const fallbackPackage = getSponsorPackageBySlug(row.slug) || getSponsorPackageBySlug(row.name)

        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          description: row.description || fallbackPackage?.description || "",
          shortDescription:
            fallbackPackage?.shortDescription || row.description || "Sponsoring-Paket für den Zentral Hack",
          color: row.color || fallbackPackage?.color || "#530A5D",
          benefits:
            Array.isArray(row.benefits) && row.benefits.length > 0
              ? row.benefits
              : fallbackPackage?.benefits || [],
          display_order: row.display_order
        }
      })

      return successResponse({ packages })
    }
  } catch (error) {
    console.error("Sponsor package fetch error:", error)
  }

  return successResponse({ packages: sponsorPackages })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { companyName, contactName, email, phone, message, interestLevel, interestedIn } = body
    const normalizedInterest = normalizeSponsorInterest(interestedIn || interestLevel)

    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { error: "Firmenname, Kontaktname und E-Mail sind erforderlich" },
        { status: 400 }
      )
    }

    await query(
      `INSERT INTO sponsor_contacts (company_name, contact_name, email, phone, message, interested_in, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'new')`,
      [companyName, contactName, email, phone || null, message || null, normalizedInterest]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Sponsor contact error:", error)
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 })
  }
}
