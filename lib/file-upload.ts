// Shared by the API routes and the browser (client uploads validate before sending), so no Node imports here

// Define allowed file types and their restrictions
export const ALLOWED_FILE_TYPES = {
  document: {
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/zip",
      "application/x-zip-compressed",
      "application/x-zip"
    ],
    extensions: [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip"],
    maxSize: 20 * 1024 * 1024 // 20MB
  },
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  spreadsheet: {
    mimeTypes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"],
    extensions: [".xlsx", ".csv"],
    maxSize: 20 * 1024 * 1024 // 20MB
  }
}

export type FileKind = keyof typeof ALLOWED_FILE_TYPES

/**
 * Lowercased extension including the dot, "" if there is none (same semantics as path.extname)
 */
export function getFileExtension(filename: string): string {
  const basename = filename.slice(filename.lastIndexOf("/") + 1)
  const dot = basename.lastIndexOf(".")
  return dot > 0 ? basename.slice(dot).toLowerCase() : ""
}

/**
 * The first allowed kind whose extension matches the filename
 */
export function getKindForFilename(filename: string, kinds: FileKind[]): FileKind | null {
  const ext = getFileExtension(filename)
  return kinds.find((kind) => ALLOWED_FILE_TYPES[kind].extensions.includes(ext)) ?? null
}

/**
 * Validate file upload based on type
 */
export function validateFileUpload(
  file: { name: string; size: number; type: string },
  allowedType: FileKind
): { valid: boolean; error?: string } {
  const config = ALLOWED_FILE_TYPES[allowedType]

  // Check MIME type
  if (!config.mimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${config.mimeTypes.join(", ")}`
    }
  }

  // Check file size
  if (file.size > config.maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${Math.round(config.maxSize / 1024 / 1024)}MB`
    }
  }

  // Check file extension (double-check for spoofed MIME types)
  const ext = getFileExtension(file.name)
  if (!config.extensions.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${config.extensions.join(", ")}`
    }
  }

  return { valid: true }
}

/**
 * Generate a secure filename
 */
export function generateSecureFilename(originalFilename: string): string {
  // Extract extension safely
  const ext = getFileExtension(originalFilename)

  // Generate unique ID
  const uniqueId = crypto.randomUUID()

  // Combine: timestamp-uuid.extension
  const timestamp = Date.now()
  return `${timestamp}-${uniqueId}${ext}`
}

/**
 * Sanitize filename to prevent directory traversal
 */
// function sanitizeFilename(filename: string): string {
//   // Remove any path components
//   const basename = path.basename(filename)
//
//   // Remove special characters except dots and dashes
//   return basename
//     .replace(/[^a-zA-Z0-9._-]/g, "_")
//     .replace(/^[\s.]+/, "") // Remove leading spaces and dots
//     .substring(0, 255) // Limit length
// }

/**
 * Validate category-specific file paths to prevent unauthorized access
 */
// function validateCategoryFilePath(categoryId: string, filePath: string): boolean {
//   // Ensure path contains the category ID
//   if (!filePath.includes(categoryId)) {
//     return false
//   }
//
//   // Prevent directory traversal attempts
//   if (filePath.includes("..")) {
//     return false
//   }
//
//   return true
// }
