import { query } from "@/lib/db"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, serverError, validationError } from "@/lib/api"

async function handleGet() {
  try {
    const result = await query("SELECT key, value FROM site_settings ORDER BY key")
    return successResponse({ settings: result.rows })
  } catch {
    return serverError("Failed to load settings")
  }
}

async function handlePut(req: AuthenticatedRequest) {
  try {
    const { key, value } = await req.json()
    if (!key || value === undefined) {
      return validationError("key and value are required")
    }

    await query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    )

    return successResponse({ message: "Setting saved" })
  } catch {
    return serverError("Failed to save setting")
  }
}

export const GET = withAdminAuth(handleGet as Parameters<typeof withAdminAuth>[0])
export const PUT = withAdminAuth(handlePut)
