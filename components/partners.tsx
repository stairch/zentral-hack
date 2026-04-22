"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { SponsorshipModal } from "./sponsorship-modal"
import { sponsorPackages as fallbackSponsorPackages } from "@/lib/sponsorship-packages"
import { useLanguage } from "@/lib/language-context"
import { Emails } from "@/lib/constants"
import { getSponsorContrastTextColor } from "@/lib/sponsorship-packages"

interface SponsorPackage {
  id: string
  slug: string
  name: string
  description: string
  shortDescription: string
  color: string
  benefits: string[]
  display_order: number
}

interface Sponsor {
  id: string
  company_name: string
  status: string
  logo_url: string | null
  website_url: string | null
  logo_size: string | null
  tier: string | null
  logo_bg_color: string | null
}

type Organiser = { name: string; logo: string; link: string; bgColor: string; logoWidth: string }
const partners: { organisers: Organiser[] } = {
  organisers: [
    {
      name: "HSLU",
      logo: "/partners/hslu-logo.png",
      logoWidth: "w-36",
      link: "https://hslu.ch/informatik",
      bgColor: "transparent"
    },
    {
      name: "ICT Berufsbildung Zentralschweiz",
      logo: "/partners/ict-bz-logo.png",
      logoWidth: "w-24",
      link: "https://ict-bz.ch",
      bgColor: "transparent"
    },
    {
      name: "UMB AG",
      logo: "/partners/umb-logo.png",
      logoWidth: "w-24",
      link: "https://umb.ch",
      bgColor: "transparent"
    },
    {
      name: "Digital & AI Community",
      logo: "/partners/ai-community-logo.png",
      logoWidth: "w-30",
      link: "https://ai-community.ch",
      bgColor: "transparent"
    },
    {
      name: "getAbstract",
      logo: "/partners/getabstract-logo.png",
      logoWidth: "w-32",
      link: "https://getabstract.com",
      bgColor: "transparent"
    },
    {
      name: "STAIR",
      logo: "/partners/stair-logo.png",
      logoWidth: "w-28",
      link: "https://stair.ch",
      bgColor: "transparent"
    },
    {
      name: "SchwyzNext",
      logo: "/partners/schwyznext-logo.png",
      logoWidth: "w-20",
      link: "https://schwyz-next.ch",
      bgColor: "transparent"
    }
  ]
}

