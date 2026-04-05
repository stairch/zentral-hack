"use client"

import Image from "next/image"
import { useRef, useState, useEffect } from "react"
import { motion, useInView, useMotionValue, useSpring } from "framer-motion"
import { SponsorshipModal } from "./sponsorship-modal"
import { sponsorPackages } from "@/lib/sponsorship-packages"
import { useLanguage } from "@/lib/language-context"
import { type SponsorPackage } from "@/lib/sponsorship-packages"

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
  zIndex,
  onOpen
}: {
  tier: SponsorPackage
  index: number
  zIndex: number
  onOpen: () => void
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
    const cardRect = ref.current.getBoundingClientRect()
    const centerX = cardRect.left + cardRect.width / 2
    const centerY = cardRect.top + cardRect.height / 2
    x.set((e.clientX - centerX) * 0.07)
    y.set((e.clientY - centerY) * 0.07)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onOpen()
    }
  }

  const cardVariants = {
    rest: { opacity: 0, y: 50, rotateX: -15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 0.6, delay: i * 0.15 }
    }),
    hover: {
      scale: 1.03,
      transition: { duration: 0.3, delay: 0 }
    }
  }

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      custom={index}
      initial="rest"
      animate={isInView ? "visible" : "rest"}
      whileHover="hover"
      onClick={onOpen}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-black/5 p-6 text-center"
      style={{
        x: xSpring,
        y: ySpring,
        zIndex,
        position: "relative",
        background: `linear-gradient(-45deg, ${tier.color}E6 50%, rgba(255,255,255,0.92) 110%)` // E6 = 90% opacity
      }}>
      <span className="font-display text-foreground mb-2 text-2xl font-bold">{tier.name.toUpperCase()}</span>
      <p className="text-foreground/75 max-w-[16rem] text-sm leading-relaxed">{tier.shortDescription}</p>
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
      ctaQuestion: "Interessiert an einer Partnerschaft?",
      ctaAction: "Kontaktiere uns"
    },
    en: {
      badge: "PARTNERS & SPONSORS",
      heading: "STRONGER",
      headingAccent: "TOGETHER",
      description: "Supported by leading companies and institutions in Central Switzerland.",
      organisers: "CO-ORGANIZERS",
      sponsors: "SPONSORS",
      ctaQuestion: "Interested in a partnership?",
      ctaAction: "Contact us"
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
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
            {sponsorPackages.map((tier, index) => (
              <TierCard
                key={tier.slug}
                tier={tier}
                index={index}
                zIndex={sponsorPackages.length - index}
                onOpen={() => {
                  setSelectedPackageSlug(tier.slug)
                  setSponsorshipModalOpen(true)
                }}
              />
            ))}
          </div>

          {/* CTA */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 }}>
            <p className="text-muted-foreground mb-4">{text.ctaQuestion}</p>
            <button
              onClick={() => setSponsorshipModalOpen(true)}
              className="text-violet group inline-flex cursor-pointer items-center gap-2 font-semibold">
              <span className="group-hover:underline">{text.ctaAction}</span>
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1">
                →
              </span>
            </button>
          </motion.div>
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
