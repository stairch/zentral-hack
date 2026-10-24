"use client"

import { useState, type CSSProperties } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Trophy } from "lucide-react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { normalizeHexColor, getContrastForegroundColor } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import {
  eventPhotoSrc,
  localize,
  rankingGroupKey,
  type EventPhaseConfig,
  type LeaderboardCategory,
  type LeaderboardGroup,
  type LeaderboardPlacement
} from "@/lib/event-phase"

const copy = {
  de: {
    empty: "Platzierungen folgen in Kürze.",
    more: "Mehr erfahren",
    categoryRanking: "Kategorie-Wertung",
    withoutChallenge: "Weitere Teams",
    winnerPhoto: (challenge: string) => `Sieger-Team der Challenge ${challenge}`,
    sponsor: "Partner",
    prize: "Preis",
    placements: "Platzierungen"
  },
  en: {
    empty: "Placements coming soon.",
    more: "Learn more",
    categoryRanking: "Category ranking",
    withoutChallenge: "Other teams",
    winnerPhoto: (challenge: string) => `Winning team of the ${challenge} challenge`,
    sponsor: "Partner",
    prize: "Prize",
    placements: "Placements"
  }
} as const

type Language = "de" | "en"

function pick(de: string | null, en: string | null, language: Language): string | null {
  return (language === "en" ? en || de : de || en)?.trim() || null
}

function categoryName(category: LeaderboardCategory, language: Language): string {
  return pick(category.name, category.name_en, language) || category.name
}

function groupTitle(group: LeaderboardGroup, isOnlyGroup: boolean, language: Language): string {
  const text = copy[language]
  return (
    pick(group.title, group.title_en, language) ||
    (isOnlyGroup ? text.categoryRanking : text.withoutChallenge)
  )
}

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

// Same as --violet, the background of the results section
const SECTION_BACKGROUND = "#530a5d"
const SIMILAR_COLOR_DISTANCE = 60

// A category color (almost) matching the section background needs a border to stay visible
function blendsIntoSection(color: string | null): boolean {
  if (!color) return false
  const a = hexToRgb(color)
  const b = hexToRgb(SECTION_BACKGROUND)
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b) < SIMILAR_COLOR_DISTANCE
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

function RankBadge({ rank, color }: { rank: number; color: string | null }) {
  return (
    <span
      className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={rankBadgeStyle(rank, color)}>
      {rank}
    </span>
  )
}

interface SelectedGroup {
  category: LeaderboardCategory
  group: LeaderboardGroup
}

