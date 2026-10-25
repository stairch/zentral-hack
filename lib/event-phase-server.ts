import { query } from "@/lib/db"
import { sponsorNamesSql } from "@/lib/sponsor-challenge"
import {
  DEFAULT_EVENT_PHASE,
  EVENT_PHASE_SETTINGS_KEY,
  parseEventPhaseConfig,
  rankingGroupKey,
  type AdminRankingCategory,
  type AdminRankingGroup,
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

// All categories with their ranking groups (one per challenge, plus one for teams without a challenge)
export async function getRankingCategories(): Promise<AdminRankingCategory[]> {
  const [categoriesResult, challengesResult, teamsResult, photosResult] = await Promise.all([
    query(
      `SELECT id, name, name_en, color, description, description_en, prize, prize_en
       FROM categories
       ORDER BY display_order ASC, name ASC`
    ),
    query(
      `SELECT sc.id, sc.category_id, sc.challenge_title, sc.challenge_title_en,
              sc.short_description, sc.short_description_en, sc.prize,
              CASE WHEN cardinality(sc.sponsor_ids) = 0 AND sc.company_name IS NOT NULL
                THEN ARRAY[sc.company_name]
                ELSE ${sponsorNamesSql("sc")}
              END AS sponsor_names
       FROM sponsor_challenges sc
       WHERE sc.status = 'published' OR sc.id IN (SELECT challenge_id FROM teams WHERE challenge_id IS NOT NULL)
       ORDER BY COALESCE(sc.published_at, sc.updated_at) ASC, sc.created_at ASC`
    ),
    // 'leader' sorts before 'member', so team leaders come first
    query(
      `SELECT t.id, t.name, t.description, t.category_id, t.challenge_id, tr.rank,
              COALESCE(
                (SELECT array_agg(TRIM(CONCAT(u.first_name, ' ', u.last_name)) ORDER BY tm.role ASC, u.first_name)
                 FROM team_members tm
                 JOIN users u ON u.id = tm.user_id
                 WHERE tm.team_id = t.id),
                '{}'
              ) AS members
       FROM teams t
       LEFT JOIN team_rankings tr ON tr.team_id = t.id
       ORDER BY t.name ASC`
    ),
    query("SELECT id, category_id, challenge_id FROM event_photos WHERE category_id IS NOT NULL")
  ])

  const photoByGroup = new Map<string, string>(
    photosResult.rows.map((photo) => [rankingGroupKey(photo.category_id, photo.challenge_id), photo.id])
  )

  const buildGroup = (
    categoryId: string,
    challengeId: string | null,
    texts: Omit<AdminRankingGroup, "challenge_id" | "winner_photo_id" | "teams" | "ranked_team_ids">
  ): AdminRankingGroup => {
    const teams = teamsResult.rows.filter(
      (team) => team.category_id === categoryId && (team.challenge_id ?? null) === challengeId
    )
    return {
      challenge_id: challengeId,
      ...texts,
      winner_photo_id: photoByGroup.get(rankingGroupKey(categoryId, challengeId)) ?? null,
      teams: teams.map(({ id, name, description, members }) => ({ id, name, description, members })),
      ranked_team_ids: teams
        .filter((team) => team.rank != null)
        .sort((a, b) => a.rank - b.rank)
        .map((team) => team.id)
    }
  }

  return categoriesResult.rows.map((category) => {
    const challenges = challengesResult.rows.filter((challenge) => challenge.category_id === category.id)
    const groups = challenges.map((challenge) =>
      buildGroup(category.id, challenge.id, {
        title: challenge.challenge_title,
        title_en: challenge.challenge_title_en,
        description: challenge.short_description,
        description_en: challenge.short_description_en,
        sponsor_names: challenge.sponsor_names,
        prize: challenge.prize,
        prize_en: null
      })
    )

    const hasTeamsWithoutChallenge = teamsResult.rows.some(
      (team) => team.category_id === category.id && !team.challenge_id
    )
    if (challenges.length === 0 || hasTeamsWithoutChallenge) {
      groups.push(
        buildGroup(category.id, null, {
          title: null,
          title_en: null,
          description: category.description,
          description_en: category.description_en,
          sponsor_names: [],
          prize: category.prize,
          prize_en: category.prize_en
        })
      )
    }

    return { id: category.id, name: category.name, name_en: category.name_en, color: category.color, groups }
  })
}

// Public version: only ranked teams leave the server, groups without placements or photo are left out
function toLeaderboardCategories(categories: AdminRankingCategory[]): LeaderboardCategory[] {
  return categories.map(({ groups, ...category }) => ({
    ...category,
    groups: groups
      .map(({ teams, ranked_team_ids, ...group }) => ({
        ...group,
        placements: ranked_team_ids.map((teamId, index) => ({
          ...teams.find((team) => team.id === teamId)!,
          rank: index + 1
        }))
      }))
      .filter((group) => group.placements.length > 0 || group.winner_photo_id)
  }))
}

// Everything the post-event landing page needs, loaded once on the server
export async function getPostEventData(config: EventPhaseConfig): Promise<PostEventData> {
  const [autoStats, rankingCategories, photosResult] = await Promise.all([
    getAutomaticPostEventStats(),
    config.leaderboard.enabled ? getRankingCategories() : null,
    config.gallery.enabled
      ? query(
          "SELECT id, caption FROM event_photos WHERE category_id IS NULL ORDER BY display_order ASC, created_at ASC"
        )
      : null
  ])

  const categories = rankingCategories ? toLeaderboardCategories(rankingCategories) : []

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
