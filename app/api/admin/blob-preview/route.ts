import { NextResponse } from "next/server"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"

async function handleGet(req: AuthenticatedRequest) {
  const url = req.nextUrl.searchParams.get("url")

  if (!url || !url.startsWith("https://")) {
    return new NextResponse(null, { status: 400 })
  }

  try {
    const blobResponse = await fetch(url, {
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
        "Cache-Control": "private, max-age=300"
      }
    })
  } catch (error) {
    console.error("[Blob preview proxy] Error:", error)
    return new NextResponse(null, { status: 500 })
  }
}

export const GET = withAdminAuth(handleGet as Parameters<typeof withAdminAuth>[0])
