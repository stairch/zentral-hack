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
    const contentLength = blobResponse.headers.get("content-length")

    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300"
    })
    if (contentLength) headers.set("Content-Length", contentLength)

    return new NextResponse(blobResponse.body, { status: 200, headers })
  } catch (error) {
    console.error("[Blob preview proxy] Error:", error)
    return new NextResponse(null, { status: 500 })
  }
}

export const GET = withAdminAuth(handleGet as Parameters<typeof withAdminAuth>[0])
