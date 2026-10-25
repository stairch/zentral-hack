"use client"

import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useWebsiteMode } from "@/components/admin/website-mode-context"
import { cn } from "@/lib/utils"
import type { EventPhase } from "@/lib/event-phase"
import { WEBSITE_MODE_HREF } from "@/components/admin/website-content-sections"

const copy = {
  de: {
    visible: "Sichtbar",
    hidden: "Aktuell nicht sichtbar",
    visibleIn: {
      live: "Live-Modus ist aktiv. Änderungen sind sofort auf der Startseite sichtbar.",
      post: "Rückblick-Modus ist aktiv. Änderungen sind sofort auf der Startseite sichtbar.",
      both: "Wird im Live- und im Rückblick-Modus angezeigt. Änderungen sind sofort auf der Startseite sichtbar."
    },
    hiddenUntil: {
      live: "Erscheint, sobald der Live-Modus wieder aktiv ist.",
      post: "Erscheint, sobald der Rückblick-Modus aktiv ist."
    },
    link: "Website-Modus verwalten"
  },
  en: {
    visible: "Visible",
    hidden: "Currently not visible",
    visibleIn: {
      live: "Live mode is active. Changes are visible on the homepage immediately.",
      post: "Recap mode is active. Changes are visible on the homepage immediately.",
      both: "Shown in live and recap mode. Changes are visible on the homepage immediately."
    },
    hiddenUntil: {
      live: "Appears as soon as live mode is active again.",
      post: "Appears as soon as recap mode is active."
    },
    link: "Manage website mode"
  }
} as const

// Tells admins whether the content of a page is currently shown on the homepage.
// shownIn: the website mode(s) in which the homepage renders this content.
export function ContentVisibilityNotice({
  shownIn,
  className
}: {
  shownIn: EventPhase | "both"
  className?: string
}) {
  const { language } = useLanguage()
  const { phase } = useWebsiteMode()
  const text = copy[language]

  const visible = shownIn === "both" || shownIn === phase
  const Icon = visible ? Eye : EyeOff
  const message = visible
    ? text.visibleIn[shownIn === "both" ? "both" : phase]
    : text.hiddenUntil[shownIn as EventPhase]

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border px-4 py-3 text-sm",
        visible
          ? "border-green-600/30 bg-green-100 text-green-800"
          : "bg-muted text-muted-foreground border-border",
        className
      )}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <span className="font-semibold">{visible ? text.visible : text.hidden}</span>
        {" – "}
        {message}{" "}
        <Link href={WEBSITE_MODE_HREF} className="text-violet font-medium whitespace-nowrap hover:underline">
          {text.link}
        </Link>
      </p>
    </div>
  )
}
