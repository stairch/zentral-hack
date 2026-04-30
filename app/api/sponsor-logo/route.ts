import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id")
    if (!id) {
      return new NextResponse(null, { status: 400 })
    }

    const result = await query(
      "SELECT logo_url FROM sponsor_contacts WHERE id = $1 AND status = 'published' AND logo_url IS NOT NULL",
      [id]
    )

    if (result.rows.length === 0) {
      return new NextResponse(null, { status: 404 })
    }

    const blobUrl: string = result.rows[0].logo_url

    if (!blobUrl?.startsWith("https://")) {
      return new NextResponse(null, { status: 404 })
    }

    const blobResponse = await fetch(blobUrl, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
    })

    if (!blobResponse.ok) {
      return new NextResponse(null, { status: 502 })
    }

    const contentType = blobResponse.headers.get("content-type") || "image/png"
    const buffer = await blobResponse.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800"
      }
    })
  } catch (error) {
    console.error("[Sponsor logo proxy] Error:", error)
    return new NextResponse(null, { status: 500 })
  }
}
