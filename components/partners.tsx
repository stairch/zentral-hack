"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { SponsorshipModal } from "./sponsorship-modal"
import { useLanguage } from "@/lib/language-context"
import { Emails } from "@/lib/constants"
import { getSponsorPackageByLanguage } from "@/lib/sponsorship-packages"
import { type SponsorPackage } from "@/lib/sponsorship-packages"
import Image from "next/image"
import { srcWithVersion } from "@/lib/helpers"
import { getContrastForegroundColor } from "@/lib/helpers"
import { cn } from "@/lib/utils"

interface Sponsor {
  id: string
  company_name: string
  status: string
  logo_url: string | null
  website_url: string | null
  logo_size: string | null
  tier: string | null
  logo_bg_color: string | null
  updated_at: number
}

interface OrganiserOrSponsor {
  name: string
  logo: string
  link: string | null
  bgColor: string
  logoWidthPx: number
  updatedAt: number
}

// Tier-specific cell heights (Platin tallest -> Bronze shortest)
const TIER_MIN_H = ["min-h-48", "min-h-40", "min-h-28", "min-h-24"] as const

function getTierMinH(tierIndex: number) {
  return TIER_MIN_H[Math.min(tierIndex, TIER_MIN_H.length - 1)]
}

// Responsive grid classes per tier: Platin max 2, Gold max 3, Silber max 4, Bronze max 5
const TIER_GRID_COLS = [
  "grid-cols-1 sm:grid-cols-2",
  "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
  "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
] as const

// Breakpoints per tier matching the Tailwind classes above (ascending, min-width in px)
const TIER_BREAKPOINTS = [
  [
    { min: 0, cols: 1 },
    { min: 640, cols: 2 }
  ],
  [
    { min: 0, cols: 1 },
    { min: 640, cols: 2 },
    { min: 768, cols: 3 }
  ],
  [
    { min: 0, cols: 2 },
    { min: 640, cols: 3 },
    { min: 768, cols: 4 }
  ],
  [
    { min: 0, cols: 2 },
    { min: 640, cols: 3 },
    { min: 768, cols: 4 },
    { min: 1024, cols: 5 }
  ]
] as const

function getColsForWidth(tierIndex: number, width: number): number {
  const bps = TIER_BREAKPOINTS[Math.min(tierIndex, TIER_BREAKPOINTS.length - 1)]
  let cols: 1 | 2 | 3 | 4 | 5 = bps[0].cols
  for (const bp of bps) {
    if (width >= bp.min) cols = bp.cols
  }
  return cols
}

function SponsorGrid({
  sponsors,
  tierIndex,
  minH
}: {
  sponsors: OrganiserOrSponsor[]
  tierIndex: number
  minH: string
}) {
  const gridColsClass = TIER_GRID_COLS[Math.min(tierIndex, TIER_GRID_COLS.length - 1)]
  const [activeCols, setActiveCols] = useState(() =>
    typeof window !== "undefined" ? getColsForWidth(tierIndex, window.innerWidth) : 2
  )

  useEffect(() => {
    function update() {
      setActiveCols(getColsForWidth(tierIndex, window.innerWidth))
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [tierIndex])

  const trailingEmpty = (activeCols - (sponsors.length % activeCols)) % activeCols

  return (
    <div className={cn("border-border bg-border grid gap-px border", gridColsClass)}>
      {sponsors.map((sponsor) => {
        const cellContent = <SponsorLogo item={sponsor} />
        const cellClass = cn(
          "bg-background hover:bg-muted/50 flex items-center justify-center p-6 transition-colors duration-300",
          minH
        )

        return sponsor.link ? (
          <a
            key={sponsor.name}
            href={sponsor.link}
            target="_blank"
            rel="noopener noreferrer"
            className={cellClass}>
            {cellContent}
          </a>
        ) : (
          <div key={sponsor.name} className={cellClass}>
            {cellContent}
          </div>
        )
      })}
      {Array.from({ length: trailingEmpty }).map((_, i) => (
        <div key={`empty-${i}`} className={cn("bg-background", minH)} />
      ))}
    </div>
  )
}

function SponsorLogo({ item }: { item: OrganiserOrSponsor }) {
  return (
    <Image
      src={srcWithVersion(item.logo, item.updatedAt)}
      alt={item.name}
      width={1000}
      height={1000}
      style={{
        width: `${item.logoWidthPx}px`,
        background: item.bgColor !== "transparent" ? item.bgColor : undefined
      }}
      className="h-auto object-contain"
    />
  )
}

function TierCard({
  tier,
  index,
  onOpen,
  onHover,
  isSpotlit
}: {
  tier: SponsorPackage
  index: number
  onOpen: () => void
  onHover: () => void
  isSpotlit: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const { language } = useLanguage()
  const localizedTier = getSponsorPackageByLanguage(tier, language)
  const tierColor = localizedTier.color || "#530A5D"
  const textColor = getContrastForegroundColor(tierColor)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onOpen()
    }
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: isSpotlit ? 1 : 0.35 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.2, delay: isInView ? 0 : index * 0.1 }}
      onClick={onOpen}
      onMouseEnter={onHover}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={
        language === "de"
          ? `${localizedTier.name} Sponsoring-Paket anfragen`
          : `Request ${localizedTier.name} sponsorship package`
      }
      className="group relative flex min-h-28 w-56 cursor-pointer items-center justify-center rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
      style={{ backgroundColor: tierColor, borderColor: tierColor, color: textColor }}>
      <div className="flex items-center gap-2.5">
        <span className="font-display text-2xl font-semibold tracking-wide">{localizedTier.name}</span>
      </div>
    </motion.div>
  )
}

