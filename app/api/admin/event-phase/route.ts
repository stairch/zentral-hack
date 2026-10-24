import { query } from "@/lib/db"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, serverError, validationError } from "@/lib/api"
import { EVENT_PHASE_SETTINGS_KEY, parseEventPhaseConfig } from "@/lib/event-phase"
import { clearEventPhaseCache, getAutomaticPostEventStats } from "@/lib/event-phase-server"

async function handleGet() {
  try {
    const [settingResult, autoStats] = await Promise.all([
      query("SELECT value FROM site_settings WHERE key = $1", [EVENT_PHASE_SETTINGS_KEY]),
      getAutomaticPostEventStats()
    ])
    return successResponse({ config: parseEventPhaseConfig(settingResult.rows[0]?.value), autoStats })
  } catch (error) {
    console.error("[Event Phase] GET Error:", error)
    return serverError()
  }
}

async function handlePut(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    if (!body || typeof body !== "object") return validationError("config required")

    // Unknown or malformed fields are dropped, so only a well-formed config is stored
    const config = parseEventPhaseConfig(body)

    await query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
      [EVENT_PHASE_SETTINGS_KEY, JSON.stringify(config)]
    )
    clearEventPhaseCache()

    return successResponse({ config })
  } catch (error) {
    console.error("[Event Phase] PUT Error:", error)
    return serverError()
  }
}

export const GET = withAdminAuth(handleGet as Parameters<typeof withAdminAuth>[0])
export const PUT = withAdminAuth(handlePut)
