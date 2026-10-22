"use client"

import { useEffect, useState } from "react"
import { Loader2, Megaphone } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { normalizeHexColor, getContrastForegroundColor } from "@/lib/helpers"

interface Announcement {
  id: string
  title: string | null
  content: string
  created_at: string
  category_id: string | null
  category_name: string | null
  category_color: string | null
  first_name: string | null
  last_name: string | null
}

const copy = {
  de: { empty: "Noch keine Ankündigungen.", global: "Global" },
  en: { empty: "No announcements yet.", global: "Global" }
} as const

function bubbleStyle(categoryColor: string | null) {
  if (!categoryColor) return undefined
  const normalized = normalizeHexColor(categoryColor)
  return { backgroundColor: normalized, color: getContrastForegroundColor(normalized) }
}

export function AnnouncementsFeed() {
  const { language } = useLanguage()
  const t = copy[language]
  const dateLocale = language === "en" ? "en-GB" : "de-CH"

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch("/api/announcements", { credentials: "include" })
        if (!res.ok || cancelled) return
        const json = await res.json()
        if (!cancelled) setAnnouncements(json.data?.announcements || [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    const interval = setInterval(load, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-violet h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full space-y-3 overflow-y-auto p-4">
      {announcements.length === 0 && (
        <p className="text-muted-foreground py-8 text-center text-sm">{t.empty}</p>
      )}
      {announcements.map((a) => (
        <div
          key={a.id}
          className={`max-w-[90%] space-y-1 rounded-2xl px-3 py-2 ${!a.category_color ? "bg-yellow text-violet" : ""}`}
          style={bubbleStyle(a.category_color)}>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Megaphone className="h-3 w-3" />
            {a.category_name || t.global}
          </div>
          {a.title && <p className="text-sm font-semibold">{a.title}</p>}
          <p className="text-sm whitespace-pre-wrap">{a.content}</p>
          <p className="text-[11px] opacity-70">{new Date(a.created_at).toLocaleString(dateLocale)}</p>
        </div>
      ))}
    </div>
  )
}
