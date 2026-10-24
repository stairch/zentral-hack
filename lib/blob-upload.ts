import { head, del } from "@vercel/blob"
import { query } from "@/lib/db"
import { JWTPayload } from "@/lib/auth"
import { hasTeamAccess, isTeamSubmissionClosed } from "@/lib/team-access"
import { FileKind, getFileExtension, getKindForFilename, validateFileUpload } from "@/lib/file-upload"

// Files are uploaded from the browser straight to Vercel Blob, because Vercel functions reject
// request bodies over 4.5 MB. /api/uploads hands out the upload token, and the regular API routes
// then only receive the blob URL and check it again with verifyUploadedBlob before saving it.

export async function canManageChallenge(challengeId: string, user: Pick<JWTPayload, "role" | "categoryId">) {
  const result = await query("SELECT category_id FROM sponsor_challenges WHERE id = $1", [challengeId])
  if (result.rows.length === 0) return false
  if (user.role === "category_partner" && result.rows[0].category_id !== user.categoryId) return false
  return true
}

/**
 * File kinds the user may upload into a blob folder, or null if the folder is off limits.
 * Mirrors the permission checks of the routes that later store the file.
 */
export async function getAllowedKindsForFolder(folder: string, user: JWTPayload): Promise<FileKind[] | null> {
  const parts = folder.split("/")
  if (parts.some((part) => !part || part === "." || part === "..")) return null

  if (parts.length === 2 && (parts[0] === "teams" || parts[0] === "chat")) {
    const teamId = parts[1]
    if (!(await hasTeamAccess(teamId, user.userId, user.role, user.categoryId))) return null
    if (parts[0] === "chat") return ["image", "document"]
    if (await isTeamSubmissionClosed(teamId, user.role)) return null
    return ["document"]
  }

  if (parts[0] !== "documents") return null
  if (user.role !== "admin" && user.role !== "category_partner") return null

  if (parts.length === 2 && parts[1] === "global") {
    return user.role === "admin" ? ["document"] : null
  }
  if (parts.length === 3 && parts[1] === "categories") {
    return user.role === "admin" || user.categoryId === parts[2] ? ["document"] : null
  }
  if (parts.length === 3 && parts[1] === "challenges") {
    return (await canManageChallenge(parts[2], user)) ? ["document"] : null
  }
  return null
}

/**
 * Looks up a client-uploaded blob and makes sure it sits in the expected folder and is an allowed file.
 * Invalid blobs are deleted again. Size and type come from the blob store, not from the client.
 */
export async function verifyUploadedBlob(
  url: unknown,
  originalName: unknown,
  folder: string,
  kinds: FileKind[]
): Promise<
  | { valid: true; blob: { url: string; name: string; size: number; type: string } }
  | { valid: false; error: string }
> {
  if (
    typeof url !== "string" ||
    !url.startsWith("https://") ||
    typeof originalName !== "string" ||
    !originalName
  ) {
    return { valid: false, error: "File required" }
  }

  let blob
  try {
    blob = await head(url)
  } catch {
    return { valid: false, error: "File not found" }
  }

  if (!blob.pathname.startsWith(`${folder}/`) || blob.pathname.slice(folder.length + 1).includes("/")) {
    return { valid: false, error: "Invalid file location" }
  }

  const meta = { name: originalName, size: blob.size, type: blob.contentType }
  const kind = getKindForFilename(blob.pathname, kinds)
  const validation = kind ? validateFileUpload(meta, kind) : { valid: false, error: "Invalid file extension" }
  if (!validation.valid || getFileExtension(originalName) !== getFileExtension(blob.pathname)) {
    try {
      await del(blob.url)
    } catch (e) {
      console.warn("Blob deletion failed, continuing:", e)
    }
    return { valid: false, error: validation.error || "Invalid file extension" }
  }

  return { valid: true, blob: { url: blob.url, name: originalName, size: blob.size, type: blob.contentType } }
}
