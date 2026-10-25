import {
  BarChart3,
  CalendarDays,
  HelpCircle,
  Image,
  Images,
  Megaphone,
  Sparkles,
  TriangleAlert,
  Trophy,
  type LucideIcon
} from "lucide-react"
import type { EventPhase, LocalizedText } from "@/lib/event-phase"

// Admin-facing names of the website modes. Internally they stay the event phases "live" and "post".
export const WEBSITE_MODE_LABELS: Record<EventPhase, LocalizedText> = {
  live: { de: "Live", en: "Live" },
  post: { de: "Rückblick", en: "Recap" }
}

export const WEBSITE_MODE_HREF = "/admin/website-mode"

export interface WebsiteContentSection {
  id: string
  href: string
  label: LocalizedText
  icon: LucideIcon
  permissionKey: string
}

// Content shown on the live homepage, shared by the sidebar and the website mode page
export const LIVE_CONTENT_SECTIONS: WebsiteContentSection[] = [
  {
    id: "about",
    href: "/admin/about",
    label: { de: "About Stats", en: "About Stats" },
    icon: BarChart3,
    permissionKey: "about"
  },
  {
    id: "schedule",
    href: "/admin/schedule",
    label: { de: "Zeitplan", en: "Schedule" },
    icon: CalendarDays,
    permissionKey: "schedule"
  },
  {
    id: "partner-logos",
    href: "/admin/partner-logos",
    label: { de: "Partner-Logos", en: "Partner Logos" },
    icon: Image,
    permissionKey: "partner-logos"
  },
  {
    id: "faqs",
    href: "/admin/faqs",
    label: { de: "FAQs", en: "FAQs" },
    icon: HelpCircle,
    permissionKey: "faqs"
  },
  {
    id: "alert-banner",
    href: "/admin/alert-banner",
    label: { de: "Alert Banner", en: "Alert Banner" },
    icon: TriangleAlert,
    permissionKey: "alert-banner"
  }
]

// Content of the recap homepage, all stored in the event phase config.
// The permission key stays "event-phase" so existing role setups keep working.
export const RECAP_CONTENT_SECTIONS: WebsiteContentSection[] = [
  {
    id: "recap-hero",
    href: "/admin/recap/hero",
    label: { de: "Hero", en: "Hero" },
    icon: Sparkles,
    permissionKey: "event-phase"
  },
  {
    id: "recap-stats",
    href: "/admin/recap/stats",
    label: { de: "Kennzahlen", en: "Key figures" },
    icon: BarChart3,
    permissionKey: "event-phase"
  },
  {
    id: "recap-leaderboard",
    href: "/admin/recap/leaderboard",
    label: { de: "Sieger-Teams", en: "Winning teams" },
    icon: Trophy,
    permissionKey: "event-phase"
  },
  {
    id: "recap-gallery",
    href: "/admin/recap/gallery",
    label: { de: "Galerie", en: "Gallery" },
    icon: Images,
    permissionKey: "event-phase"
  },
  // Same page and data as the live entry, the recap homepage shows the same co-organisers and partners
  {
    id: "recap-partner-logos",
    href: "/admin/partner-logos",
    label: { de: "Partner-Logos", en: "Partner Logos" },
    icon: Image,
    permissionKey: "partner-logos"
  },
  {
    id: "recap-cta",
    href: "/admin/recap/cta",
    label: { de: "Abschluss", en: "Closing" },
    icon: Megaphone,
    permissionKey: "event-phase"
  }
]
