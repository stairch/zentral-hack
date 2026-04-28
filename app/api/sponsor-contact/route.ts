import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { successResponse } from "@/lib/api"
import { sendEmail } from "@/lib/email"

export async function GET() {
  try {
    const result = await query(
      `SELECT
         COALESCE(id::text, LOWER(name)) AS id,
         LOWER(name) AS slug,
         name,
         name_en,
         short_description,
         short_description_en,
         COALESCE(description, '') AS description,
         COALESCE(description_en, '') AS description_en,
         color,
         benefits,
         benefits_en,
         price,
         price_status,
         display_order
       FROM sponsor_packages
       ORDER BY display_order ASC`
    )

    if (result.rows.length > 0) {
      const packages = result.rows.map((row) => {
        return {
          id: row.id,
          slug: row.slug,
          name: row.name || "Paket",
          name_en: row.name_en || row.name,
          short_description: row.short_description || row.description || "",
          short_description_en: row.short_description_en || row.description_en || row.description || "",
          description: row.description || "",
          description_en: row.description_en || row.description || "",
          color: row.color || "",
          benefits: Array.isArray(row.benefits) && row.benefits.length > 0 ? row.benefits : [],
          benefits_en: Array.isArray(row.benefits_en) && row.benefits_en.length > 0 ? row.benefits_en : [],
          price: typeof row.price === "number" ? row.price : null,
          price_status: row.price_status || "hidden",
          display_order: row.display_order
        }
      })

      return successResponse({ packages })
    }
  } catch (error) {
    console.error("Sponsor package fetch error:", error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { companyName, contactName, email, phone, message, interestLevel, interestedIn } = body
    const normalizedInterest = normalizeSponsorInterest(interestedIn || interestLevel)
    let interestedPackageId: string | null = null

    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { error: "Firmenname, Kontaktname und E-Mail sind erforderlich" },
        { status: 400 }
      )
    }

    if (normalizedInterest) {
      const packageResult = await query(
        `SELECT id::text
         FROM sponsor_packages
         WHERE LOWER(name) = $1 OR id::text = $1
         ORDER BY display_order ASC
         LIMIT 1`,
        [normalizedInterest]
      )

      if (packageResult.rows.length > 0) {
        interestedPackageId = packageResult.rows[0].id
      }
    }

    await query(
      `INSERT INTO sponsor_contacts (company_name, contact_name, email, phone, message, interested_in, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'new')`,
      [companyName, contactName, email, phone || null, message || null, interestedPackageId]
    )

    const emails: string[] = []
    if (process.env.NODE_ENV === "production") {
      emails.push("sponsoring@zentralhack.ch")
      try {
        const result = await query(`SELECT u.id, u.email FROM users u WHERE u.role = 'admin'`)
        result.rows?.forEach((element) => {
          if (!emails.includes(element.email)) emails.push(element.email)
        })
      } catch (error) {
        console.error("[Admin Sponsor Contact Admins] GET Error:", error)
      }
    } else {
      if (process.env.TEST_EMAIL) {
        emails.push(process.env.TEST_EMAIL)
      }
    }

    if (emails.length > 0) {
      await sendEmail({
        to: emails,
        subject: `Neue Sponsorenanfrage von ${companyName}`,
        html: `
        <h2>Es wurde eine neue Sponsorenanfrage eingereicht!</h2>
        <p>Firma: ${companyName}</p>
        <p>Siehe weitere Informationen im Admin Panel</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/sponsors" style="display: inline-block; padding: 10px 20px; background: #530A5D; color: white; text-decoration: none; border-radius: 5px;">Zum Admin Panel</a>
      `
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Sponsor contact error:", error)
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 })
  }
}