function MarqueeRow({
  items,
  direction = "left",
  speed = 30
}: {
  items: { name: string; logo: string; logoWidth: string; link: string | null; bgColor: string }[]
  direction?: "left" | "right"
  speed?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const duplicatedItems = [...items, ...items, ...items]

  useEffect(() => {
    if (!ref.current) return
    setContainerWidth(ref.current.scrollWidth / 3 + 10)
  }, [items])

  return (
    <div className="relative overflow-hidden py-4">
      {items.length > 4 ? (
        <>
          {/* fade left */}
          <div className="from-background pointer-events-none absolute top-0 left-0 z-10 h-full w-12 bg-linear-to-r to-transparent sm:w-28" />
          {/* fade right */}
          <div className="from-background pointer-events-none absolute top-0 right-0 z-10 h-full w-12 bg-linear-to-l to-transparent sm:w-28" />

          <motion.div
            ref={ref}
            className="flex gap-8 whitespace-nowrap"
            animate={
              containerWidth
                ? {
                    x: direction === "left" ? [0, -containerWidth] : [-containerWidth, 0]
                  }
                : {}
            }
            transition={{
              x: {
                duration: speed,
                repeat: Infinity,
                ease: "linear",
                repeatType: "loop"
              }
            }}>
            {duplicatedItems.map((item, index) => (
              <div
                key={`partners-item-${item.name}-${index}`}
                className="flex shrink-0 items-center rounded-lg px-8 py-4">
                <a
                  className={`rounded-xs p-1`}
                  style={{ background: item.bgColor }}
                  href={item.link === null ? undefined : item.link}
                  target="_blank">
                  {/* We use img insted of Image, because external urls must be whitelisted in next.config, but we don't the image origin */}
                  {/* TODO: replace logo url with vercel blob upload */}
                  <img
                    src={item.logo}
                    alt={item.name}
                    width={1000}
                    height={1000}
                    className={`h-auto ${item.logoWidth}`}
                  />
                </a>
              </div>
            ))}
          </motion.div>
        </>
      ) : (
        <div className="flex flex-wrap justify-center gap-8">
          {items.map((item, index) => (
            <div
              key={`partners-item-${item.name}-${index}`}
              className="flex shrink-0 items-center rounded-lg px-8 py-4">
              <a
                className={`rounded-xs p-1`}
                style={{ background: item.bgColor }}
                href={item.link === null ? undefined : item.link}
                target="_blank">
                {/* We use img insted of Image, because external urls must be whitelisted in next.config, but we don't the image origin */}
                {/* TODO: replace logo url with vercel blob upload */}
                <img
                  src={item.logo}
                  alt={item.name}
                  width={1000}
                  height={1000}
                  className={`h-auto ${item.logoWidth}`}
                />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
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
  const textColor = getSponsorContrastTextColor(tier.color)

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
      onMouseEnter={() => {
        onHover()
      }}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${tier.name} Sponsoring-Paket anfragen`}
      className="group relative flex min-h-28 cursor-pointer items-center justify-center rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
      style={{
        backgroundColor: tier.color,
        borderColor: tier.color,
        color: textColor
      }}>
      <div className="flex items-center gap-2.5">
        <span
          className="block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: textColor, opacity: 0.85 }}
        />
        <span className="font-display text-2xl font-semibold tracking-wide">{tier.name}</span>
      </div>
    </motion.div>
  )
}

export function Partners() {
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true })
  const [sponsorshipModalOpen, setSponsorshipModalOpen] = useState(false)
  const [selectedPackageSlug, setSelectedPackageSlug] = useState<string | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [sponsorPackageItems, setSponsorPackageItems] = useState<SponsorPackage[]>(
    fallbackSponsorPackages
      .map((pkg) => ({
        id: pkg.id,
        slug: pkg.slug,
        name: pkg.name.de,
        description: pkg.description.de,
        shortDescription: pkg.shortDescription.de,
        color: pkg.color,
        benefits: pkg.benefits.map((benefit) => benefit.de),
        display_order: pkg.display_order
      }))
      .sort((a, b) => a.display_order - b.display_order)
  )
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
      } catch {
        // Keep fallback data
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
      } catch {
        // Keep fallback data (empty list)
      }
    }

    void fetchSponsorPackages()
    void fetchSponsorContacts()
  }, [])

  function mapSponsor(e: Sponsor) {
    let logoWidth = ""
    if (e.logo_size === "small") {
      logoWidth = "w-20"
    } else if (e.logo_size === "medium") {
      logoWidth = "w-28"
    } else if (e.logo_size === "large") {
      logoWidth = "w-36"
    }

    return {
      name: e.company_name,
      logo: e.logo_url as string,
      logoWidth,
      bgColor: e.logo_bg_color === null ? "transparent" : e.logo_bg_color,
      link: e.website_url
    }
  }

  const platinSponsors = sponsors
    .filter((e) => e.tier === "platin" && e.status === "published" && e.logo_url)
    .map((e) => mapSponsor(e))
  const goldSponsors = sponsors
    .filter((e) => e.tier === "gold" && e.status === "published" && e.logo_url)
    .map((e) => mapSponsor(e))
  const silverSponsors = sponsors
    .filter((e) => e.tier === "silber" && e.status === "published" && e.logo_url)
    .map((e) => mapSponsor(e))
  const bronzeSponsors = sponsors
    .filter((e) => e.tier === "bronze" && e.status === "published" && e.logo_url)
    .map((e) => mapSponsor(e))

  const platinColor = sponsorPackageItems.filter((e) => e.slug === "platin")[0].color
  const goldColor = sponsorPackageItems.filter((e) => e.slug === "gold")[0].color
  const silverColor = sponsorPackageItems.filter((e) => e.slug === "silber")[0].color
  const bronzeColor = sponsorPackageItems.filter((e) => e.slug === "bronze")[0].color

  const copy = {
    de: {
      badge: "PARTNER & SPONSOREN",
      heading: "GEMEINSAM",
      headingAccent: "STÄRKER",
      description: "Unterstützt von führenden Unternehmen und Institutionen der Zentralschweiz.",
      organisers: "CO-ORGANISATOREN",
      platinSponsors: "PLATIN SPONSOREN",
      goldSponsors: "GOLD SPONSOREN",
      silverSponsors: "SILBER SPONSOREN",
      bronzeSponsors: "BRONZE SPONSOREN",
      tierListsTitle: "Werden Sie ein Sponsor",
      ctaQuestion: "Noch unsicher welches Paket passt?",
      ctaAction: "Kontakt aufnehmen"
    },
    en: {
      badge: "PARTNERS & SPONSORS",
      heading: "STRONGER",
      headingAccent: "TOGETHER",
      description: "Supported by leading companies and institutions in Central Switzerland.",
      organisers: "CO-ORGANIZERS",
      platinSponsors: "PLATIN SPONSORS",
      goldSponsors: "GOLD SPONSORS",
      silverSponsors: "SILVER SPONSORS",
      bronzeSponsors: "BRONZE SPONSORS",
      tierListsTitle: "Become a sponsor",
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
              className="bg-violet/10 text-violet mb-4 inline-block rounded-full px-4 py-2 text-sm font-medium"
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

          <div className="mb-16">
            {/* Co-Organisers Marquee */}
            <h3 className="font-display text-foreground mb-4 flex justify-center text-center text-lg font-bold">
              <div className="bg-primary w-fit rounded-md px-5 text-white">{text.organisers}</div>
            </h3>
            <MarqueeRow items={partners.organisers} direction="left" speed={30} />
            {/* Platin Sponsors Marquee */}
            {platinSponsors.length > 0 && (
              <>
                <h3 className="font-display text-foreground mt-16 mb-4 flex justify-center text-center text-lg font-bold">
                  <div
                    className="w-fit rounded-md px-5"
                    style={{ background: platinColor, color: getSponsorContrastTextColor(platinColor) }}>
                    {text.platinSponsors}
                  </div>
                </h3>
                <MarqueeRow items={platinSponsors} direction="right" speed={20} />
              </>
            )}
            {/* Gold Sponsors Marquee */}
            {goldSponsors.length > 0 && (
              <>
                <h3 className="font-display text-foreground mt-16 mb-4 flex justify-center text-center text-lg font-bold">
                  <div
                    className="w-fit rounded-md px-5"
                    style={{ background: goldColor, color: getSponsorContrastTextColor(goldColor) }}>
                    {text.goldSponsors}
                  </div>
                </h3>
                <MarqueeRow items={goldSponsors} direction="left" speed={20} />
              </>
            )}
            {/* Silver Sponsors Marquee */}
            {silverSponsors.length > 0 && (
              <>
                <h3 className="font-display text-foreground mt-16 mb-4 flex justify-center text-center text-lg font-bold">
                  <div
                    className="w-fit rounded-md px-5"
                    style={{ background: silverColor, color: getSponsorContrastTextColor(silverColor) }}>
                    {text.silverSponsors}
                  </div>
                </h3>
                <MarqueeRow items={silverSponsors} direction="right" speed={20} />
              </>
            )}
            {/* Bronze Sponsors Marquee */}
            {bronzeSponsors.length > 0 && (
              <>
                <h3 className="font-display text-foreground mt-16 mb-4 flex justify-center text-center text-lg font-bold">
                  <div
                    className="w-fit rounded-md px-5"
                    style={{ background: bronzeColor, color: getSponsorContrastTextColor(bronzeColor) }}>
                    {text.bronzeSponsors}
                  </div>
                </h3>
                <MarqueeRow items={bronzeSponsors} direction="left" speed={20} />
              </>
            )}
          </div>

          {/* Sponsor Tiers */}
          <div className="mx-auto max-w-5xl">
            <p className="text-muted-foreground mb-5 text-center font-medium tracking-widest uppercase">
              {text.tierListsTitle}
            </p>
            <div
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              onMouseLeave={() => setHoveredIndex(null)}>
              {sponsorPackageItems.map((tier, index) => (
                <TierCard
                  key={tier.slug}
                  tier={tier}
                  index={index}
                  isSpotlit={hoveredIndex === null || hoveredIndex === index}
                  onHover={() => setHoveredIndex(index)}
                  onOpen={() => {
                    setSelectedPackageSlug(tier.slug)
                    setSponsorshipModalOpen(true)
                  }}
                />
              ))}
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
        selectedPackageSlug={selectedPackageSlug}
      />
    </>
  )
}
