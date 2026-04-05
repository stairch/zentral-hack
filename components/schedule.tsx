"use client"

import { useRef, useState } from "react"
import { motion, useInView, AnimatePresence, useAnimate } from "framer-motion"
import {
  Clock,
  Coffee,
  Utensils,
  Presentation,
  Code,
  PartyPopper,
  Sun,
  Moon,
  type LucideIcon
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"

const scheduleDay1 = [
  {
    time: "17:00",
    event: { de: "Check-in", en: "Check-in" },
    icon: Clock,
    description: { de: "Empfang und Registrierung", en: "Welcome and registration" }
  },
  {
    time: "18:00",
    event: { de: "Begrüssung", en: "Welcome" },
    icon: Presentation,
    description: { de: "Willkommen zum Zentral Hack", en: "Welcome to Zentral Hack" }
  },
  {
    time: "18:30",
    event: { de: "Challenge Pitches", en: "Challenge Pitches" },
    icon: Presentation,
    description: { de: "Vorstellung der Challenges", en: "Introduction to all challenges" }
  },
  {
    time: "19:00",
    event: { de: "Teambildung & Apéro", en: "Team Matching & Apéro" },
    icon: Coffee,
    description: { de: "Finde dein Team bei Sponsoren-Apéro", en: "Find your team during the sponsor apéro" }
  },
  {
    time: "19:30",
    event: { de: "Start des Hacks", en: "Hack Starts" },
    icon: Code,
    description: { de: "Los geht's!", en: "Let's go!" }
  },
  {
    time: "20:00",
    event: { de: "Dinner Buffet", en: "Dinner Buffet" },
    icon: Utensils,
    description: { de: "Stärkung für die Nacht", en: "Fuel up for the night" }
  },
  {
    time: "23:00",
    event: { de: "Night Special", en: "Night Special" },
    icon: PartyPopper,
    description: { de: "Überraschung!", en: "Surprise!" }
  }
]

const scheduleDay2 = [
  {
    time: "08:00",
    event: { de: "Frühstücksbuffet", en: "Breakfast Buffet" },
    icon: Coffee,
    description: { de: "Energie für den Tag", en: "Energy for the day" }
  },
  {
    time: "10:00",
    event: { de: "Referate & Speeches", en: "Talks & Speeches" },
    icon: Presentation,
    description: { de: "Inspirierende Vorträge", en: "Inspiring talks" }
  },
  {
    time: "12:00",
    event: { de: "Lunchbuffet", en: "Lunch Buffet" },
    icon: Utensils,
    description: { de: "Mittagspause", en: "Lunch break" }
  },
  {
    time: "16:00",
    event: { de: "Nachmittagssnack", en: "Afternoon Snack" },
    icon: Coffee,
    description: { de: "Letzte Energie", en: "Final energy boost" }
  },
  {
    time: "19:00",
    event: { de: "Abschlusspräsentationen", en: "Final Presentations" },
    icon: Presentation,
    description: { de: "Zeigt was ihr geschafft habt", en: "Show what you have built" }
  },
  {
    time: "22:00",
    event: { de: "Ende & Preisverleihung", en: "Closing & Awards" },
    icon: PartyPopper,
    description: { de: "Feier mit uns!", en: "Celebrate with us!" }
  }
]

const copy = {
  de: {
    badge: "ZEITPLAN",
    heading: "24 STUNDEN",
    headingAccent: "INNOVATION",
    description: "Ein intensives Wochenende voller Code, Kreativität und Zusammenarbeit.",
    day1: "FREITAG, 23.10.",
    day2: "SAMSTAG, 24.10."
  },
  en: {
    badge: "SCHEDULE",
    heading: "24 HOURS",
    headingAccent: "OF INNOVATION",
    description: "An intense weekend full of code, creativity, and collaboration.",
    day1: "FRIDAY, 23 OCT",
    day2: "SATURDAY, 24 OCT"
  }
} as const

function TimelineItem({
  item,
  index,
  isLeft,
  language
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
      className={`flex items-center gap-4 ${isLeft ? "md:flex-row-reverse md:text-right" : ""}`}>
      {/* Content */}
      <div className="bg-muted border-border flex-1 rounded-xl border p-4 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
        <div className={`mb-2 flex items-center gap-3 ${isLeft ? "md:flex-row-reverse" : ""}`}>
          <div className="bg-primary/15 flex h-10 w-10 items-center justify-center rounded-full">
            <item.icon className="text-primary h-5 w-5" />
          </div>
          <div>
            <span className="text-foreground bg-accent rounded-sm px-1.5 py-0.5 text-sm font-medium">
              {item.time}
            </span>
            <h4 className="font-display text-foreground text-lg font-bold">{item.event[language]}</h4>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">{item.description[language]}</p>
      </div>

      {/* Timeline dot */}
      <div className="relative hidden md:block">
        <motion.div
          className="bg-violet border-background h-4 w-4 rounded-full border-4"
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
        />
      </div>
      <div className="hidden flex-1 md:block" />
    </motion.div>
  )
}

interface DayButtonProps {
  day: 1 | 2
  activeDay: 1 | 2
  setActiveDay: (day: 1 | 2) => void
  icon: LucideIcon
  label: string
}

function DayButton({ day, activeDay, setActiveDay, icon: Icon, label }: DayButtonProps) {
  const isActive = activeDay === day
  const [scope, animate] = useAnimate()

  const springConfig = {
    type: "spring" as const,
    stiffness: 500,
    damping: 22,
    mass: 0.8
  }

  const handleClick = () => {
    if (isActive) {
      animate(scope.current, { x: [0, -4, 4, -2, 2, -1, 1, 0] }, { duration: 0.4, ease: "easeInOut" })
    } else {
      animate(scope.current, { scale: [1, 0.96, 1] }, { duration: 0.3, ease: "easeOut" })
      setActiveDay(day)
    }
  }

  const handleHoverStart = () => {
    animate(
      "span",
      { rotate: isActive ? -15 : 8, scale: 1.2 },
      { type: "spring", stiffness: 500, damping: 18 }
    )
  }

  const handleHoverEnd = () => {
    animate("span", { rotate: 0, scale: 1 }, { type: "spring", stiffness: 500, damping: 18 })
  }

  return (
    <motion.button
      ref={scope}
      onPointerDown={handleClick}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      initial={{ opacity: 0, y: 16, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.04, y: -0 }}
      transition={springConfig}
      className={`font-display flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition-colors duration-300 ${
        isActive ? "bg-primary text-white" : "bg-muted text-muted-foreground"
      }`}>
      <motion.span>
        <Icon className="h-3.5 w-3.5" />
      </motion.span>
      {label}
    </motion.button>
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
    <section id="schedule" className="bg-background py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          ref={headerRef}
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}>
          <motion.span
            className="bg-yellow/30 text-foreground mb-4 inline-block rounded-full px-4 py-2 text-sm font-medium"
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
        <div className="mb-12 flex justify-center gap-4">
          <DayButton
            day={1}
            activeDay={activeDay}
            setActiveDay={setActiveDay}
            icon={Moon}
            label={text.day1}
          />
          <DayButton day={2} activeDay={activeDay} setActiveDay={setActiveDay} icon={Sun} label={text.day2} />
        </div>

        {/* Timeline */}
        <div className="relative mx-auto max-w-3xl">
          {/* Timeline line */}
          <div className="from-violet via-light-violet to-yellow absolute top-0 bottom-0 left-1/2 hidden w-0.5 bg-linear-to-b md:block" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6">
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
