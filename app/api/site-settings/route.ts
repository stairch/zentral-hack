import { query } from "@/lib/db"
import { successResponse, serverError } from "@/lib/api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key) {
      const result = await query("SELECT value FROM site_settings WHERE key = $1", [key])
      const value = result.rows[0]?.value ?? null
      return successResponse({ value })
    }

    const result = await query("SELECT key, value FROM site_settings ORDER BY key")
    return successResponse({ settings: result.rows })
  } catch {
    return serverError("Failed to load settings")
  }
}
