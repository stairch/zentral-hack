"use client"

import { useEffect, useState, type CSSProperties } from "react"
import { motion } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { normalizeHexColor, getContrastForegroundColor } from "@/lib/helpers"

interface LeaderboardEntry {
  id: string
  name: string
  rank: number
  category_id: string
  category_name: string
  category_color: string | null
}

interface CategoryOption {
  id: string
  name: string
  color: string | null
  display_order: number
}

const copy = {
  de: {
    badge: "ERGEBNISSE 2026",
    heading: "Die Sieger-Teams",
    description:
      "Vier Kategorien, unzählige starke Pitches — das sind die Teams, die die Jury am meisten überzeugt haben.",
    empty: "Platzierungen folgen in Kürze."
  },
  en: {
    badge: "RESULTS 2026",
    heading: "The Winning Teams",
    description:
      "Four categories, countless strong pitches — these are the teams that convinced the jury most.",
    empty: "Placements coming soon."
  }
} as const

function hexToRgb(hex: string) {
  const normalized = normalizeHexColor(hex).replace("#", "")
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16)
  }
}

function tintTowardsWhite(hex: string, ratio: number): string {
  const { r, g, b } = hexToRgb(hex)
  const mix = (channel: number) => Math.round(channel + (255 - channel) * ratio)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

function categoryHeaderStyle(color: string | null) {
  if (!color) return undefined
  const normalized = normalizeHexColor(color)
  return { backgroundColor: normalized, color: getContrastForegroundColor(normalized) }
}

function rankBadgeStyle(rank: number, color: string | null): CSSProperties {
  if (!color) {
    if (rank === 1) return { backgroundColor: "var(--yellow)", color: "var(--violet)" }
    if (rank === 2) return { backgroundColor: "var(--light-violet)", color: "var(--violet)" }
    return { backgroundColor: "transparent", color: "var(--violet)", border: "2px solid var(--violet)" }
  }
  const normalized = normalizeHexColor(color)
  if (rank === 1) return { backgroundColor: normalized, color: getContrastForegroundColor(normalized) }
  if (rank === 2) {
    const tint = tintTowardsWhite(normalized, 0.4)
    return { backgroundColor: tint, color: normalized }
  }
  const tint = tintTowardsWhite(normalized, 0.8)
  return { backgroundColor: tint, color: normalized, border: `2px solid ${normalized}` }
}

export function LeaderboardSection() {
  const { language } = useLanguage()
  const text = copy[language]
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch("/api/categories").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/post-event").then((r) => (r.ok ? r.json() : null))
    ])
      .then(([catJson, eventJson]) => {
        if (cancelled) return
        setCategories(catJson?.data?.categories || [])
        setEntries(eventJson?.data?.leaderboard || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order)

  return (
    <section className="bg-violet py-24">
      <div className="container mx-auto px-4">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}>
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white">
            {text.badge}
          </span>
          <h2 className="font-display mb-4 text-4xl font-bold text-white uppercase md:text-5xl">
            {text.heading}
          </h2>
          <p className="text-light-violet mx-auto max-w-2xl text-lg leading-relaxed">{text.description}</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {sortedCategories.map((category, index) => {
            const placements = entries
              .filter((entry) => entry.category_id === category.id)
              .sort((a, b) => a.rank - b.rank)

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="overflow-hidden rounded-2xl bg-white shadow-lg">
                <div className="px-5 py-4" style={categoryHeaderStyle(category.color)}>
                  <span className="font-display text-sm font-bold tracking-wide uppercase">
                    {category.name}
                  </span>
                </div>
                <div className="flex flex-col gap-3 p-5">
                  {placements.length > 0 ? (
                    placements.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3">
                        <span
                          className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                          style={rankBadgeStyle(entry.rank, category.color)}>
                          {entry.rank}
                        </span>
                        <span className="text-foreground text-sm font-semibold">{entry.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground py-2 text-sm">{text.empty}</p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
