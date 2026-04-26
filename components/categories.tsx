"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, useInView, useMotionValue, useSpring } from "framer-motion"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowRight, Trophy } from "lucide-react"
import {
  categoryDisplayOrder,
  getCategoryPresentationByLanguage,
  type CategoryRecord
} from "@/lib/category-config"
import { useLanguage } from "@/lib/language-context"

interface DisplayCategory {
  id?: string
  slug: string
  title: string
  challengeTitle: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  textColor: string
  partnerName: string
  challengeDescription: string
  challengeStatus: string | null
  challengeData: Record<string, unknown> | null
  prize: string | null
  targetGroup: string | null
  challenges: Array<{
    id: string
    title: string | null
    short_description: string | null
    challenge_data: Record<string, unknown> | null
    difficulty: string | null
    team_size: string | null
    challenge_language: string | null
    company_name: string | null
    status: string | null
    updated_at: string | null
    prize: string | null
  }>
}

function CategoryCard({
  category,
  index,
  onOpen,
  partnerLabel,
  detailsLabel
}: {
  category: DisplayCategory
  index: number
  onOpen: () => void
  partnerLabel: string
  detailsLabel: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springConfig = { stiffness: 150, damping: 20, mass: 0.2 }
  const xSpring = useSpring(x, springConfig)
  const ySpring = useSpring(y, springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.05)
    y.set((e.clientY - centerY) * 0.05)
  }

  const cardStyle = { x: xSpring, y: ySpring, backgroundColor: category.color, color: category.textColor }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl p-8"
      style={cardStyle}
      onClick={onOpen}
      role="button"
      tabIndex={0}>
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, currentColor 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 mb-6 w-fit">
        <category.icon className="h-12 w-12" />
      </div>

      <div className="relative z-10">
        <h3 className="font-display mb-3 text-2xl font-bold">{category.title}</h3>
        <p className="mb-4 leading-relaxed opacity-90">{category.description}</p>
        <p className="text-sm opacity-70">
          {partnerLabel}: {category.partnerName}
        </p>
        <p className="mt-4 text-xs opacity-70">{detailsLabel}</p>
      </div>

      <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </motion.div>
  )
}

