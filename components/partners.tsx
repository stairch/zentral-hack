"use client"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { SponsorshipModal } from "./sponsorship-modal"

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
  sponsorTiers: [
    { tier: "PLATIN", color: "bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300" },
    { tier: "GOLD", color: "bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400" },
    { tier: "SILBER", color: "bg-gradient-to-r from-gray-400 via-gray-200 to-gray-400" },
    { tier: "BRONZE", color: "bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" },
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
              PARTNER & SPONSOREN
            </motion.span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              GEMEINSAM <span className="text-violet">STÄRKER</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Unterstützt von führenden Unternehmen und Institutionen der Zentralschweiz.
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
              CO-ORGANISATOREN
            </motion.h3>
            <MarqueeRow items={partners.organisers} direction="left" speed={40} />
            <MarqueeRow items={partners.organisers} direction="right" speed={35} />
          </div>

          {/* Sponsor Tiers */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {partners.sponsorTiers.map((tier, index) => (
              <motion.div
                key={tier.tier}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              >
                <motion.div
                  className={`${tier.color} rounded-xl p-6 text-center h-40 flex flex-col items-center justify-center cursor-pointer transition-all`}
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => setSponsorshipModalOpen(true)}
                >
                  <span className="font-display font-bold text-2xl text-foreground/80 mb-2">
                    {tier.tier}
                  </span>
                  <span className="text-sm text-foreground/60">Sponsor werden</span>
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
              Interessiert an einer Partnerschaft?
            </p>
            <motion.button
              onClick={() => setSponsorshipModalOpen(true)}
              className="inline-flex items-center gap-2 text-violet font-semibold hover:underline"
              whileHover={{ x: 5 }}
            >
              Kontaktiere uns
              <span aria-hidden="true">→</span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Sponsorship Modal */}
      <SponsorshipModal
        isOpen={sponsorshipModalOpen}
        onClose={() => setSponsorshipModalOpen(false)}
      />
    </>
  )
}
