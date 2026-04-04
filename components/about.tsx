"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Lightbulb, Users, Network, MapPin } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

const values = [
  {
    icon: Lightbulb,
    title: { de: "Innovation", en: "Innovation" },
    description: {
      de: "Plattform für neue Ideen und kreative Lösungen.",
      en: "A platform for new ideas and creative solutions.",
    },
  },
  {
    icon: Users,
    title: { de: "Nachwuchs", en: "Young Talent" },
    description: {
      de: "Förderung junger Talente der ICT-Branche.",
      en: "Supporting young talents in the ICT industry.",
    },
  },
  {
    icon: Network,
    title: { de: "Networking", en: "Networking" },
    description: {
      de: "Verbindung von Bildung, Wirtschaft und Community.",
      en: "Connecting education, business, and community.",
    },
  },
  {
    icon: MapPin,
    title: { de: "Lokal", en: "Local" },
    description: {
      de: "Verankert in der Zentralschweiz.",
      en: "Rooted in Central Switzerland.",
    },
  },
]

const copy = {
  de: {
    badge: "ÜBER UNS",
    headingPrefix: "EIN HACKATHON FÜR DIE",
    headingAccent: "ZENTRALSCHWEIZ",
    description:
      "Zentral Hack vereint bestehende Events und Hackathons zu einem gemeinsamen Grossevent. Wir bringen Bildung, Wirtschaft und Community zusammen, um Innovation und Nachwuchsförderung in der Region voranzutreiben.",
    stats: ["Hacken", "Kategorien", "Teilnehmer", "Ziel"],
  },
  en: {
    badge: "ABOUT",
    headingPrefix: "A HACKATHON FOR",
    headingAccent: "CENTRAL SWITZERLAND",
    description:
      "Zentral Hack unites existing events and hackathons into one large joint event. We bring education, business, and community together to advance innovation and young talent in the region.",
    stats: ["Hours", "Categories", "Participants", "Goal"],
  },
} as const

function CounterAnimation({ end, suffix = "" }: { end: number; suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
      >
        {isInView && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {end}{suffix}
          </motion.span>
        )}
      </motion.span>
    </motion.span>
  )
}

export function About() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })
  const { language } = useLanguage()
  const text = copy[language]

  return (
    <section id="about" ref={sectionRef} className="py-24 bg-violet relative overflow-hidden">
      {/* Static background */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 30%, #E6FF17 0%, transparent 50%),
                              radial-gradient(circle at 70% 70%, #D5C2F7 0%, transparent 50%)`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-block px-4 py-2 rounded-full bg-white/10 text-white font-medium text-sm mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {text.badge}
          </motion.span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
            {text.headingPrefix}{" "}
            <span className="text-yellow">{text.headingAccent}</span>
          </h2>
          <p className="text-light-violet max-w-3xl mx-auto text-lg leading-relaxed">
            {text.description}
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {[
            { value: 24, suffix: "h", label: text.stats[0] },
            { value: 4, suffix: "", label: text.stats[1] },
            { value: 200, suffix: "+", label: text.stats[2] },
            { value: 1, suffix: "", label: text.stats[3] },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <div className="font-display text-5xl md:text-6xl font-bold text-yellow mb-2">
                <CounterAnimation end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-light-violet font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <motion.div
              key={value.title.de}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              whileHover={{
                y: -5,
              }}
            >
              <motion.div
                className="w-12 h-12 rounded-full bg-yellow/20 flex items-center justify-center mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <value.icon className="w-6 h-6 text-yellow" />
              </motion.div>
              <h3 className="font-display font-bold text-white text-xl mb-2">
                {value.title[language]}
              </h3>
              <p className="text-light-violet text-sm">{value.description[language]}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
