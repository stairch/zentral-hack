import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id")
    if (!id) {
      return new NextResponse(null, { status: 400 })
    }

    const result = await query("SELECT image_url FROM event_photos WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return new NextResponse(null, { status: 404 })
    }

    const blobUrl: string = result.rows[0].image_url

    if (!blobUrl?.startsWith("https://")) {
      return new NextResponse(null, { status: 404 })
    }

    const blobResponse = await fetch(blobUrl, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
    })

    if (!blobResponse.ok) {
      return new NextResponse(null, { status: 502 })
    }

    const contentType = blobResponse.headers.get("content-type") || "image/jpeg"
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
    console.error("[Event photo proxy] Error:", error)
    return new NextResponse(null, { status: 500 })
  }
}
