import { query } from "@/lib/db"
import {
  DEFAULT_EVENT_PHASE,
  EVENT_PHASE_SETTINGS_KEY,
  parseEventPhaseConfig,
  type EventPhaseConfig,
  type EventPhoto,
  type LeaderboardCategory,
  type PostEventStats
} from "@/lib/event-phase"

// proxy.ts reads the phase on every request, so keep it in memory for a few seconds per instance
const CACHE_TTL_MS = 10_000
let cache: { config: EventPhaseConfig; expiresAt: number } | null = null

export async function getEventPhaseConfig(): Promise<EventPhaseConfig> {
  if (cache && cache.expiresAt > Date.now()) return cache.config

  try {
    const result = await query("SELECT value FROM site_settings WHERE key = $1", [EVENT_PHASE_SETTINGS_KEY])
    const config = parseEventPhaseConfig(result.rows[0]?.value)
    cache = { config, expiresAt: Date.now() + CACHE_TTL_MS }
    return config
  } catch (error) {
    console.error("[Event Phase] Failed to load setting:", error)
    return cache?.config ?? DEFAULT_EVENT_PHASE
  }
}

export async function isPostEventPhase(): Promise<boolean> {
  return (await getEventPhaseConfig()).phase === "post"
}

export function clearEventPhaseCache() {
  cache = null
}

export async function getAutomaticPostEventStats(): Promise<PostEventStats> {
  const [participantsResult, teamsResult, sponsorsResult] = await Promise.all([
    query(
      `SELECT COUNT(*)::integer AS count
       FROM registrations r
       JOIN users u ON u.id = r.user_id
       WHERE r.status != 'cancelled' AND u.role = 'user'`
    ),
    query("SELECT COUNT(*)::integer AS count FROM teams"),
    query(
      "SELECT COUNT(*)::integer AS count FROM sponsor_contacts WHERE status IN ('confirmed', 'published')"
    )
  ])

  return {
    participants: participantsResult.rows[0]?.count ?? 0,
    teams: teamsResult.rows[0]?.count ?? 0,
    sponsors: sponsorsResult.rows[0]?.count ?? 0
  }
}

interface PostEventData {
  stats: PostEventStats
  categories: LeaderboardCategory[]
  photos: EventPhoto[]
}

// Everything the post-event landing page needs, loaded once on the server
export async function getPostEventData(config: EventPhaseConfig): Promise<PostEventData> {
  const [autoStats, categoriesResult, rankingsResult, photosResult] = await Promise.all([
    getAutomaticPostEventStats(),
    config.leaderboard.enabled
      ? query("SELECT id, name, name_en, color FROM categories ORDER BY display_order ASC, name ASC")
      : null,
    config.leaderboard.enabled
      ? query(
          `SELECT t.id, t.name, tr.rank, t.category_id
           FROM team_rankings tr
           JOIN teams t ON t.id = tr.team_id
           WHERE tr.rank <= 3
           ORDER BY tr.rank ASC`
        )
      : null,
    config.gallery.enabled
      ? query("SELECT id, caption FROM event_photos ORDER BY display_order ASC, created_at ASC")
      : null
  ])

  const categories: LeaderboardCategory[] = (categoriesResult?.rows ?? []).map((category) => ({
    ...category,
    placements: (rankingsResult?.rows ?? [])
      .filter((entry) => entry.category_id === category.id)
      .map(({ id, name, rank }) => ({ id, name, rank }))
  }))

  return {
    stats: {
      participants: config.stats.participants ?? autoStats.participants,
      teams: config.stats.teams ?? autoStats.teams,
      sponsors: config.stats.sponsors ?? autoStats.sponsors
    },
    categories,
    photos: photosResult?.rows ?? []
  }
}
