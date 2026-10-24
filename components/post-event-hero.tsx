"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { BrandMountain } from "@/components/brand-mountain"
import { localize, type EventPhaseConfig, type PostEventStats } from "@/lib/event-phase"

const copy = {
  de: {
    participants: "Teilnehmende",
    teams: "Teams",
    sponsors: "Partner & Sponsoren"
  },
  en: {
    participants: "Participants",
    teams: "Teams",
    sponsors: "Partners & Sponsors"
  }
} as const

export function PostEventHero({ hero, stats }: { hero: EventPhaseConfig["hero"]; stats: PostEventStats }) {
  const { language } = useLanguage()
  const text = copy[language]

  return (
    <section className="bg-background relative isolate flex min-h-screen items-center overflow-hidden pt-20 pb-24 sm:pb-40">
      <div className="relative z-10 container mx-auto flex flex-col items-center gap-6 px-4 text-center">
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-secondary text-violet inline-block rounded-full px-5 py-2 text-sm font-semibold tracking-wide">
          {localize(hero.date, language)}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-foreground max-w-3xl text-5xl font-bold uppercase sm:text-6xl">
          {localize(hero.heading, language)}
          <br />
          <span className="text-violet">{localize(hero.headingAccent, language)}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-muted-foreground max-w-xl text-lg leading-relaxed">
          {localize(hero.description, language)}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-2 flex items-stretch divide-x">
          <div className="flex flex-col items-center gap-1 px-8">
            <span className="font-display text-violet text-4xl font-bold">{stats.participants}</span>
            <span className="text-muted-foreground text-sm font-medium">{text.participants}</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-8">
            <span className="font-display text-violet text-4xl font-bold">{stats.teams}</span>
            <span className="text-muted-foreground text-sm font-medium">{text.teams}</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-8">
            <span className="font-display text-violet text-4xl font-bold">{stats.sponsors}</span>
            <span className="text-muted-foreground text-sm font-medium">{text.sponsors}</span>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-[-40px] left-0 z-0 mx-auto flex max-w-3xl justify-center opacity-55"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 0.55, y: 0 }}
        transition={{ duration: 1, delay: 0.4 }}>
        <BrandMountain className="w-[min(100vw,820px)]" imageClassName="mx-auto" wide />
      </motion.div>
    </section>
  )
}
