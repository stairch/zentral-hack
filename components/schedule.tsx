"use client"

import { useRef, useState } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { Clock, Coffee, Utensils, Presentation, Code, PartyPopper, Sun, Moon } from "lucide-react"

const scheduleDay1 = [
  { time: "17:00", event: "Check-in", icon: Clock, description: "Empfang und Registrierung" },
  { time: "18:00", event: "Begrüssung", icon: Presentation, description: "Willkommen zum Zentral Hack" },
  { time: "18:30", event: "Challenge Pitches", icon: Presentation, description: "Vorstellung der Challenges" },
  { time: "19:00", event: "Teambildung & Apéro", icon: Coffee, description: "Finde dein Team bei Sponsoren-Apéro" },
  { time: "19:30", event: "Start des Hacks", icon: Code, description: "Los geht's!" },
  { time: "20:00", event: "Dinner Buffet", icon: Utensils, description: "Stärkung für die Nacht" },
  { time: "23:00", event: "Night Special", icon: PartyPopper, description: "Überraschung!" },
]

const scheduleDay2 = [
  { time: "08:00", event: "Frühstücksbuffet", icon: Coffee, description: "Energie für den Tag" },
  { time: "10:00", event: "Referate & Speeches", icon: Presentation, description: "Inspirierende Vorträge" },
  { time: "12:00", event: "Lunchbuffet", icon: Utensils, description: "Mittagspause" },
  { time: "16:00", event: "Nachmittagssnack", icon: Coffee, description: "Letzte Energie" },
  { time: "19:00", event: "Abschlusspräsentationen", icon: Presentation, description: "Zeigt was ihr geschafft habt" },
  { time: "22:00", event: "Ende & Preisverleihung", icon: PartyPopper, description: "Feier mit uns!" },
]

function TimelineItem({
  item,
  index,
  isLeft,
}: {
  item: (typeof scheduleDay1)[0]
  index: number
  isLeft: boolean
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
            <span className="text-yellow font-bold text-lg">{item.time}</span>
            <h4 className="font-display font-bold text-foreground">{item.event}</h4>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">{item.description}</p>
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

      {/* Spacer for alternating layout */}
      <div className="hidden md:block flex-1" />
    </motion.div>
  )
}

export function Schedule() {
  const [activeDay, setActiveDay] = useState<1 | 2>(1)
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true })

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
            ZEITPLAN
          </motion.span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            24 STUNDEN <span className="text-violet">INNOVATION</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Ein intensives Wochenende voller Code, Kreativität und Zusammenarbeit.
          </p>
        </motion.div>

        {/* Day Selector */}
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
            FREITAG, 23.10.
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
            SAMSTAG, 24.10.
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
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
