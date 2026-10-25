// Admin-managed event phase, stored as a single JSON value in site_settings.
// "live" covers the time before and during the event, "post" locks the platform and shows the recap landing page.
export const EVENT_PHASE_SETTINGS_KEY = "event_phase"

export const EVENT_PHASES = ["live", "post"] as const
export type EventPhase = (typeof EVENT_PHASES)[number]

export interface LocalizedText {
  de: string
  en: string
}

export const POST_EVENT_STAT_KEYS = ["participants", "teams", "sponsors"] as const
type PostEventStatKey = (typeof POST_EVENT_STAT_KEYS)[number]
export type PostEventStats = Record<PostEventStatKey, number>

export interface EventPhoto {
  id: string
  caption: string | null
}

// Photos live in the private blob store and are streamed through this route.
// "thumbnail" is a small preview for grids and cards, "full" the compressed photo for enlarged views.
export function eventPhotoSrc(id: string, size: "full" | "thumbnail" = "full"): string {
  return size === "thumbnail" ? `/api/event-photo?id=${id}&size=thumbnail` : `/api/event-photo?id=${id}`
}

interface RankingTeam {
  id: string
  name: string
  description: string | null
  members: string[]
}

export interface LeaderboardPlacement extends RankingTeam {
  rank: number
}

// Teams are ranked per challenge. Teams without a challenge form one group per category (challenge_id null),
// which then uses the category's texts.
interface RankingGroupBase {
  challenge_id: string | null
  title: string | null
  title_en: string | null
  description: string | null
  description_en: string | null
  sponsor_names: string[]
  prize: string | null
  prize_en: string | null
  winner_photo_id: string | null
}

export interface LeaderboardGroup extends RankingGroupBase {
  placements: LeaderboardPlacement[]
}

// Admin view: every team of the group, plus the ranked ones in order
export interface AdminRankingGroup extends RankingGroupBase {
  teams: RankingTeam[]
  ranked_team_ids: string[]
}

interface RankingCategoryBase {
  id: string
  name: string
  name_en: string | null
  color: string | null
}

export interface LeaderboardCategory extends RankingCategoryBase {
  groups: LeaderboardGroup[]
}

export interface AdminRankingCategory extends RankingCategoryBase {
  groups: AdminRankingGroup[]
}

export function rankingGroupKey(categoryId: string, challengeId: string | null): string {
  return challengeId ?? `category:${categoryId}`
}

export interface EventPhaseConfig {
  phase: EventPhase
  hero: {
    date: LocalizedText
    heading: LocalizedText
    headingAccent: LocalizedText
    description: LocalizedText
  }
  // null = counted automatically from the database
  stats: Record<PostEventStatKey, number | null>
  leaderboard: {
    enabled: boolean
    badge: LocalizedText
    heading: LocalizedText
    description: LocalizedText
  }
  gallery: {
    enabled: boolean
    heading: LocalizedText
    description: LocalizedText
  }
  cta: {
    heading: LocalizedText
    description: LocalizedText
  }
}

export const DEFAULT_EVENT_PHASE: EventPhaseConfig = {
  phase: "live",
  hero: {
    date: { de: "23.–24. OKTOBER 2026 · HSLU ROTKREUZ", en: "23–24 OCTOBER 2026 · HSLU ROTKREUZ" },
    heading: { de: "Danke,", en: "Thank you," },
    headingAccent: { de: "Zentralschweiz!", en: "Central Switzerland!" },
    description: {
      de: "Zwei Tage voller Innovation, neuer Ideen und noch mehr neuer Freundschaften. Danke an alle Teilnehmenden, Mentor:innen, Partner und Sponsoren, die Zentral Hack 2026 zu dem gemacht haben, was es war.",
      en: "Two days full of innovation, new ideas and even more new friendships. Thank you to all participants, mentors, partners and sponsors who made Zentral Hack 2026 what it was."
    }
  },
  stats: { participants: null, teams: null, sponsors: null },
  leaderboard: {
    enabled: true,
    badge: { de: "ERGEBNISSE 2026", en: "RESULTS 2026" },
    heading: { de: "Die Sieger-Teams", en: "The Winning Teams" },
    description: {
      de: "Vier Kategorien, unzählige starke Pitches — das sind die Teams, die die Jury am meisten überzeugt haben.",
      en: "Four categories, countless strong pitches — these are the teams that convinced the jury most."
    }
  },
  gallery: {
    enabled: true,
    heading: { de: "Die Highlights", en: "The Highlights" },
    description: {
      de: "Fotos von zwei intensiven, inspirierenden Tagen.",
      en: "Photos from two intense, inspiring days."
    }
  },
  cta: {
    heading: { de: "Bis 2027!", en: "See you in 2027!" },
    description: {
      de: "Willst du erfahren, wenn die Anmeldung für die nächste Austragung öffnet? Folge uns, damit du es nicht verpasst.",
      en: "Want to know when registration for the next edition opens? Follow us so you don't miss it."
    }
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

function parseText(value: unknown, fallback: LocalizedText): LocalizedText {
  const raw = asRecord(value)
  return {
    de: typeof raw.de === "string" ? raw.de : fallback.de,
    en: typeof raw.en === "string" ? raw.en : fallback.en
  }
}

function parseStat(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null
}

export function parseEventPhaseConfig(value: unknown): EventPhaseConfig {
  const raw = asRecord(value)
  const hero = asRecord(raw.hero)
  const stats = asRecord(raw.stats)
  const leaderboard = asRecord(raw.leaderboard)
  const gallery = asRecord(raw.gallery)
  const cta = asRecord(raw.cta)
  const defaults = DEFAULT_EVENT_PHASE

  return {
    phase: EVENT_PHASES.includes(raw.phase as EventPhase) ? (raw.phase as EventPhase) : defaults.phase,
    hero: {
      date: parseText(hero.date, defaults.hero.date),
      heading: parseText(hero.heading, defaults.hero.heading),
      headingAccent: parseText(hero.headingAccent, defaults.hero.headingAccent),
      description: parseText(hero.description, defaults.hero.description)
    },
    stats: {
      participants: parseStat(stats.participants),
      teams: parseStat(stats.teams),
      sponsors: parseStat(stats.sponsors)
    },
    leaderboard: {
      enabled: typeof leaderboard.enabled === "boolean" ? leaderboard.enabled : defaults.leaderboard.enabled,
      badge: parseText(leaderboard.badge, defaults.leaderboard.badge),
      heading: parseText(leaderboard.heading, defaults.leaderboard.heading),
      description: parseText(leaderboard.description, defaults.leaderboard.description)
    },
    gallery: {
      enabled: typeof gallery.enabled === "boolean" ? gallery.enabled : defaults.gallery.enabled,
      heading: parseText(gallery.heading, defaults.gallery.heading),
      description: parseText(gallery.description, defaults.gallery.description)
    },
    cta: {
      heading: parseText(cta.heading, defaults.cta.heading),
      description: parseText(cta.description, defaults.cta.description)
    }
  }
}

// Falls back to the other language so a half-translated config never renders empty
export function localize(text: LocalizedText, language: "de" | "en"): string {
  return language === "en" ? text.en || text.de : text.de || text.en
}

// Response shown by the API while the platform is locked after the event
export const POST_EVENT_LOCKED_ERROR = "Zentral Hack 2026 is over. The platform is closed."

// Request header set by proxy.ts so server components can read the phase without another query
export const EVENT_PHASE_HEADER = "x-event-phase"
