"use client"

import Image from "next/image"
import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { SponsorshipModal } from "./sponsorship-modal"
import { sponsorPackages } from "@/lib/sponsorship-packages"
import { useLanguage } from "@/lib/language-context"
import { type SponsorPackage } from "@/lib/sponsorship-packages"
import { type Language } from "@/lib/language-context"
import { Emails } from "@/lib/constants"

type Organiser = { name: string; logo: string; link: string; bgColor: string; logoWidth: string }
const partners: { organisers: Organiser[] } = {
  organisers: [
    {
      name: "HSLU",
      logo: "/partners/hslu-logo.png",
      logoWidth: "w-36",
      link: "https://hslu.ch",
      bgColor: "bg-transparent"
    },
    {
      name: "ICT Berufsbildung Zentralschweiz",
      logo: "/partners/ict-bz-logo.png",
      logoWidth: "w-24",
      link: "https://ict-bz.ch",
      bgColor: "bg-transparent"
    },
    {
      name: "UMB AG",
      logo: "/partners/umb-logo.png",
      logoWidth: "w-28",
      link: "https://umb.ch",
      bgColor: "bg-black"
    },
    {
      name: "Digital & AI Community",
      logo: "/partners/ai-community-logo.png",
      logoWidth: "w-26",
      link: "https://ai-community.ch",
      bgColor: "bg-[#0a0a14]"
    },
    {
      name: "getAbstract",
      logo: "/partners/getabstract-logo.png",
      logoWidth: "w-32",
      link: "https://getabstract.com",
      bgColor: "bg-transparent"
    },
    {
      name: "STAIR",
      logo: "/partners/stair-logo.png",
      logoWidth: "w-28",
      link: "https://stair.ch",
      bgColor: "bg-transparent"
    },
    {
      name: "SchwyzNext",
      logo: "/partners/schwyznext-logo.png",
      logoWidth: "w-20",
      link: "https://schwyz-next.ch",
      bgColor: "bg-transparent"
    }
  ]
}

function MarqueeRow({
  items,
  direction = "left",
  speed = 30
}: {
  items: Organiser[]
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
            <a className={`p-1 ${item.bgColor} rounded-xs`} href={item.link} target="_blank">
              <Image
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
    </div>
  )
}

function TierCard({
  tier,
  index,
  onOpen,
  language
}: {
  tier: SponsorPackage
  index: number
  onOpen: () => void
  language: Language
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const [hovered, setHovered] = useState(false)

  const copy = {
    de: {
      requestPackage: "Paket anfragen"
    },
    en: {
      requestPackage: "Request package"
    }
  } as const

  const text = copy[language]

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
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${tier.name} Sponsoring-Paket anfragen`}
      className="group relative flex cursor-pointer flex-col rounded-2xl border p-5 transition-all duration-200 hover:border-black/[0.14] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
      style={{
        background: `${tier.color}12`, // 7% opacity
        borderColor: `${tier.color}33` // 20% opacity
      }}>
      {/* Tier indicator dot + name */}
      <div className="mb-3 flex items-center gap-2.5">
        <span className="block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: tier.color }} />
        <span className="font-display text-foreground font-medium">{tier.name[language]}</span>
      </div>

      {/* Price / amount */}
      {tier.price[language] && (
        <p className="text-muted-foreground mb-3 text-sm font-medium tabular-nums">{tier.price[language]}</p>
      )}

      {/* Benefits list */}
      <ul className="mb-4 flex flex-col gap-1.5">
        {tier.benefits.map((benefit, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-black/50 dark:text-white/50">
            <span
              className="mt-1 block h-1.25 w-1.25 shrink-0 rounded-full opacity-60"
              style={{ background: tier.color }}
            />
            {benefit[language]}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div
        className="mt-auto flex items-center gap-1 text-sm font-semibold transition-colors duration-150"
        style={{ color: tier.color }}>
        <span>{text.requestPackage}</span>
        <motion.span animate={{ x: hovered ? 3 : 0 }} transition={{ duration: 0.2 }} aria-hidden="true">
          →
        </motion.span>
      </div>
    </motion.div>
  )
}

export function Partners() {
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true })
  const [sponsorshipModalOpen, setSponsorshipModalOpen] = useState(false)
  const [selectedPackageSlug, setSelectedPackageSlug] = useState<string | null>(null)
  const { language } = useLanguage()

  const copy = {
    de: {
      badge: "PARTNER & SPONSOREN",
      heading: "GEMEINSAM",
      headingAccent: "STÄRKER",
      description: "Unterstützt von führenden Unternehmen und Institutionen der Zentralschweiz.",
      organisers: "CO-ORGANISATOREN",
      sponsors: "SPONSOREN",
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
      sponsors: "SPONSORS",
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

          {/* Co-Organisers Marquee */}
          <div className="mb-16">
            <motion.h3
              className="font-display text-foreground mb-6 text-center text-xl font-bold"
              initial={{ opacity: 0 }}
              animate={isHeaderInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 }}>
              {text.organisers}
            </motion.h3>
            <MarqueeRow items={partners.organisers} direction="left" speed={30} />
            {/* TODO uncomment if there are sponsors */}
            {/* <motion.h3
              className="font-display text-foreground mb-6 mt-12 text-center text-xl font-bold"
              initial={{ opacity: 0 }}
              animate={isHeaderInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 }}>
              {text.sponsors}
            </motion.h3>
            <MarqueeRow items={partners.organisers} direction="right" speed={20} /> */}
          </div>

          {/* Sponsor Tiers */}
          <div className="mx-auto max-w-5xl">
            <p className="text-muted-foreground mb-5 text-center tracking-widest uppercase">
              {text.tierListsTitle}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {sponsorPackages.map((tier, index) => (
                <TierCard
                  key={tier.slug}
                  tier={tier}
                  index={index}
                  onOpen={() => {
                    setSelectedPackageSlug(tier.slug)
                    setSponsorshipModalOpen(true)
                  }}
                  language={language}
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
