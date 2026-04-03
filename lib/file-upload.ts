import { randomUUID } from 'crypto';
import path from 'path';

// Define allowed file types and their restrictions
export const ALLOWED_FILE_TYPES = {
  document: {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  image: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  spreadsheet: {
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
    extensions: ['.xlsx', '.csv'],
    maxSize: 20 * 1024 * 1024, // 20MB
  },
};

/**
 * Validate file upload based on type
 */
export function validateFileUpload(
  file: { name: string; size: number; type: string },
  allowedType: keyof typeof ALLOWED_FILE_TYPES
): { valid: boolean; error?: string } {
  const config = ALLOWED_FILE_TYPES[allowedType];

  // Check MIME type
  if (!config.mimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${config.mimeTypes.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > config.maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${Math.round(config.maxSize / 1024 / 1024)}MB`,
    };
  }

  // Check file extension (double-check for spoofed MIME types)
  const ext = path.extname(file.name).toLowerCase();
  if (!config.extensions.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${config.extensions.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Generate a secure filename
 */
export function generateSecureFilename(originalFilename: string): string {
  // Extract extension safely
  const ext = path.extname(originalFilename).toLowerCase();
  
  // Generate unique ID
  const uniqueId = randomUUID();
  
  // Combine: timestamp-uuid.extension
  const timestamp = Date.now();
  return `${timestamp}-${uniqueId}${ext}`;
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components
  const basename = path.basename(filename);
  
  // Remove special characters except dots and dashes
  return basename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^[\s.]+/, '') // Remove leading spaces and dots
    .substring(0, 255); // Limit length
}

/**
 * Validate category-specific file paths to prevent unauthorized access
 */
export function validateCategoryFilePath(categoryId: string, filePath: string): boolean {
  // Ensure path contains the category ID
  if (!filePath.includes(categoryId)) {
    return false;
  }
  
  // Prevent directory traversal attempts
  if (filePath.includes('..')) {
    return false;
  }
  
  return true;
}
