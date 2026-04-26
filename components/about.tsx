"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { Lightbulb, Users, Network, MapPin } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

const values = [
  {
    icon: Lightbulb,
    title: { de: "Innovation", en: "Innovation" },
    description: {
      de: "Plattform für neue Ideen und kreative Lösungen.",
      en: "A platform for new ideas and creative solutions."
    }
  },
  {
    icon: Users,
    title: { de: "Nachwuchs", en: "Next Generation" },
    description: {
      de: "Förderung der nächsten Generation von ICT-Talenten.",
      en: "Empowering the next generation of ICT talent."
    }
  },
  {
    icon: Network,
    title: { de: "Networking", en: "Networking" },
    description: {
      de: "Verbindung von Bildung, Wirtschaft und Community.",
      en: "Connecting education, business, and community."
    }
  },
  {
    icon: MapPin,
    title: { de: "Lokal", en: "Local" },
    description: {
      de: "Verankert in der Zentralschweiz.",
      en: "Rooted in Central Switzerland."
    }
  }
]

const copy = {
  de: {
    badge: "ÜBER UNS",
    headingPrefix: "EIN HACKATHON FÜR DIE",
    headingAccent: "ZENTRALSCHWEIZ",
    description:
      "Zentral Hack vereint bestehende Events und Hackathons zu einem gemeinsamen Grossevent. Wir bringen Bildung, Wirtschaft und Community zusammen, um Innovation und Nachwuchsförderung in der Region voranzutreiben.",
    stats: ["Stunden", "Kategorien", "Teilnehmende", "Ziel"]
  },
  en: {
    badge: "ABOUT",
    headingPrefix: "A HACKATHON FOR",
    headingAccent: "CENTRAL SWITZERLAND",
    description:
      "Zentral Hack unites existing events and hackathons into one large joint event. We bring education, business, and community together to advance innovation and young talent in the region.",
    stats: ["Hours", "Categories", "Participants", "Goal"]
  }
} as const

function CounterAnimation({ end, suffix = "", delay = 0 }: { end: number; suffix?: string; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)
  const duration = useRef(2000 + Math.random() * 1000)
  const startTime = useRef<number | null>(null)

  useEffect(() => {
    if (!isInView) return

    const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)

    const timeout = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTime.current) startTime.current = timestamp
        const elapsed = timestamp - startTime.current
        const progress = Math.min(elapsed / duration.current, 1)

        setCount(Math.floor(easeInOut(progress) * end))

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setCount(end)
        }
      }

      requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(timeout)
      startTime.current = null
    }
  }, [isInView, end, delay])

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  )
}

type ValueCardProps = {
  value: (typeof values)[number]
  index: number
  isInView: boolean
  language: "de" | "en"
}

function ValueCard({ value, index, isInView, language }: ValueCardProps) {
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [hasAppeared, setHasAppeared] = useState(false)

  const cardVariants = {
    rest: { opacity: 0, y: 30 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: hasAppeared ? 0.3 : 0.5,
        delay: hasAppeared ? 0 : 0.5 + index * 0.1
      }
    }),
    hover: {
      y: -5,
      transition: { duration: 0.3, delay: 0 }
    }
  }

  const handleHoverStart = () => {
    if (!isSpinning) {
      setRotation((prev) => prev + 360)
      setIsSpinning(true)
    }
  }

  return (
    <motion.div
      className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
      variants={cardVariants}
      custom={index}
      initial="rest"
      animate={isInView ? "visible" : "rest"}
      whileHover="hover"
      onHoverStart={handleHoverStart}
      onAnimationComplete={(definition) => {
        if (definition === "visible") setHasAppeared(true)
      }}>
      <motion.div
        className="bg-yellow/20 mb-4 flex h-12 w-12 items-center justify-center rounded-full"
        animate={{ rotate: rotation }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        onAnimationComplete={() => setIsSpinning(false)}>
        <value.icon className="text-yellow h-6 w-6" />
      </motion.div>
      <h3 className="font-display mb-2 text-xl font-bold text-white">{value.title[language]}</h3>
      <p className="text-light-violet text-sm">{value.description[language]}</p>
    </motion.div>
  )
}

export function About() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })
  const { language } = useLanguage()
  const text = copy[language]

  const [dbStats, setDbStats] = useState<
    { value: number; suffix: string; label_de: string; label_en: string }[] | null
  >(null)

  useEffect(() => {
    fetch("/api/site-settings?key=about_stats")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.data?.value)) setDbStats(d.data.value)
      })
      .catch(() => {})
  }, [])

  const stats = dbStats
    ? dbStats.map((s) => ({
        value: s.value,
        suffix: s.suffix,
        label: language === "en" ? s.label_en : s.label_de,
        ticking: s.value > 1
      }))
    : [
        { value: 24, suffix: "", label: text.stats[0], ticking: true },
        { value: 4, suffix: "", label: text.stats[1], ticking: true },
        { value: 200, suffix: "+", label: text.stats[2], ticking: true },
        { value: 1, suffix: "", label: text.stats[3], ticking: false }
      ]

  return (
    <section id="about" ref={sectionRef} className="bg-violet relative overflow-hidden py-24">
      <div className="relative z-10 container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}>
          <motion.span
            className="mb-4 inline-block rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}>
            {text.badge}
          </motion.span>
          <h2 className="font-display mb-6 text-4xl font-bold text-white md:text-5xl">
            {text.headingPrefix} <span className="text-yellow">{text.headingAccent}</span>
          </h2>
          <p className="text-light-violet mx-auto max-w-3xl text-lg leading-relaxed">{text.description}</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}>
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}>
              <div className="font-display text-yellow mb-2 text-5xl font-bold md:text-6xl">
                {stat.ticking ? (
                  <CounterAnimation end={stat.value} suffix={stat.suffix} delay={100} />
                ) : (
                  <>
                    {stat.value}
                    {stat.suffix}
                  </>
                )}
              </div>
              <div className="text-light-violet font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Values Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => (
            <ValueCard
              key={value.title.de}
              value={value}
              index={index}
              isInView={isInView}
              language={language}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
