"use client"

import { useRef, useState, useEffect } from "react"
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
  Star,
  Zap,
  Music,
  Trophy,
  type LucideIcon
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  clock: Clock,
  coffee: Coffee,
  utensils: Utensils,
  presentation: Presentation,
  code: Code,
  "party-popper": PartyPopper,
  sun: Sun,
  moon: Moon,
  star: Star,
  zap: Zap,
  music: Music,
  trophy: Trophy
}
import { useLanguage } from "@/lib/language-context"

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
  item: ScheduleEntry
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
      className={`font-display flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 font-semibold transition-colors duration-300 ${
        isActive ? "bg-primary text-white" : "bg-muted text-muted-foreground"
      }`}>
      <motion.span>
        <Icon className="h-3.5 w-3.5" />
      </motion.span>
      {label}
    </motion.button>
  )
}

type ScheduleEntry = {
  time: string
  event: { de: string; en: string }
  icon: LucideIcon
  description: { de: string; en: string }
}

function dbToEntry(item: {
  time: string
  icon: string
  title_de: string
  title_en: string
  description_de: string
  description_en: string
}): ScheduleEntry {
  return {
    time: item.time,
    icon: iconMap[item.icon] ?? Clock,
    event: { de: item.title_de, en: item.title_en },
    description: { de: item.description_de, en: item.description_en }
  }
}

export function Schedule() {
  const [activeDay, setActiveDay] = useState<1 | 2>(1)
  const [dbDay1, setDbDay1] = useState<ScheduleEntry[] | null>(null)
  const [dbDay2, setDbDay2] = useState<ScheduleEntry[] | null>(null)
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true })
  const { language } = useLanguage()
  const text = copy[language]

  useEffect(() => {
    fetch("/api/schedule")
      .then((r) => r.json())
      .then((d) => {
        const items = d.data?.items ?? []
        if (items.length > 0) {
          setDbDay1(items.filter((i: { day: number }) => i.day === 1).map(dbToEntry))
          setDbDay2(items.filter((i: { day: number }) => i.day === 2).map(dbToEntry))
        }
      })
      .catch(() => {})
  }, [])

  const schedule = activeDay === 1 ? (dbDay1 ?? []) : (dbDay2 ?? [])

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
