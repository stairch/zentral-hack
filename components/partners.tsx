"use client"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { SponsorshipModal } from "./sponsorship-modal"
import { sponsorPackages } from "@/lib/sponsorship-packages"
import { useLanguage } from "@/lib/language-context"

const partners = {
  organisers: [
    "HSLU",
    "ICT Berufsbildung Zentralschweiz",
    "UMB AG",
    "Digital & AI Community",
    "getAbstract",
    "STAIR",
    "SchwyzNext"
  ]
}

function MarqueeRow({
  items,
  direction = "left",
  speed = 30
}: {
  items: string[]
  direction?: "left" | "right"
  speed?: number
}) {
  const duplicatedItems = [...items, ...items, ...items]

  return (
    <div className="relative overflow-hidden py-4">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{
          x: direction === "left" ? [0, -100 * items.length] : [-100 * items.length, 0]
        }}
        transition={{
          x: {
            duration: speed,
            repeat: Infinity,
            ease: "linear"
          }
        }}>
        {duplicatedItems.map((item, index) => (
          <motion.div
            key={`${item}-${index}`}
            className="bg-muted border-border flex-shrink-0 rounded-lg border px-8 py-4"
            whileHover={{ scale: 1.05, borderColor: "var(--violet)" }}>
            <span className="font-display text-foreground font-bold">{item}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
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
      ctaQuestion: "Interessiert an einer Partnerschaft?",
      ctaAction: "Kontaktiere uns"
    },
    en: {
      badge: "PARTNERS & SPONSORS",
      heading: "STRONGER",
      headingAccent: "TOGETHER",
      description: "Supported by leading companies and institutions in Central Switzerland.",
      organisers: "CO-ORGANIZERS",
      ctaQuestion: "Interested in a partnership?",
      ctaAction: "Contact us"
    }
  } as const

  const text = copy[language]

  return (
    <>
      <section id="partners" className="bg-muted/30 overflow-hidden py-24">
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
            <MarqueeRow items={partners.organisers} direction="left" speed={40} />
            <MarqueeRow items={partners.organisers} direction="right" speed={35} />
          </div>

          {/* Sponsor Tiers */}
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
            {sponsorPackages.map((tier, index) => (
              <motion.div
                key={tier.slug}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}>
                <motion.div
                  className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-black/5 p-6 text-center transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${tier.color} 0%, rgba(255,255,255,0.92) 100%)`
                  }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => {
                    setSelectedPackageSlug(tier.slug)
                    setSponsorshipModalOpen(true)
                  }}>
                  <span className="font-display text-foreground mb-2 text-2xl font-bold">
                    {tier.name.toUpperCase()}
                  </span>
                  <p className="text-foreground/75 max-w-[16rem] text-sm leading-relaxed">
                    {tier.shortDescription}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 }}>
            <p className="text-muted-foreground mb-4">{text.ctaQuestion}</p>
            <motion.button
              onClick={() => setSponsorshipModalOpen(true)}
              className="text-violet inline-flex items-center gap-2 font-semibold hover:underline"
              whileHover={{ x: 5 }}>
              {text.ctaAction}
              <span aria-hidden="true">→</span>
            </motion.button>
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
