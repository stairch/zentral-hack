import { upload } from "@vercel/blob/client"
import {
  ALLOWED_FILE_TYPES,
  FileKind,
  generateSecureFilename,
  getKindForFilename,
  validateFileUpload
} from "@/lib/file-upload"

/**
 * Uploads a file from the browser directly to Vercel Blob (bypasses the 4.5 MB function body limit).
 * Validates first, because errors from the token route only surface as a generic message.
 * Returns what the API routes expect to save the file: { url, name }.
 */
export async function uploadFileToBlob(file: File, folder: string, kinds: FileKind[]) {
  const kind = getKindForFilename(file.name, kinds)
  if (!kind) {
    const extensions = kinds.flatMap((k) => ALLOWED_FILE_TYPES[k].extensions)
    throw new Error(`Invalid file extension. Allowed: ${extensions.join(", ")}`)
  }

  const validation = validateFileUpload({ name: file.name, size: file.size, type: file.type }, kind)
  if (!validation.valid) throw new Error(validation.error)

  const blob = await upload(`${folder}/${generateSecureFilename(file.name)}`, file, {
    access: "private",
    handleUploadUrl: "/api/uploads",
    contentType: file.type
  })

  return { url: blob.url, name: file.name }
}
