"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { SponsorshipModal } from "./sponsorship-modal"
import { useLanguage } from "@/lib/language-context"
import { Emails } from "@/lib/constants"
import { getSponsorPackageByLanguage } from "@/lib/sponsorship-packages"
import { getContrastForegroundColor } from "@/lib/helpers"
import { type SponsorPackage } from "@/lib/sponsorship-packages"
import Image from "next/image"

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
  logoWidth: string
  updatedAt: number
}

function srcWithVersion(url: string, version: string | number) {
  // adds timestamp via 'v' query param
  // this forces next to retrieve new image instead of using the cached, outdated one
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}v=${version}`
}

function MarqueeRow({
  items,
  direction = "left",
  speed = 30
}: {
  items: OrganiserOrSponsor[]
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
                  <Image
                    src={srcWithVersion(item.logo, item.updatedAt)}
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
          {items.map((item, index) => {
            srcWithVersion(item.logo, item.updatedAt)
            return (
              <div
                key={`partners-item-${item.name}-${index}`}
                className="flex shrink-0 items-center rounded-lg px-8 py-4">
                <a
                  className={`rounded-xs p-1`}
                  style={{ background: item.bgColor }}
                  href={item.link === null ? undefined : item.link}
                  target="_blank">
                  <Image
                    src={srcWithVersion(item.logo, item.updatedAt)}
                    alt={item.name}
                    width={1000}
                    height={1000}
                    className={`h-auto ${item.logoWidth}`}
                  />
                </a>
              </div>
            )
          })}
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
      onMouseEnter={() => {
        onHover()
      }}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={
        language === "de"
          ? `${localizedTier.name} Sponsoring-Paket anfragen`
          : `Request ${localizedTier.name} sponsorship package`
      }
      className="group relative flex min-h-28 w-56 cursor-pointer items-center justify-center rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
      style={{
        backgroundColor: tierColor,
        borderColor: tierColor,
        color: textColor
      }}>
      <div className="flex items-center gap-2.5">
        <span
          className="block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: textColor, opacity: 0.85 }}
        />
        <span className="font-display text-2xl font-semibold tracking-wide">{localizedTier.name}</span>
      </div>
    </motion.div>
  )
}

export function Partners() {
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true })
  const [sponsorshipModalOpen, setSponsorshipModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<SponsorPackage | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [dbOrganisers, setDbOrganisers] = useState<OrganiserOrSponsor[]>([])
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
          setDbOrganisers(
            list.map((l) => ({
              name: l.name,
              logo: `/api/partner-logo?id=${l.id}`,
              logoWidth: l.logo_size === "small" ? "w-20" : l.logo_size === "large" ? "w-36" : "w-28",
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

    void fetchSponsorPackages()
    void fetchSponsorContacts()
    void fetchPartnerLogos()
  }, [])

  function mapSponsor(e: Sponsor): OrganiserOrSponsor {
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
      logo:
        e.logo_url && e.logo_url.startsWith("https://")
          ? `/api/sponsor-logo?id=${e.id}`
          : (e.logo_url as string),
      logoWidth,
      bgColor: e.logo_bg_color === null ? "transparent" : e.logo_bg_color,
      link: e.website_url,
      updatedAt: e.updated_at
    }
  }

  const sponsorsByPackage: { package: SponsorPackage; sponsors: OrganiserOrSponsor[] }[] =
    sponsorPackageItems.map((pkg) => ({
      package: pkg,
      sponsors: sponsors
        .filter((s) => s.tier === pkg.id && s.status === "published" && s.logo_url)
        .map(mapSponsor)
    }))

  const copy = {
    de: {
      badge: "PARTNER & SPONSOREN",
      heading: "GEMEINSAM",
      headingAccent: "STÄRKER",
      description: "Unterstützt von führenden Unternehmen und Institutionen der Zentralschweiz.",
      organisers: "CO-ORGANISATOREN",
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
              className="bg-secondary/30 text-primary mb-4 inline-block rounded-full px-4 py-2 text-sm font-medium"
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
            <MarqueeRow items={dbOrganisers} direction="left" speed={30} />
            {sponsorsByPackage
              .filter(({ sponsors }) => sponsors.length > 0)
              .map(({ package: pkg, sponsors }, i) => {
                const localizedPkg = getSponsorPackageByLanguage(pkg, language)
                const label = localizedPkg.name.toUpperCase()
                const direction = i % 2 === 0 ? "right" : "left"
                return (
                  <div key={pkg.id}>
                    <h3 className="font-display text-foreground mt-16 mb-4 flex justify-center text-center text-lg font-bold">
                      <div
                        className="w-fit rounded-md px-5"
                        style={{
                          background: localizedPkg.color,
                          color: getContrastForegroundColor(localizedPkg.color)
                        }}>
                        {label} SPONSOREN
                      </div>
                    </h3>
                    <MarqueeRow items={sponsors} direction={direction} speed={20} />
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
