import { put } from "@vercel/blob"
import sharp from "sharp"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { serverError, validationError } from "@/lib/api"
import { NextResponse } from "next/server"

const LOGO_MAX_HEIGHT = 200
const LOGO_MAX_WIDTH = 600

async function handlePost(req: AuthenticatedRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) return validationError("No file provided")

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]
    if (!allowedTypes.includes(file.type)) {
      return validationError("Only PNG, JPG, WEBP and SVG files are allowed")
    }

    if (file.size > 5 * 1024 * 1024) {
      return validationError("File size must be under 5MB")
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let uploadBuffer: Buffer
    let uploadName: string
    let contentType: string

    if (file.type === "image/svg+xml") {
      // SVGs are vector — no resize needed
      uploadBuffer = buffer
      uploadName = file.name
      contentType = "image/svg+xml"
    } else {
      // Raster images: resize to max dimensions, keep aspect ratio, convert to WebP
      uploadBuffer = await sharp(buffer)
        .resize(LOGO_MAX_WIDTH, LOGO_MAX_HEIGHT, { fit: "inside", withoutEnlargement: false })
        .webp({ quality: 90 })
        .toBuffer()
      uploadName = file.name.replace(/\.[^.]+$/, "") + ".webp"
      contentType = "image/webp"
    }

    const blob = await put(uploadName, uploadBuffer, {
      access: "private",
      allowOverwrite: true,
      contentType
    })

    return NextResponse.json({ url: blob.url }, { status: 200 })
  } catch (error) {
    console.error("Upload error:", error)
    return serverError("Upload failed")
  }
}

export const POST = withAdminAuth(handlePost)
