"use client"

import Link from "next/link"
import { Info } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

const copy = {
  de: {
    notice: "Diese Inhalte erscheinen nur auf der Startseite der Phase „Vor / während Event“.",
    link: "Event-Phase verwalten"
  },
  en: {
    notice: "This content only appears on the homepage during the “Before / during event” phase.",
    link: "Manage event phase"
  }
} as const

// Shown on admin pages whose content is only used by the live-event homepage
export function LivePhaseNotice() {
  const { language } = useLanguage()
  const text = copy[language]

  return (
    <p className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <Info className="h-4 w-4 shrink-0" />
      {text.notice}
      <Link href="/admin/event-phase" className="text-violet font-medium hover:underline">
        {text.link}
      </Link>
    </p>
  )
}
