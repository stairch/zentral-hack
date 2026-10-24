"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { localize, type EventPhaseConfig } from "@/lib/event-phase"
import Instagram from "@/assets/icons/instagram.svg"
import GitHub from "@/assets/icons/github.svg"

const socialLinks = [
  { icon: Instagram, href: "https://www.instagram.com/zentralhack/", label: "Instagram" },
  { icon: GitHub, href: "https://github.com/stairch/zentral-hack/", label: "GitHub" }
]

export function PostEventCTA({ content }: { content: EventPhaseConfig["cta"] }) {
  const { language } = useLanguage()

  return (
    <section className="bg-violet relative overflow-hidden py-24">
      <div className="relative z-10 container mx-auto flex flex-col items-center gap-6 px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="font-display text-yellow text-4xl font-bold uppercase md:text-5xl">
          {localize(content.heading, language)}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-light-violet max-w-md text-base leading-relaxed">
          {localize(content.description, language)}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex gap-4">
          {socialLinks.map((social) => (
            <motion.a
              key={social.label}
              href={social.href}
              target="_blank"
              className="hover:text-yellow hover:fill-yellow flex h-12 w-12 items-center justify-center rounded-full border border-white/25 fill-white/80 text-white/80 transition-colors"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              aria-label={social.label}>
              <social.icon className="h-5 w-5" />
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
