"use client"

import Link from "next/link"
import { useUnseenChangelog } from "@/hooks/use-unseen-changelog"
import { useLanguage } from "@/lib/language-context"
import { Urls } from "@/lib/constants"
import { Rocket } from "lucide-react"

const copy = {
  de: {
    label: (version: string) => `Neuer Release verfügbar: v${version}`,
    link: "Zum Changelog"
  },
  en: {
    label: (version: string) => `New release available: v${version}`,
    link: "View Changelog"
  }
} as const

export function ChangelogBanner() {
  const { hasUnseen, latestEntry, isMinorOrMajor } = useUnseenChangelog()
  const { language } = useLanguage()

  if (!hasUnseen || !isMinorOrMajor || !latestEntry) return null

  const text = copy[language]

  return (
    <div className="flex items-center justify-center gap-2 border-y border-sky-200 bg-sky-100 px-4 py-2 text-sm font-medium text-sky-700">
      <Rocket className="h-4 w-4" />
      <span>{text.label(latestEntry.version.split(".").slice(0, 2).join("."))}</span>
      <Link
        href={Urls.changelog}
        className="ml-3 flex items-center gap-1 underline underline-offset-2 transition-opacity hover:opacity-80">
        {text.link}
      </Link>
    </div>
  )
}
