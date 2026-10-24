import { query } from "@/lib/db"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, serverError, validationError } from "@/lib/api"
import {
  EVENT_PHASES,
  EVENT_PHASE_SETTINGS_KEY,
  parseEventPhaseConfig,
  type EventPhase,
  type EventPhaseConfig
} from "@/lib/event-phase"
import { clearEventPhaseCache, getAutomaticPostEventStats } from "@/lib/event-phase-server"

async function loadStoredConfig(): Promise<EventPhaseConfig> {
  const result = await query("SELECT value FROM site_settings WHERE key = $1", [EVENT_PHASE_SETTINGS_KEY])
  return parseEventPhaseConfig(result.rows[0]?.value)
}

async function storeConfig(config: EventPhaseConfig) {
  await query(
    `INSERT INTO site_settings (key, value, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
    [EVENT_PHASE_SETTINGS_KEY, JSON.stringify(config)]
  )
  clearEventPhaseCache()
}

async function handleGet() {
  try {
    const [config, autoStats] = await Promise.all([loadStoredConfig(), getAutomaticPostEventStats()])
    return successResponse({ config, autoStats })
  } catch (error) {
    console.error("[Event Phase] GET Error:", error)
    return serverError()
  }
}

// Saves the homepage content only, the live phase is switched separately via PATCH
async function handlePut(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    if (!body || typeof body !== "object") return validationError("config required")

    // Unknown or malformed fields are dropped, so only a well-formed config is stored
    const stored = await loadStoredConfig()
    const config = { ...parseEventPhaseConfig(body), phase: stored.phase }
    await storeConfig(config)

    return successResponse({ config })
  } catch (error) {
    console.error("[Event Phase] PUT Error:", error)
    return serverError()
  }
}

// Publishes (or reverts) the phase without touching the content
async function handlePatch(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const phase = body?.phase as EventPhase
    if (!EVENT_PHASES.includes(phase)) return validationError("valid phase required")

    const config = { ...(await loadStoredConfig()), phase }
    await storeConfig(config)

    return successResponse({ config })
  } catch (error) {
    console.error("[Event Phase] PATCH Error:", error)
    return serverError()
  }
}

export const GET = withAdminAuth(handleGet as Parameters<typeof withAdminAuth>[0])
export const PUT = withAdminAuth(handlePut)
export const PATCH = withAdminAuth(handlePatch)
