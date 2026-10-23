import {
  CircleCheck,
  Clock,
  CloudLightning,
  Info,
  Megaphone,
  PartyPopper,
  TriangleAlert,
  Utensils,
  WifiOff,
  Zap,
  type LucideIcon
} from "lucide-react"

// Admin-managed alert banner, stored as a single JSON value in site_settings and shown on the user dashboard.
export const ALERT_BANNER_SETTINGS_KEY = "alert_banner"

// Icons are stored by name so the setting stays plain JSON
export const alertBannerIcons = {
  alert: TriangleAlert,
  info: Info,
  megaphone: Megaphone,
  clock: Clock,
  power: Zap,
  weather: CloudLightning,
  offline: WifiOff,
  food: Utensils,
  success: CircleCheck,
  party: PartyPopper
} satisfies Record<string, LucideIcon>

export type AlertBannerIcon = keyof typeof alertBannerIcons
export const ALERT_BANNER_ICONS = Object.keys(alertBannerIcons) as AlertBannerIcon[]

export const ALERT_BANNER_VARIANTS = ["red", "orange", "yellow", "green", "blue", "violet"] as const
export type AlertBannerVariant = (typeof ALERT_BANNER_VARIANTS)[number]

export interface AlertBannerConfig {
  enabled: boolean
  message: string
  messageEn: string
  variant: AlertBannerVariant
  icon: AlertBannerIcon
  // ISO timestamp after which the banner disappears automatically; null keeps it until disabled
  expiresAt: string | null
}

export const DEFAULT_ALERT_BANNER: AlertBannerConfig = {
  enabled: false,
  message: "",
  messageEn: "",
  variant: "red",
  icon: "alert",
  expiresAt: null
}

export const alertBannerVariantClasses: Record<AlertBannerVariant, string> = {
  red: "bg-red-700 text-white",
  orange: "bg-orange-500 text-white",
  yellow: "bg-yellow-300 text-neutral-950",
  green: "bg-green-700 text-white",
  blue: "bg-blue-700 text-white",
  violet: "bg-primary text-primary-foreground"
}

export function isAlertBannerActive(config: AlertBannerConfig | null, now = Date.now()): boolean {
  if (!config?.enabled) return false
  if (!config.message.trim() && !config.messageEn.trim()) return false
  if (config.expiresAt && new Date(config.expiresAt).getTime() <= now) return false
  return true
}

export function parseAlertBannerConfig(value: unknown): AlertBannerConfig {
  if (!value || typeof value !== "object") return DEFAULT_ALERT_BANNER
  const raw = value as Partial<AlertBannerConfig>
  return {
    enabled: raw.enabled === true,
    message: typeof raw.message === "string" ? raw.message : "",
    messageEn: typeof raw.messageEn === "string" ? raw.messageEn : "",
    variant: ALERT_BANNER_VARIANTS.includes(raw.variant as AlertBannerVariant)
      ? (raw.variant as AlertBannerVariant)
      : DEFAULT_ALERT_BANNER.variant,
    icon: ALERT_BANNER_ICONS.includes(raw.icon as AlertBannerIcon)
      ? (raw.icon as AlertBannerIcon)
      : DEFAULT_ALERT_BANNER.icon,
    expiresAt: typeof raw.expiresAt === "string" && raw.expiresAt ? raw.expiresAt : null
  }
}