export function CoOrganisers() {
  const [organisers, setOrganisers] = useState<OrganiserOrSponsor[]>([])
  const { language } = useLanguage()

  useEffect(() => {
    const fetchPartnerLogos = async () => {
      try {
        const res = await fetch("/api/partner-logos")
        if (!res.ok) return
        const json = await res.json()
        const list = json.data?.logos as {
          id: string
          name: string
          logo_url: string
          website_url: string | null
          logo_size: string
          updated_at: number
        }[]
        if (list?.length > 0) {
          setOrganisers(
            list.map((l) => ({
              name: l.name,
              logo: `/api/partner-logo?id=${l.id}`,
              logoWidthPx: (Number(l.logo_size) || 50) * 3,
              link: l.website_url,
              bgColor: "transparent",
              updatedAt: l.updated_at
            }))
          )
        }
      } catch (err) {
        console.error("Failed to fetch partners: ", err)
      }
    }
    void fetchPartnerLogos()
  }, [])

  if (organisers.length === 0) return null

  const title = language === "de" ? "ORGANISIERT VON" : "ORGANIZED BY"
  const SILVER_TIER_INDEX = 2

  return (
    <section className="bg-background py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}>
          <p className="text-muted-foreground mb-8 text-center font-medium tracking-widest uppercase">
            {title}
          </p>
          <div className="mx-auto max-w-3xl">
            <SponsorGrid
              sponsors={organisers}
              tierIndex={SILVER_TIER_INDEX}
              minH={getTierMinH(SILVER_TIER_INDEX)}
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export function Partners() {
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true })
  const [sponsorshipModalOpen, setSponsorshipModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<SponsorPackage | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [sponsorPackageItems, setSponsorPackageItems] = useState<SponsorPackage[]>([])
  const { language } = useLanguage()

  useEffect(() => {
    const fetchSponsorPackages = async () => {
      try {
        const res = await fetch("/api/sponsor-contact")
        if (!res.ok) return
        const json = await res.json()
        const list = (json.data?.packages || []) as SponsorPackage[]
        if (list.length > 0) {
          setSponsorPackageItems([...list].sort((a, b) => a.display_order - b.display_order))
        }
      } catch (err) {
        console.error("Failed to fetch sponsor packages: ", err)
      }
    }

    const fetchSponsorContacts = async () => {
      try {
        const res = await fetch("/api/sponsors")
        if (!res.ok) return
        const json = await res.json()
        const list = (json.data?.sponsors || []) as Sponsor[]
        if (list.length > 0) {
          setSponsors(list)
        }
      } catch (err) {
        console.error("Failed to fetch sponsors: ", err)
      }
    }

    void fetchSponsorPackages()
    void fetchSponsorContacts()
  }, [])

  function mapSponsor(e: Sponsor): OrganiserOrSponsor {
    return {
      name: e.company_name,
      logo:
        e.logo_url && e.logo_url.startsWith("https://")
          ? `/api/sponsor-logo?id=${e.id}`
          : (e.logo_url as string),
      logoWidthPx: (Number(e.logo_size) || 50) * 3,
      bgColor: e.logo_bg_color === null ? "transparent" : e.logo_bg_color,
      link: e.website_url,
      updatedAt: e.updated_at
    }
  }

  const sponsorsByPackage = sponsorPackageItems.map((pkg, tierIndex) => ({
    package: pkg,
    tierIndex,
    sponsors: sponsors
      .filter((s) => s.tier === pkg.id && s.status === "published" && s.logo_url)
      .map(mapSponsor)
  }))

  const tiersWithSponsors = sponsorsByPackage.filter(({ sponsors }) => sponsors.length > 0)

  const copy = {
    de: {
      badge: "SPONSOREN",
      heading: "GEMEINSAM",
      headingAccent: "STÄRKER",
      description:
        "Unterstützt von führenden Unternehmen und Institutionen aus der Zentralschweiz und darüber hinaus.",
      tierListsTitle: "Werden Sie ein Sponsor",
      sponsoren: "SPONSOREN",
      ctaQuestion: "Noch unsicher welches Paket passt?",
      ctaAction: "Kontakt aufnehmen"
    },
    en: {
      badge: "SPONSORS",
      heading: "STRONGER",
      headingAccent: "TOGETHER",
      description: "Supported by leading companies and institutions from Central Switzerland and beyond.",
      tierListsTitle: "Become a sponsor",
      sponsoren: "SPONSORS",
      ctaQuestion: "Not sure which package fits?",
      ctaAction: "Get in touch"
    }
  } as const

  const text = copy[language]

  return (
    <>
      <section id="partners" className="bg-background overflow-hidden py-24">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <motion.div
            ref={headerRef}
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}>
            <motion.span
              className="bg-secondary/30 text-primary mb-4 inline-block rounded-full px-4 py-2 text-sm font-medium"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isHeaderInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}>
              {text.badge}
            </motion.span>
            <h2 className="font-display text-foreground mb-4 text-4xl font-bold md:text-5xl">
              {text.heading} <span className="text-violet">{text.headingAccent}</span>
            </h2>
            <p className="text-muted-foreground mx-auto max-w-3xl text-lg">{text.description}</p>
          </motion.div>

          {/* Sponsor grids */}
          <div className="mx-auto mb-32 max-w-3xl">
            {tiersWithSponsors.map(({ package: pkg, sponsors, tierIndex }) => {
              const localizedPkg = getSponsorPackageByLanguage(pkg, language)
              const label = localizedPkg.name.toUpperCase()
              const bgColor = localizedPkg.color
              const textColor = getContrastForegroundColor(bgColor)
              const minH = getTierMinH(tierIndex)

              return (
                <div key={pkg.id}>
                  {/* Title */}
                  <h3 className="font-display text-foreground mt-16 mb-4 flex justify-center text-center text-lg font-bold">
                    <div className="w-fit rounded-md px-5" style={{ background: bgColor, color: textColor }}>
                      {label} {text.sponsoren}
                    </div>
                  </h3>

                  <SponsorGrid sponsors={sponsors} tierIndex={tierIndex} minH={minH} />
                </div>
              )
            })}
          </div>

          {/* Sponsor Tiers */}
          <div className="mx-auto max-w-5xl">
            <p className="text-muted-foreground mb-5 text-center font-medium tracking-widest uppercase">
              {text.tierListsTitle}
            </p>
            <div className="flex w-full justify-center">
              <div className="flex flex-wrap justify-center gap-3" onMouseLeave={() => setHoveredIndex(null)}>
                {sponsorPackageItems.map((tier, index) => (
                  <TierCard
                    key={tier.id}
                    tier={tier}
                    index={index}
                    isSpotlit={hoveredIndex === null || hoveredIndex === index}
                    onHover={() => setHoveredIndex(index)}
                    onOpen={() => {
                      setSelectedPackage(tier)
                      setSponsorshipModalOpen(true)
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <motion.p
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 }}>
            <span className="text-muted-foreground mb-4">{text.ctaQuestion} • </span>
            <a
              href={`mailto:${Emails.infoZentralHack}`}
              className="text-violet group inline-flex cursor-pointer items-center gap-2 font-semibold">
              <span className="group-hover:underline">{text.ctaAction}</span>
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1">
                →
              </span>
            </a>
          </motion.p>
        </div>
      </section>

      {/* Sponsorship Modal */}
      <SponsorshipModal
        isOpen={sponsorshipModalOpen}
        onClose={() => setSponsorshipModalOpen(false)}
        selectedPackage={selectedPackage}
        allPackages={sponsorPackageItems}
      />
    </>
  )
}
