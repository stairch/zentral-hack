"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useInView, useMotionValue, useSpring } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

function DetailBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-muted-foreground mb-2 text-xs tracking-wider uppercase">{title}</p>
      <p className="text-sm leading-relaxed whitespace-pre-line md:text-base">{value || "-"}</p>
    </div>
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

  const copy = {
    de: {
      badge: "CHALLENGES",
      heading: "WÄHLE DEINE",
      headingAccent: "KATEGORIE",
      description:
        "Vier spannende Kategorien warten auf dich. Finde deine Passion und löse Challenges, die einen echten Unterschied machen.",
      partner: "Partner",
      clickDetails: "Klicken für Details",
      challengeDescription: "Challenge-Beschrieb",
      chooseChallenge: "Challenge auswählen",
      viewAvailableChallenges: "View available challenges",
      challengeOverview: "Challenge-Übersicht",
      noChallengeAvailable: "Für diese Kategorie sind aktuell noch keine Challenges veröffentlicht.",
      backToOverview: "Zurück zur Übersicht"
    },
    en: {
      badge: "CHALLENGES",
      heading: "CHOOSE YOUR",
      headingAccent: "CATEGORY",
      description:
        "Four exciting categories are waiting for you. Find your passion and solve challenges that make a real impact.",
      partner: "Partner",
      clickDetails: "Click for details",
      challengeDescription: "Challenge Description",
      chooseChallenge: "Select challenge",
      viewAvailableChallenges: "View available challenges",
      challengeOverview: "Challenge overview",
      noChallengeAvailable: "There are no published challenges available for this category yet.",
      backToOverview: "Back to overview"
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

  const closeDialog = () => {
    setSelectedCategory(null)
    setSelectedChallengeId("")
    setIsChallengeBrowserOpen(false)
  }

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
          <DialogContent className="h-[78vh] w-[92vw] max-w-none min-w-[360px] overflow-hidden border-0 p-0 sm:h-[82vh] sm:min-w-[640px]">
            {selectedCategory ? (
              <>
                <div className="relative h-full min-h-0 bg-gradient-to-br from-[#530A5D] via-[#6F177A] to-[#E6FF17] p-[1px]">
                  <div
                    className="bg-background/95 relative h-full min-h-0 overflow-x-hidden overflow-y-scroll overscroll-contain rounded-[2px] p-4 backdrop-blur-sm md:p-6"
                    style={{ scrollbarGutter: "stable" }}>
                    {!isChallengeBrowserOpen ? (
                      <div className="space-y-6">
                        <DialogHeader>
                          <div className="mb-2 inline-flex w-fit rounded-full bg-[#530A5D]/10 px-3 py-1 text-xs font-semibold tracking-wider text-[#530A5D] uppercase">
                            {text.challengeOverview}
                          </div>
                          <DialogTitle className="font-display text-3xl md:text-4xl">
                            {selectedCategory.title}
                          </DialogTitle>
                          <DialogDescription className="text-muted-foreground text-base leading-relaxed md:text-lg">
                            {selectedCategory.description}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                          <div className="rounded-2xl border border-[#530A5D]/20 bg-[#530A5D]/5 p-4">
                            <p className="mb-2 text-xs font-semibold tracking-wider text-[#530A5D] uppercase">
                              {text.partner}
                            </p>
                            <p className="text-foreground font-semibold">{selectedCategory.partnerName}</p>
                          </div>
                          <Button
                            type="button"
                            className="h-11 bg-[#530A5D] px-5 text-white hover:bg-[#3D0844]"
                            onClick={() => setIsChallengeBrowserOpen(true)}
                            disabled={availableChallenges.length === 0}>
                            {text.viewAvailableChallenges}
                          </Button>
                        </div>

                        {availableChallenges.length === 0 ? (
                          <div className="text-muted-foreground rounded-2xl border border-dashed p-5 text-sm">
                            {text.noChallengeAvailable}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold tracking-wider text-[#530A5D] uppercase">
                              {text.chooseChallenge}
                            </p>
                            <h3 className="font-display text-2xl font-bold text-[#530A5D]">
                              {selectedCategory.title}
                            </h3>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsChallengeBrowserOpen(false)}>
                            {text.backToOverview}
                          </Button>
                        </div>

                        {availableChallenges.length > 0 ? (
                          <div className="space-y-3">
                            <Select
                              value={selectedChallenge?.id || ""}
                              onValueChange={setSelectedChallengeId}>
                              <SelectTrigger className="h-11 border-[#530A5D]/30 focus:ring-[#530A5D]/30">
                                <SelectValue placeholder={text.chooseChallenge} />
                              </SelectTrigger>
                              <SelectContent>
                                {availableChallenges.map((challenge, index) => (
                                  <SelectItem key={challenge.id} value={challenge.id}>
                                    {challenge.title || `Challenge ${index + 1}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <div className="flex flex-wrap gap-2">
                              {availableChallenges.map((challenge, index) => {
                                const active = selectedChallenge?.id === challenge.id
                                return (
                                  <button
                                    key={challenge.id}
                                    type="button"
                                    onClick={() => setSelectedChallengeId(challenge.id)}
                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                      active
                                        ? "border-[#530A5D] bg-[#530A5D] text-white"
                                        : "border-[#530A5D]/30 bg-white text-[#530A5D] hover:bg-[#530A5D]/10"
                                    }`}>
                                    {challenge.title || `Challenge ${index + 1}`}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ) : null}

                        {hasChallenge &&
                        (selectedChallenge?.short_description || selectedCategory.challengeDescription) ? (
                          <div className="rounded-2xl border border-[#530A5D]/20 bg-[#530A5D]/5 p-4 md:p-5">
                            <p className="mb-2 text-xs font-semibold tracking-wider text-[#530A5D] uppercase">
                              {text.challengeDescription}
                            </p>
                            <p className="text-sm leading-relaxed md:text-base">
                              {selectedChallenge?.short_description || selectedCategory.challengeDescription}
                            </p>
                          </div>
                        ) : null}

                        {hasChallenge && selectedData ? (
                          <div className="grid gap-4 md:grid-cols-2">
                            <DetailBlock
                              title="Problemstellung"
                              value={String(selectedData.problemStatement || "")}
                            />
                            <DetailBlock title="Zielsetzung" value={String(selectedData.goal || "")} />
                            <div className="md:col-span-2">
                              <DetailBlock
                                title="Anforderungen"
                                value={String(selectedData.mustRequirements || "")}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <DetailBlock
                                title="Technische Rahmenbedingungen"
                                value={String(selectedData.allowedTechnologies || "")}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <DetailBlock
                                title="Einschränkungen"
                                value={String(selectedData.restrictions || "")}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <DetailBlock
                                title="Ressourcen"
                                value={String(selectedData.resources?.details || "")}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <DetailBlock
                                title="Deliverables"
                                value={String(selectedData.deliverables?.other || "")}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <DetailBlock
                                title="Bewertung"
                                value={String(selectedData.evaluation?.criteria || "")}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <DetailBlock
                                title="Preise & Anreize"
                                value={String(selectedData.prizes?.first || "")}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
