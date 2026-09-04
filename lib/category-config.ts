import {
  Bot,
  Brain,
  Briefcase,
  Cpu,
  GraduationCap,
  Lightbulb,
  MapPin,
  Mountain,
  Sparkles,
  type LucideIcon
} from "lucide-react"
import { normalizeHexColor } from "./helpers"

export type CategoryIconName =
  | "sparkles"
  | "brain"
  | "graduation-cap"
  | "mountain"
  | "bot"
  | "cpu"
  | "briefcase"
  | "lightbulb"
  | "map-pin"

export interface CategoryRecord {
  id?: string
  name?: string | null
  name_en?: string | null
  slug: string
  description?: string | null
  description_en?: string | null
  partner_name?: string | null
  partner_name_en?: string | null
  color?: string | null
  icon?: string | null
  challenge_description?: string | null
  challenge_description_en?: string | null
  show_challenge_description?: boolean | null
  prize?: string | null
  prize_en?: string | null
  target_group?: string | null
  target_group_en?: string | null
  display_order?: number | null
  challenge_title?: string | null
  challenge_title_en?: string | null
  challenge_short_description?: string | null
  challenge_short_description_en?: string | null
  challenge_status?: string | null
  challenge_data?: Record<string, unknown> | null
  challenges?: Array<{
    id: string
    title: string | null
    title_en: string | null
    short_description: string | null
    short_description_en: string | null
    challenge_data: Record<string, unknown> | null
    difficulty: string | null
    team_size: string | null
    challenge_language: string | null
    company_name: string | null
    sponsor_name: string | null
    status: string | null
    updated_at: string | null
    prize: string | null
  }> | null
}

export const categoryIconMap: Record<CategoryIconName, LucideIcon> = {
  sparkles: Sparkles,
  brain: Brain,
  "graduation-cap": GraduationCap,
  mountain: Mountain,
  bot: Bot,
  cpu: Cpu,
  briefcase: Briefcase,
  lightbulb: Lightbulb,
  "map-pin": MapPin
}

export const categoryIconOptions: Array<{ value: CategoryIconName; label: string }> = [
  { value: "sparkles", label: "Sparkles" },
  { value: "brain", label: "Brain" },
  { value: "graduation-cap", label: "Graduation Cap" },
  { value: "mountain", label: "Mountain" },
  { value: "bot", label: "Bot" },
  { value: "cpu", label: "CPU" },
  { value: "briefcase", label: "Briefcase" },
  { value: "lightbulb", label: "Lightbulb" },
  { value: "map-pin", label: "Map Pin" }
]

export const categoryDisplayOrder = [
  "young-talents",
  "ai-agentic",
  "campus-challenge",
  "regional-impact"
] as const

const categoryDefaults: Record<
  string,
  {
    name: string
    description: string
    partnerName: string
    color: string
    icon: CategoryIconName
  }
> = {
  "young-talents": {
    name: "Young Talents",
    description:
      "Für den Nachwuchs der ICT-Branche. Zeige dein Können und sammle erste echte Hackathon-Erfahrung.",
    partnerName: "ICT Berufsbildung Zentralschweiz & UMB AG",
    color: "#E6FF17",
    icon: "sparkles"
  },
  "ai-agentic": {
    name: "AI Agentic",
    description:
      "Entwickle agentische KI-Lösungen, intelligente Automationen und neue Formen der Zusammenarbeit mit AI.",
    partnerName: "ICT Berufsbildung Zentralschweiz, Digital & AI Community & getAbstract",
    color: "#530A5D",
    icon: "brain"
  },
  "campus-challenge": {
    name: "Campus Challenge",
    description:
      "Eine Challenge für Studierende, in der akademische Perspektiven auf praktische Probleme treffen.",
    partnerName: "STAIR",
    color: "#D6C6FF",
    icon: "graduation-cap"
  },
  "regional-impact": {
    name: "Regional Impact",
    description:
      "Arbeite an Lösungen mit direktem Nutzen für die Zentralschweiz und ihre Unternehmen, Institutionen und Menschen.",
    partnerName: "SchwyzNext",
    color: "#7A1F83",
    icon: "mountain"
  }
}