function ChallengeCard({
  category,
  group,
  index,
  onOpen
}: {
  category: LeaderboardCategory
  group: LeaderboardGroup
  index: number
  onOpen: () => void
}) {
  const { language } = useLanguage()
  const text = copy[language]
  const title = groupTitle(group, category.groups.length === 1, language)

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group focus-visible:ring-yellow flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white text-left shadow-lg transition-shadow hover:shadow-2xl focus-visible:ring-4 focus-visible:outline-none">
      {group.winner_photo_id && (
        <div className="overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={eventPhotoSrc(group.winner_photo_id, "thumbnail")}
            alt={text.winnerPhoto(title)}
            className="aspect-video w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="font-display text-foreground text-lg leading-tight font-bold">{title}</p>
          {group.sponsor_name && <p className="text-muted-foreground mt-1 text-xs">{group.sponsor_name}</p>}
        </div>
        {group.placements.length > 0 ? (
          <div className="flex flex-col gap-3">
            {group.placements.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3">
                <RankBadge rank={entry.rank} color={category.color} />
                <div className="min-w-0 pt-1">
                  <p className="text-foreground text-sm font-semibold">{entry.name}</p>
                  {entry.members.length > 0 && (
                    <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                      {entry.members.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{text.empty}</p>
        )}
      </div>
      <div className="text-violet flex items-center gap-2 px-5 pb-5 text-sm font-bold">
        {text.more}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </motion.button>
  )
}

function ChallengeDetailDialog({
  selected,
  onClose
}: {
  selected: SelectedGroup | null
  onClose: () => void
}) {
  const { language } = useLanguage()
  const text = copy[language]

  if (!selected) return <Dialog open={false} />

  const { category, group } = selected
  const title = groupTitle(group, category.groups.length === 1, language)
  const description = pick(group.description, group.description_en, language)
  const prize = pick(group.prize, group.prize_en, language)
  const headerStyle = categoryHeaderStyle(category.color)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <VisuallyHidden>
        <DialogTitle>{title}</DialogTitle>
      </VisuallyHidden>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-2xl"
        closeButtonStyle={headerStyle ?? { color: "white" }}>
        <div className="max-h-[86vh] overflow-y-auto overscroll-contain">
          <div className="bg-violet px-6 pt-6 pb-5 text-white md:px-8" style={headerStyle}>
            <span className="font-display text-xs font-bold tracking-widest uppercase opacity-80">
              {categoryName(category, language)}
            </span>
            <h2 className="font-display mt-1 pr-8 text-3xl leading-tight font-bold md:text-4xl">{title}</h2>
          </div>

          {group.winner_photo_id && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={eventPhotoSrc(group.winner_photo_id)}
              alt={text.winnerPhoto(title)}
              className="aspect-video w-full object-cover"
            />
          )}

          <div className="space-y-6 px-6 py-6 md:px-8">
            {description && (
              <p className="text-muted-foreground text-base leading-relaxed whitespace-pre-line">
                {description}
              </p>
            )}

            {(group.sponsor_name || prize) && (
              <div className="flex flex-col gap-2">
                {group.sponsor_name && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      {text.sponsor}
                    </span>
                    <span className="text-sm font-medium">{group.sponsor_name}</span>
                  </div>
                )}
                {prize && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      {text.prize}
                    </span>
                    <span className="text-sm font-medium">{prize}</span>
                  </div>
                )}
              </div>
            )}

            <div className="border-border border-t" />

            <div className="space-y-3">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {text.placements}
              </p>
              {group.placements.length > 0 ? (
                group.placements.map((entry) => (
                  <PlacementDetail key={entry.id} entry={entry} color={category.color} />
                ))
              ) : (
                <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-5 text-sm">
                  {text.empty}
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PlacementDetail({ entry, color }: { entry: LeaderboardPlacement; color: string | null }) {
  return (
    <div className="border-border flex gap-4 rounded-xl border p-4">
      <RankBadge rank={entry.rank} color={color} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-foreground font-semibold">{entry.name}</p>
          {entry.rank === 1 && <Trophy className="text-violet h-4 w-4" />}
        </div>
        {entry.description && (
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
            {entry.description}
          </p>
        )}
        {entry.members.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.members.map((member) => (
              <Badge key={member} variant="secondary">
                {member}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function LeaderboardSection({
  content,
  categories
}: {
  content: EventPhaseConfig["leaderboard"]
  categories: LeaderboardCategory[]
}) {
  const { language } = useLanguage()
  const text = copy[language]
  const [selected, setSelected] = useState<SelectedGroup | null>(null)

  return (
    <section id="results" className="bg-violet py-24">
      <div className="container mx-auto px-4">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}>
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white">
            {localize(content.badge, language)}
          </span>
          <h2 className="font-display mb-4 text-4xl font-bold text-white uppercase md:text-5xl">
            {localize(content.heading, language)}
          </h2>
          <p className="text-light-violet mx-auto max-w-2xl text-lg leading-relaxed">
            {localize(content.description, language)}
          </p>
        </motion.div>

        <div className="flex flex-col gap-14">
          {categories.map((category) => (
            <div key={category.id}>
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5 }}>
                <span
                  className={cn(
                    "font-display text-violet inline-block rounded-full bg-white px-5 py-2 text-sm font-bold tracking-wide uppercase",
                    blendsIntoSection(category.color) && "border-light-violet border-2"
                  )}
                  style={categoryHeaderStyle(category.color)}>
                  {categoryName(category, language)}
                </span>
              </motion.div>
              {category.groups.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {category.groups.map((group, index) => (
                    <ChallengeCard
                      key={rankingGroupKey(category.id, group.challenge_id)}
                      category={category}
                      group={group}
                      index={index}
                      onOpen={() => setSelected({ category, group })}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-light-violet text-sm">{text.empty}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <ChallengeDetailDialog selected={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
