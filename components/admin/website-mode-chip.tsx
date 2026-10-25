"use client"

import Link from "next/link"
import { Lock } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useWebsiteMode } from "@/components/admin/website-mode-context"
import { cn } from "@/lib/utils"
import { WEBSITE_MODE_HREF } from "@/components/admin/website-content-sections"

const copy = {
  de: { live: "Live", post: "Rückblick aktiv", title: "Website-Modus verwalten" },
  en: { live: "Live", post: "Recap active", title: "Manage website mode" }
} as const

// Permanent indicator of the current website mode. Recap stands out because it locks all non-admin logins.
export function WebsiteModeChip({ onNavigate }: { onNavigate?: () => void }) {
  const { language } = useLanguage()
  const { phase } = useWebsiteMode()
  const text = copy[language]
  const isPost = phase === "post"

  return (
    <Link
      href={WEBSITE_MODE_HREF}
      onClick={onNavigate}
      title={text.title}
      className={cn(
        "mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
        isPost
          ? "bg-destructive border-destructive hover:bg-destructive/90 text-white"
          : "border-green-600/30 bg-green-100 text-green-800 hover:bg-green-100/70"
      )}>
      {isPost ? (
        <Lock className="h-3 w-3 stroke-[2.5px]" />
      ) : (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
        </span>
      )}
      {isPost ? text.post : text.live}
    </Link>
  )
}