const iconAliases: Record<string, CategoryIconName> = {
  "map-pin": "mountain",
  bot: "brain"
}

export function getReadableTextColor(backgroundHex: string): "#111111" | "#FFFFFF" {
  const normalized = normalizeHexColor(backgroundHex)
  const red = Number.parseInt(normalized.slice(1, 3), 16)
  const green = Number.parseInt(normalized.slice(3, 5), 16)
  const blue = Number.parseInt(normalized.slice(5, 7), 16)
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000

  return brightness > 155 ? "#111111" : "#FFFFFF"
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = normalizeHexColor(hex)
  const red = Number.parseInt(normalized.slice(1, 3), 16)
  const green = Number.parseInt(normalized.slice(3, 5), 16)
  const blue = Number.parseInt(normalized.slice(5, 7), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export function getCategoryFallback(slug: string) {
  return (
    categoryDefaults[slug] || {
      name: slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      description: "Neue Kategorie ohne hinterlegte Standardbeschreibung.",
      partnerName: "Partner folgt",
      color: "#530A5D",
      icon: "sparkles" as CategoryIconName
    }
  )
}

export function resolveCategoryIconName(icon?: string | null, slug?: string): CategoryIconName {
  if (icon && icon in categoryIconMap) {
    return icon as CategoryIconName
  }

  if (icon && icon in iconAliases) {
    return iconAliases[icon]
  }

  return getCategoryFallback(slug || "default").icon
}

export function getCategoryPresentation(category: CategoryRecord) {
  return getCategoryPresentationByLanguage(category, "de")
}

export function getCategoryPresentationByLanguage(category: CategoryRecord, language: "de" | "en") {
  const fallback = getCategoryFallback(category.slug)
  const color = normalizeHexColor(category.color || "")
  const iconName = resolveCategoryIconName(category.icon, category.slug)

  const localizedTitle =
    language === "en"
      ? (category.name_en || category.name || fallback.name).trim()
      : (category.name || fallback.name).trim()

  const localizedDescription =
    language === "en"
      ? (category.description_en || category.description || fallback.description).trim()
      : (category.description || fallback.description).trim()

  const localizedPartnerName =
    language === "en"
      ? (category.partner_name_en || category.partner_name || fallback.partnerName).trim()
      : (category.partner_name || fallback.partnerName).trim()

  const localizedChallengeDescription =
    language === "en"
      ? (
          category.challenge_short_description_en ||
          category.challenge_description_en ||
          category.challenge_short_description ||
          category.challenge_description ||
          ""
        ).trim()
      : (category.challenge_short_description || category.challenge_description || "").trim()

  const challengeTitle =
    language === "en"
      ? (category.challenge_title_en || category.challenge_title || localizedTitle).trim()
      : (category.challenge_title || localizedTitle).trim()

  const localizedPrize =
    language === "en" ? (category.prize_en || category.prize || "").trim() : (category.prize || "").trim()

  const publishedChallenges = Array.isArray(category.challenges) ? category.challenges : []

  return {
    id: category.id,
    slug: category.slug,
    displayOrder: typeof category.display_order === "number" ? category.display_order : 0,
    title: localizedTitle,
    challengeTitle,
    description: localizedDescription,
    partnerName: localizedPartnerName,
    color,
    textColor: getReadableTextColor(color),
    icon: categoryIconMap[iconName],
    iconName,
    challengeDescription: localizedChallengeDescription,
    showChallengeDescription: Boolean(category.show_challenge_description),
    challengeStatus: category.challenge_status || null,
    challengeData: category.challenge_data || null,
    challenges: publishedChallenges,
    prize: localizedPrize || null,
    targetGroup:
      language === "en"
        ? category.target_group_en || category.target_group || null
        : category.target_group || null
  }
}
