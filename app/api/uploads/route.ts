import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"
import { getAllowedKindsForFolder } from "@/lib/blob-upload"
import { ALLOWED_FILE_TYPES, getKindForFilename } from "@/lib/file-upload"

// Issues short-lived tokens so the browser can upload directly to Vercel Blob (see lib/blob-upload.ts)
async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = (await req.json()) as HandleUploadBody

    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const folder = pathname.slice(0, pathname.lastIndexOf("/"))
        const kinds = req.user ? await getAllowedKindsForFolder(folder, req.user) : null
        if (!kinds) throw new Error("Upload not allowed")

        const kind = getKindForFilename(pathname, kinds)
        if (!kind) throw new Error("Invalid file extension")

        return {
          allowedContentTypes: ALLOWED_FILE_TYPES[kind].mimeTypes,
          maximumSizeInBytes: ALLOWED_FILE_TYPES[kind].maxSize,
          addRandomSuffix: false,
          allowOverwrite: false
        }
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[Uploads] Token error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    )
  }
}

export const POST = withAuth(handlePost)
