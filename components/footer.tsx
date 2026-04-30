"use client"

import { motion } from "framer-motion"
import { Github, Linkedin, Instagram, Mail } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { Emails } from "@/lib/constants"
import { BrandMark } from "@/components/brand-mark"

const footerLinks = {
  event: {
    de: [
      { label: "Über uns", href: "/#about" },
      { label: "Kategorien", href: "/#categories" },
      { label: "Zeitplan", href: "/#schedule" },
      { label: "FAQ", href: "/#faq" }
    ],
    en: [
      { label: "About", href: "/#about" },
      { label: "Categories", href: "/#categories" },
      { label: "Schedule", href: "/#schedule" },
      { label: "FAQ", href: "/#faq" }
    ]
  },
  legal: {
    de: [
      { label: "Impressum", href: "/impressum" },
      { label: "Datenschutz", href: "/datenschutz" },
      { label: "AGB", href: "/agb" }
    ],
    en: [
      { label: "Legal Notice", href: "/impressum" },
      { label: "Privacy", href: "/datenschutz" },
      { label: "Terms", href: "/agb" }
    ]
  },
  social: [
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Mail, href: Emails.infoZentralHack, label: "E-Mail" }
  ]
}

const copy = {
  de: {
    description:
      "Ein Hackathon für die Zentralschweiz. Verbindung von Bildung, Wirtschaft und Community für Innovation und Nachwuchsförderung.",
    event: "EVENT",
    legal: "RECHTLICHES",
    rights: "© 2026 Zentral Hack. Alle Rechte vorbehalten.",
    madeWith: "Erstellt mit",
    by: "von",
    and: "und",
    at: "bei"
  },
  en: {
    description:
      "A hackathon for Central Switzerland. Connecting education, business, and community for innovation and young talent.",
    event: "EVENT",
    legal: "LEGAL",
    rights: "© 2026 Zentral Hack. All rights reserved.",
    madeWith: "Made with",
    by: "by",
    and: "and",
    at: "at"
  }
} as const

export function Footer() {
  const { language } = useLanguage()
  const text = copy[language]
  const eventLinks = footerLinks.event[language]
  const legalLinks = footerLinks.legal[language]

  return (
    <footer className="bg-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 grid gap-12 md:grid-cols-4">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <motion.a href="/" className="mb-4 inline-block" whileHover={{ scale: 1.05 }}>
              <BrandMark className="w-32 sm:w-40" imageClassName="drop-shadow-sm" variant="light" priority />
            </motion.a>
            <p className="text-muted-foreground max-w-sm leading-relaxed">{text.description}</p>

            {/* Social Links */}
            <div className="mt-6 flex gap-4">
              {footerLinks.social.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="text-muted-foreground hover:text-yellow flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/10"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.label}>
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Event Links */}
          <div>
            <h4 className="font-display text-light-violet mb-4 font-bold">EVENT</h4>
            <ul className="space-y-3">
              {eventLinks.map((link) => (
                <li key={link.label}>
                  <motion.a
                    href={link.href}
                    className="text-muted-foreground hover:text-yellow transition-colors"
                    whileHover={{ x: 5 }}>
                    {link.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-display text-light-violet mb-4 font-bold">{text.legal}</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>
                    <motion.span
                      className="text-muted-foreground hover:text-yellow cursor-pointer transition-colors"
                      whileHover={{ x: 5 }}>
                      {link.label}
                    </motion.span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-muted-foreground text-sm">{text.rights}</p>
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <div>
              {text.madeWith} <span className="text-red-500">♥</span> {text.by}
            </div>
            <div className="flex items-center gap-1">
              <a
                href="https://www.linkedin.com/in/ahmad-el-hajj-chehade-461a61241/"
                target="_blank"
                className="bg-muted-foreground hover:bg-accent px-0.5 text-black transition-colors duration-300">
                Ahmad
              </a>
              <span>{text.and}</span>
              <a
                href="https://www.linkedin.com/in/andrin-schaller/"
                target="_blank"
                className="bg-muted-foreground hover:bg-accent px-0.5 text-black transition-colors duration-300">
                Andrin
              </a>
              <span>{text.at}</span>
              <a
                href="https://stair.ch"
                target="_blank"
                className="bg-muted-foreground px-0.5 text-black transition-colors duration-300 hover:bg-[#04956c]">
                STAIR
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
