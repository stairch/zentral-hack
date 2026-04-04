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
    "SchwyzNext",
  ],
}

function MarqueeRow({ items, direction = "left", speed = 30 }: { items: string[]; direction?: "left" | "right"; speed?: number }) {
  const duplicatedItems = [...items, ...items, ...items]

  return (
    <div className="relative overflow-hidden py-4">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{
          x: direction === "left" ? [0, -100 * items.length] : [-100 * items.length, 0],
        }}
        transition={{
          x: {
            duration: speed,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {duplicatedItems.map((item, index) => (
          <motion.div
            key={`${item}-${index}`}
            className="flex-shrink-0 px-8 py-4 bg-muted rounded-lg border border-border"
            whileHover={{ scale: 1.05, borderColor: "var(--violet)" }}
          >
            <span className="font-display font-bold text-foreground">{item}</span>
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
      ctaAction: "Kontaktiere uns",
    },
    en: {
      badge: "PARTNERS & SPONSORS",
      heading: "STRONGER",
      headingAccent: "TOGETHER",
      description: "Supported by leading companies and institutions in Central Switzerland.",
      organisers: "CO-ORGANIZERS",
      ctaQuestion: "Interested in a partnership?",
      ctaAction: "Contact us",
    },
  } as const

  const text = copy[language]

  return (
    <>
      <section id="partners" className="py-24 bg-muted/30 overflow-hidden">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <motion.div
            ref={headerRef}
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <motion.span
              className="inline-block px-4 py-2 rounded-full bg-violet/10 text-violet font-medium text-sm mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isHeaderInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {text.badge}
            </motion.span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              {text.heading} <span className="text-violet">{text.headingAccent}</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {text.description}
            </p>
          </motion.div>

          {/* Co-Organisers Marquee */}
          <div className="mb-16">
            <motion.h3
              className="text-center font-display font-bold text-xl text-foreground mb-6"
              initial={{ opacity: 0 }}
              animate={isHeaderInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 }}
            >
              {text.organisers}
            </motion.h3>
            <MarqueeRow items={partners.organisers} direction="left" speed={40} />
            <MarqueeRow items={partners.organisers} direction="right" speed={35} />
          </div>

          {/* Sponsor Tiers */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {sponsorPackages.map((tier, index) => (
              <motion.div
                key={tier.slug}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              >
                <motion.div
                  className="rounded-xl p-6 text-center h-48 flex flex-col items-center justify-center cursor-pointer transition-all border border-black/5"
                  style={{
                    background: `linear-gradient(135deg, ${tier.color} 0%, rgba(255,255,255,0.92) 100%)`,
                  }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => {
                    setSelectedPackageSlug(tier.slug)
                    setSponsorshipModalOpen(true)
                  }}
                >
                  <span className="font-display font-bold text-2xl text-foreground mb-2">
                    {tier.name.toUpperCase()}
                  </span>
                  <p className="text-sm text-foreground/75 max-w-[16rem] leading-relaxed">
                    {tier.shortDescription}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 }}
          >
            <p className="text-muted-foreground mb-4">
              {text.ctaQuestion}
            </p>
            <motion.button
              onClick={() => setSponsorshipModalOpen(true)}
              className="inline-flex items-center gap-2 text-violet font-semibold hover:underline"
              whileHover={{ x: 5 }}
            >
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
