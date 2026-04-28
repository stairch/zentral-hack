import { put } from "@vercel/blob"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { serverError, validationError } from "@/lib/api"
import { NextResponse } from "next/server"

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

    const blob = await put(file.name, file, { access: "private", allowOverwrite: true })

    return NextResponse.json({ url: blob.url }, { status: 200 })
  } catch (error) {
    console.error("Upload error:", error)
    return serverError("Upload failed")
  }
}

export const POST = withAdminAuth(handlePost)
