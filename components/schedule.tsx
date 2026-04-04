"use client"

import { useRef, useState } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { Clock, Coffee, Utensils, Presentation, Code, PartyPopper, Sun, Moon } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

const scheduleDay1 = [
  {
    time: "17:00",
    event: { de: "Check-in", en: "Check-in" },
    icon: Clock,
    description: { de: "Empfang und Registrierung", en: "Welcome and registration" },
  },
  {
    time: "18:00",
    event: { de: "Begrüssung", en: "Welcome" },
    icon: Presentation,
    description: { de: "Willkommen zum Zentral Hack", en: "Welcome to Zentral Hack" },
  },
  {
    time: "18:30",
    event: { de: "Challenge Pitches", en: "Challenge Pitches" },
    icon: Presentation,
    description: { de: "Vorstellung der Challenges", en: "Introduction to all challenges" },
  },
  {
    time: "19:00",
    event: { de: "Teambildung & Apéro", en: "Team Matching & Apéro" },
    icon: Coffee,
    description: { de: "Finde dein Team bei Sponsoren-Apéro", en: "Find your team during the sponsor apéro" },
  },
  {
    time: "19:30",
    event: { de: "Start des Hacks", en: "Hack Starts" },
    icon: Code,
    description: { de: "Los geht's!", en: "Let's go!" },
  },
  {
    time: "20:00",
    event: { de: "Dinner Buffet", en: "Dinner Buffet" },
    icon: Utensils,
    description: { de: "Stärkung für die Nacht", en: "Fuel up for the night" },
  },
  {
    time: "23:00",
    event: { de: "Night Special", en: "Night Special" },
    icon: PartyPopper,
    description: { de: "Überraschung!", en: "Surprise!" },
  },
]

const scheduleDay2 = [
  {
    time: "08:00",
    event: { de: "Frühstücksbuffet", en: "Breakfast Buffet" },
    icon: Coffee,
    description: { de: "Energie für den Tag", en: "Energy for the day" },
  },
  {
    time: "10:00",
    event: { de: "Referate & Speeches", en: "Talks & Speeches" },
    icon: Presentation,
    description: { de: "Inspirierende Vorträge", en: "Inspiring talks" },
  },
  {
    time: "12:00",
    event: { de: "Lunchbuffet", en: "Lunch Buffet" },
    icon: Utensils,
    description: { de: "Mittagspause", en: "Lunch break" },
  },
  {
    time: "16:00",
    event: { de: "Nachmittagssnack", en: "Afternoon Snack" },
    icon: Coffee,
    description: { de: "Letzte Energie", en: "Final energy boost" },
  },
  {
    time: "19:00",
    event: { de: "Abschlusspräsentationen", en: "Final Presentations" },
    icon: Presentation,
    description: { de: "Zeigt was ihr geschafft habt", en: "Show what you have built" },
  },
  {
    time: "22:00",
    event: { de: "Ende & Preisverleihung", en: "Closing & Awards" },
    icon: PartyPopper,
    description: { de: "Feier mit uns!", en: "Celebrate with us!" },
  },
]

const copy = {
  de: {
    badge: "ZEITPLAN",
    heading: "24 STUNDEN",
    headingAccent: "INNOVATION",
    description: "Ein intensives Wochenende voller Code, Kreativität und Zusammenarbeit.",
    day1: "FREITAG, 23.10.",
    day2: "SAMSTAG, 24.10.",
  },
  en: {
    badge: "SCHEDULE",
    heading: "24 HOURS",
    headingAccent: "OF INNOVATION",
    description: "An intense weekend full of code, creativity, and collaboration.",
    day1: "FRIDAY, 23 OCT",
    day2: "SATURDAY, 24 OCT",
  },
} as const

function TimelineItem({
  item,
  index,
  isLeft,
  language,
}: {
  item: (typeof scheduleDay1)[0]
  index: number
  isLeft: boolean
  language: "de" | "en"
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`flex items-center gap-4 ${isLeft ? "md:flex-row-reverse md:text-right" : ""}`}
    >
      {/* Content */}
      <motion.div
        className="flex-1 bg-background rounded-xl p-4 border border-border shadow-sm"
        whileHover={{ scale: 1.02, boxShadow: "0 10px 40px -10px rgba(83, 10, 93, 0.2)" }}
      >
        <div className={`flex items-center gap-3 mb-2 ${isLeft ? "md:flex-row-reverse" : ""}`}>
          <div className="w-10 h-10 rounded-full bg-violet/10 flex items-center justify-center">
            <item.icon className="w-5 h-5 text-violet" />
          </div>
          <div>
            <span
              className="text-yellow font-bold text-lg"
              style={{
                textShadow: "0 1px 2px rgba(0, 0, 0, 1)",
              }}
            >
              {item.time}
            </span>
            <h4 className="font-display font-bold text-foreground">{item.event[language]}</h4>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">{item.description[language]}</p>
      </motion.div>

      {/* Timeline dot */}
      <div className="hidden md:block relative">
        <motion.div
          className="w-4 h-4 rounded-full bg-violet border-4 border-background"
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
        />
      </div>
      <div className="hidden md:block flex-1" />
    </motion.div>
  )
}

export function Schedule() {
  const [activeDay, setActiveDay] = useState<1 | 2>(1)
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true })
  const { language } = useLanguage()
  const text = copy[language]

  const schedule = activeDay === 1 ? scheduleDay1 : scheduleDay2

  return (
    <section id="schedule" className="py-24 bg-background">
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
            className="inline-block px-4 py-2 rounded-full bg-yellow/30 text-foreground font-medium text-sm mb-4"
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
        <div className="flex justify-center gap-4 mb-12">
          <motion.button
            onClick={() => setActiveDay(1)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-display font-bold transition-all ${
              activeDay === 1
                ? "bg-violet text-white"
                : "bg-muted text-muted-foreground hover:bg-violet/10"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Moon className="w-5 h-5" />
            {text.day1}
          </motion.button>
          <motion.button
            onClick={() => setActiveDay(2)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-display font-bold transition-all ${
              activeDay === 2
                ? "bg-violet text-white"
                : "bg-muted text-muted-foreground hover:bg-violet/10"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sun className="w-5 h-5" />
            {text.day2}
          </motion.button>
        </div>

        {/* Timeline */}
        <div className="max-w-3xl mx-auto relative">
          {/* Timeline line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet via-light-violet to-yellow" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {schedule.map((item, index) => (
                <TimelineItem
                  key={item.time}
                  item={item}
                  index={index}
                  isLeft={index % 2 === 0}
                  language={language}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
