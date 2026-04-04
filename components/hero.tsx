"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, MapPin } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"

const copy = {
  de: {
    date: "23. - 24. OKTOBER 2026",
    subtitleLine1: "Ein Hackathon für die",
    subtitleAccent: "Zentralschweiz",
    subtitleLine2: "Innovation, Nachwuchs und Networking.",
    location: "HSLU - Hochschule Luzern",
    primaryCta: "Jetzt Anmelden",
    primaryCtaLoggedIn: "Zum Dashboard",
    secondaryCta: "Mehr Erfahren",
  },
  en: {
    date: "23 - 24 OCTOBER 2026",
    subtitleLine1: "A hackathon for",
    subtitleAccent: "Central Switzerland",
    subtitleLine2: "Innovation, young talent, and networking.",
    location: "HSLU - Lucerne University of Applied Sciences",
    primaryCta: "Register Now",
    primaryCtaLoggedIn: "To Dashboard",
    secondaryCta: "Learn More",
  },
} as const

function FloatingParticle({ delay, duration, x, y }: { delay: number; duration: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: "#E6FF17", opacity: 0.6 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1, 1.2, 0],
        x: [x, x + 50, x - 30, x + 20],
        y: [y, y - 100, y - 200, y - 300],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  )
}

function AnimatedMountain() {
  return (
    <motion.svg
      viewBox="0 0 800 400"
      className="w-full h-auto max-w-4xl mx-auto"
      initial="hidden"
      animate="visible"
    >
      {/* Background mountain - light violet */}
      <motion.path
        d="M0 400 L200 150 L400 300 L600 100 L800 400 Z"
        fill="#D5C2F7"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: { duration: 1.5, ease: "easeOut" },
          },
        }}
      />
      {/* Foreground mountain - violet */}
      <motion.path
        d="M100 400 L300 200 L500 350 L700 180 L800 400 Z"
        fill="#530A5D"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: { duration: 1.5, delay: 0.3, ease: "easeOut" },
          },
        }}
      />
      {/* Accent peaks - yellow */}
      <motion.path
        d="M280 200 L300 170 L320 200"
        fill="#E6FF17"
        variants={{
          hidden: { scale: 0, opacity: 0 },
          visible: {
            scale: 1,
            opacity: 1,
            transition: { duration: 0.5, delay: 1.2, ease: "backOut" },
          },
        }}
      />
      <motion.path
        d="M680 180 L700 150 L720 180"
        fill="#E6FF17"
        variants={{
          hidden: { scale: 0, opacity: 0 },
          visible: {
            scale: 1,
            opacity: 1,
            transition: { duration: 0.5, delay: 1.4, ease: "backOut" },
          },
        }}
      />
    </motion.svg>
  )
}

export function Hero() {
  const [particles, setParticles] = useState<Array<{ id: number; delay: number; duration: number; x: number; y: number }>>([])
  const { language } = useLanguage()
  const { user } = useAuth()
  const text = copy[language]

  useEffect(() => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 2,
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
      y: (typeof window !== 'undefined' ? window.innerHeight : 800) - 100,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, #D5C2F7 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <FloatingParticle key={particle.id} {...particle} />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Date badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-light-violet/30 border border-light-violet mb-8"
        >
          <Calendar className="w-4 h-4 text-violet" />
          <span className="text-sm font-medium text-violet">{text.date}</span>
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4"
        >
          <span className="text-violet">ZENTRAL</span>
          <br />
          <motion.span
            className="text-yellow inline-block"
            style={{ textShadow: "2px 2px 0px #530A5D" }}
            animate={{
              textShadow: [
                "2px 2px 0px #530A5D",
                "4px 4px 0px #530A5D",
                "2px 2px 0px #530A5D",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            HACK
          </motion.span>
        </motion.h1>

        {/* Year */}
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="font-display text-6xl md:text-8xl font-bold text-violet/20 mb-8"
        >
          2026
        </motion.p>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          {text.subtitleLine1} <span className="text-violet font-semibold">{text.subtitleAccent}</span>.
          <br />
          {text.subtitleLine2}
        </motion.p>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="inline-flex items-center gap-2 text-muted-foreground mb-12"
        >
          <MapPin className="w-5 h-5" />
          <span>{text.location}</span>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href={user ? "/dashboard" : "/anmeldung"}>
            <Button
              size="lg"
              className="bg-violet hover:bg-violet/90 text-white font-semibold px-8 py-6 text-lg group"
            >
              {user ? text.primaryCtaLoggedIn : text.primaryCta}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <a href="#about">
            <Button
              size="lg"
              variant="outline"
              className="border-violet text-violet hover:bg-violet hover:text-white font-semibold px-8 py-6 text-lg"
            >
              {text.secondaryCta}
            </Button>
          </a>
        </motion.div>
      </div>

      {/* Animated Mountain Graphic */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <AnimatedMountain />
      </motion.div>
    </section>
  )
}