export function Categories() {
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true })
  const [displayCategories, setDisplayCategories] = useState<DisplayCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<DisplayCategory | null>(null)
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("")
  const [isChallengeBrowserOpen, setIsChallengeBrowserOpen] = useState(false)
  const { language } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initializedFromUrl = useRef(false)

  const copy = {
    de: {
      badge: "CHALLENGES",
      heading: "WÄHLE DEINE",
      headingAccent: "KATEGORIE",
      description:
        "Vier spannende Kategorien warten auf dich. Finde deine Passion und löse Challenges, die einen echten Unterschied machen.",
      partner: "Partner",
      clickDetails: "Klicken für Details",
      register: "Jetzt registrieren",
      challengeOverview: "Challenge-Übersicht",
      noChallengeAvailable: "Für diese Kategorie sind aktuell noch keine Challenges veröffentlicht.",
      backToOverview: "Zurück",
      viewAvailableChallenges: "Alle Challenges",
      challengesAvailable: (n: number) => `${n} Challenge${n !== 1 ? "s" : ""} verfügbar`,
      prize: "Preisgeld",
      targetGroup: "Zielgruppe",
      difficulty: "Schwierigkeit",
      teamSize: "Teamgrösse"
    },
    en: {
      badge: "CHALLENGES",
      heading: "CHOOSE YOUR",
      headingAccent: "CATEGORY",
      description:
        "Four exciting categories are waiting for you. Find your passion and solve challenges that make a real impact.",
      partner: "Partner",
      clickDetails: "Click for details",
      register: "Register now",
      challengeOverview: "Challenge overview",
      noChallengeAvailable: "There are no published challenges available for this category yet.",
      backToOverview: "Back",
      viewAvailableChallenges: "All challenges",
      challengesAvailable: (n: number) => `${n} challenge${n !== 1 ? "s" : ""} available`,
      prize: "Prize",
      targetGroup: "Target audience",
      difficulty: "Difficulty",
      teamSize: "Team size"
    }
  } as const

  const text = copy[language]

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories")
        if (!res.ok) return

        const data = await res.json()
        const dbCategories: CategoryRecord[] = data.data?.categories || []

        const orderedSlugs = Array.from(
          new Set([...categoryDisplayOrder, ...dbCategories.map((category) => category.slug)])
        )

        const merged = orderedSlugs.map((slug) => {
          const dbCategory = dbCategories.find((category) => category.slug === slug)
          return getCategoryPresentationByLanguage(dbCategory || { slug }, language)
        })

        setDisplayCategories(merged)
      } catch {
        setDisplayCategories(
          categoryDisplayOrder.map((slug) => getCategoryPresentationByLanguage({ slug }, language))
        )
      }
    }

    fetchCategories()
  }, [language])

  useEffect(() => {
    if (initializedFromUrl.current || displayCategories.length === 0) return
    initializedFromUrl.current = true
    const slug = searchParams.get("category")
    if (!slug) return
    const cat = displayCategories.find((c) => c.slug === slug)
    if (cat) {
      setSelectedCategory(cat)
      setSelectedChallengeId(cat.challenges?.[0]?.id || "")
    }
  }, [displayCategories, searchParams])

  const closeDialog = () => {
    setSelectedCategory(null)
    setSelectedChallengeId("")
    setIsChallengeBrowserOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("category")
    const newSearch = params.toString()
    router.replace(newSearch ? `?${newSearch}` : window.location.pathname, { scroll: false })
  }

  const availableChallenges = selectedCategory?.challenges || []
  const selectedChallenge = useMemo(() => {
    if (!selectedCategory) return null
    if (availableChallenges.length === 0) return null
    return (
      availableChallenges.find((challenge) => challenge.id === selectedChallengeId) ||
      availableChallenges[0] ||
      null
    )
  }, [selectedCategory, selectedChallengeId, availableChallenges])
  const selectedData = useMemo(() => (selectedChallenge?.challenge_data as any) || null, [selectedChallenge])
  const hasChallenge = Boolean(selectedChallenge)

  return (
    <section id="categories" className="bg-muted/30 py-24">
      <div className="container mx-auto px-4">
        <motion.div
          ref={headerRef}
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}>
          <motion.span
            className="bg-light-violet/30 text-violet mb-4 inline-block rounded-full px-4 py-2 text-sm font-medium"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isHeaderInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}>
            {text.badge}
          </motion.span>
          <h2 className="font-display text-foreground mb-4 text-4xl font-bold md:text-5xl">
            {text.heading} <span className="text-violet">{text.headingAccent}</span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">{text.description}</p>
        </motion.div>

        {displayCategories.length > 0 ? (
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {displayCategories.map((category, index) => (
              <CategoryCard
                key={category.slug}
                category={category}
                index={index}
                onOpen={() => {
                  setSelectedCategory(category)
                  setSelectedChallengeId(category.challenges?.[0]?.id || "")
                  setIsChallengeBrowserOpen(false)
                  const params = new URLSearchParams(searchParams.toString())
                  params.set("category", category.slug)
                  router.replace(`?${params.toString()}`, { scroll: false })
                }}
                partnerLabel={text.partner}
                detailsLabel={text.clickDetails}
              />
            ))}
          </div>
        ) : (
          <div className="border-border bg-background/70 mx-auto max-w-2xl rounded-2xl border p-8 text-center">
            <p className="text-muted-foreground text-lg">Aktuell sind noch keine Kategorien verfügbar.</p>
          </div>
        )}

        <Dialog open={Boolean(selectedCategory)} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="h-[82vh] w-[92vw] max-w-none min-w-[360px] overflow-hidden border-0 p-0 sm:h-[86vh] sm:max-w-2xl sm:min-w-[600px]">
            {selectedCategory ? (
              <div className="relative h-full min-h-0 bg-gradient-to-br from-[#530A5D] via-[#6F177A] to-[#E6FF17] p-[1px]">
                <div className="bg-background relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2px]">
                  {!isChallengeBrowserOpen ? (
                    /* ── OVERVIEW ── */
                    <>
                      {/* Colored top accent */}
                      <div className="h-1 w-full shrink-0" style={{ background: selectedCategory.color }} />

                      {/* Scrollable body */}
                      <div className="flex-1 overflow-y-auto overscroll-contain px-6 pt-6 pb-4 md:px-8">
                        {/* Badge */}
                        <span
                          className="mb-4 inline-block rounded-full px-3 py-1 text-[11px] font-bold tracking-widest uppercase"
                          style={{
                            backgroundColor: selectedCategory.color + "18",
                            color: selectedCategory.color
                          }}>
                          {text.challengeOverview}
                        </span>

                        {/* Title */}
                        <h2 className="font-display mb-3 text-3xl leading-tight font-bold md:text-4xl">
                          {selectedCategory.title}
                        </h2>

                        {/* Description */}
                        <p className="text-muted-foreground mb-6 text-base leading-relaxed">
                          {selectedCategory.description}
                        </p>

                        {/* Partner + Target group */}
                        <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                              {text.partner}
                            </span>
                            <span className="text-sm font-medium">{selectedCategory.partnerName}</span>
                          </div>
                          {selectedCategory.targetGroup && (
                            <div className="flex items-baseline gap-2">
                              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                                {text.targetGroup}
                              </span>
                              <span className="text-sm font-medium">{selectedCategory.targetGroup}</span>
                            </div>
                          )}
                        </div>

                        {/* Category-level prize (only when no individual challenges) */}
                        {availableChallenges.length === 0 && selectedCategory.prize && (
                          <div
                            className="mb-5 rounded-2xl border p-4"
                            style={{
                              backgroundColor: selectedCategory.color + "0d",
                              borderColor: selectedCategory.color + "40"
                            }}>
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                                style={{ backgroundColor: selectedCategory.color + "20" }}>
                                <Trophy className="h-4 w-4" style={{ color: selectedCategory.color }} />
                              </div>
                              <div>
                                <p
                                  className="mb-0.5 text-[11px] font-bold tracking-widest uppercase"
                                  style={{ color: selectedCategory.color }}>
                                  {text.prize}
                                </p>
                                <p className="text-foreground text-lg font-bold">{selectedCategory.prize}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Divider */}
                        <div className="border-border mb-5 border-t" />

                        {/* Challenge list or empty state */}
                        {availableChallenges.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                              {text.challengesAvailable(availableChallenges.length)}
                            </p>
                            {availableChallenges.map((challenge) => (
                              <button
                                key={challenge.id}
                                type="button"
                                onClick={() => {
                                  setSelectedChallengeId(challenge.id)
                                  setIsChallengeBrowserOpen(true)
                                }}
                                className="border-border hover:border-opacity-60 group hover:bg-muted/40 flex w-full items-center justify-between rounded-xl border bg-transparent px-4 py-3.5 text-left transition-all"
                                style={{ ["--hover-border" as string]: selectedCategory.color }}>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold">{challenge.title}</p>
                                  {challenge.short_description && (
                                    <p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">
                                      {challenge.short_description}
                                    </p>
                                  )}
                                </div>
                                <ArrowRight
                                  className="text-muted-foreground ml-3 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
                                  style={{ color: selectedCategory.color }}
                                />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-5 text-sm">
                            {text.noChallengeAvailable}
                          </p>
                        )}
                      </div>

                      {/* Footer buttons */}
                      <div className="border-border shrink-0 border-t px-6 py-4 md:px-8">
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            disabled={availableChallenges.length === 0}
                            onClick={() => setIsChallengeBrowserOpen(true)}>
                            {text.viewAvailableChallenges}
                          </Button>
                          <Button
                            type="button"
                            className="flex-1 text-sm font-semibold"
                            style={{
                              backgroundColor: selectedCategory.color,
                              color: selectedCategory.textColor
                            }}
                            onClick={() => {
                              const categoryId = selectedCategory.id || selectedCategory.slug
                              window.location.href = `/anmeldung?category=${categoryId}`
                            }}>
                            {text.register}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* ── CHALLENGE BROWSER ── */
                    <>
                      {/* Header */}
                      <div className="border-border flex shrink-0 items-center justify-between border-b px-6 py-4 md:px-8">
                        <div>
                          <p
                            className="text-[11px] font-bold tracking-widest uppercase"
                            style={{ color: selectedCategory.color }}>
                            {selectedCategory.title}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground text-sm"
                          onClick={() => setIsChallengeBrowserOpen(false)}>
                          ← {text.backToOverview}
                        </Button>
                      </div>

                      {/* Challenge tabs (if multiple) */}
                      {availableChallenges.length > 1 && (
                        <div className="border-border flex shrink-0 gap-2 overflow-x-auto border-b px-6 py-3 md:px-8">
                          {availableChallenges.map((c) => {
                            const isActive = selectedChallenge?.id === c.id
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setSelectedChallengeId(c.id)}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
                                  isActive ? "" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                                style={
                                  isActive
                                    ? {
                                        backgroundColor: selectedCategory.color,
                                        color: selectedCategory.textColor
                                      }
                                    : {}
                                }>
                                {c.title}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {/* Article body */}
                      {hasChallenge ? (
                        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-7 md:px-8 md:py-8">
                          {/* Byline */}
                          {(selectedChallenge?.company_name ||
                            selectedChallenge?.difficulty ||
                            selectedChallenge?.team_size) && (
                            <div className="text-muted-foreground mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                              {selectedChallenge?.company_name && (
                                <span className="font-medium">{selectedChallenge.company_name}</span>
                              )}
                              {selectedChallenge?.difficulty && (
                                <>
                                  <span>·</span>
                                  <span>
                                    {text.difficulty}: {selectedChallenge.difficulty}
                                  </span>
                                </>
                              )}
                              {selectedChallenge?.team_size && (
                                <>
                                  <span>·</span>
                                  <span>
                                    {text.teamSize}: {selectedChallenge.team_size}
                                  </span>
                                </>
                              )}
                            </div>
                          )}

                          {/* Title */}
                          <h2 className="font-display mb-5 text-3xl leading-tight font-bold md:text-4xl">
                            {selectedChallenge?.title}
                          </h2>

                          {/* Divider */}
                          <div className="border-border mb-6 border-t" />

                          {/* Description as flowing prose */}
                          {(selectedChallenge?.short_description ||
                            selectedCategory.challengeDescription) && (
                            <p className="text-foreground mb-8 text-base leading-[1.8]">
                              {selectedChallenge?.short_description || selectedCategory.challengeDescription}
                            </p>
                          )}

                          {/* Prize callout */}
                          {(() => {
                            const prizeText =
                              selectedChallenge?.prize ||
                              (selectedData?.prizes?.first ? String(selectedData.prizes.first) : null)
                            if (!prizeText || !prizeText.trim()) return null
                            return (
                              <div
                                className="mb-8 rounded-2xl border p-5"
                                style={{
                                  backgroundColor: selectedCategory.color + "0d",
                                  borderColor: selectedCategory.color + "40"
                                }}>
                                <div className="flex items-center gap-4">
                                  <div
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                                    style={{ backgroundColor: selectedCategory.color + "20" }}>
                                    <Trophy className="h-5 w-5" style={{ color: selectedCategory.color }} />
                                  </div>
                                  <div>
                                    <p
                                      className="mb-0.5 text-[11px] font-bold tracking-widest uppercase"
                                      style={{ color: selectedCategory.color }}>
                                      {text.prize}
                                    </p>
                                    <p className="text-foreground text-xl font-bold">{prizeText}</p>
                                  </div>
                                </div>
                              </div>
                            )
                          })()}

                          {/* Register CTA */}
                          <Button
                            type="button"
                            className="w-full py-6 text-base font-semibold"
                            style={{
                              backgroundColor: selectedCategory.color,
                              color: selectedCategory.textColor
                            }}
                            onClick={() => {
                              const categoryId = selectedCategory.id || selectedCategory.slug
                              window.location.href = `/anmeldung?category=${categoryId}`
                            }}>
                            {text.register}
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-1 items-center justify-center p-8">
                          <p className="text-muted-foreground text-center text-sm">
                            {text.noChallengeAvailable}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
