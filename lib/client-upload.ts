import { upload } from "@vercel/blob/client"
import {
  ALLOWED_FILE_TYPES,
  EVENT_PHOTO_UPLOAD_FOLDER,
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

/**
 * Uploads a gallery or winner photo. The original goes straight to Vercel Blob, the API route then
 * stores compressed versions and deletes it. Pass category_id (and challenge_id) for a winner photo.
 */
export async function uploadEventPhoto(
  file: File,
  fields: { caption?: string; category_id?: string; challenge_id?: string | null }
) {
  const { url, name } = await uploadFileToBlob(file, EVENT_PHOTO_UPLOAD_FOLDER, ["photo"])
  const res = await fetch("/api/admin/event-photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ url, name, ...fields })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Upload failed")
  return data.data.photo as { id: string; caption: string | null; display_order: number; created_at: string }
}
