"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, MapPin } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"

const copy = {
  de: {
    date: "23. - 24. OKTOBER 2026",
    subtitleLinePre: "Ein Hackathon für",
    subtitleLineRotate: ["Innovation", "Junge Talente", "Networking"],
    subtitleLinePost: "in der Zentralschweiz.",
    location: "HSLU - Hochschule Luzern",
    primaryCta: "Jetzt Registrieren",
    primaryCtaLoggedIn: "Zum Dashboard",
    secondaryCta: "Mehr Erfahren"
  },
  en: {
    date: "23 - 24 OCTOBER 2026",
    subtitleLinePre: "A hackathon for",
    subtitleLineRotate: ["Innovation", "Young Talent", "Networking"],
    subtitleLinePost: "in Central Switzerland.",
    location: "HSLU - Lucerne University of Applied Sciences",
    primaryCta: "Register Now",
    primaryCtaLoggedIn: "To Dashboard",
    secondaryCta: "Learn More"
  }
} as const

function FloatingParticle({
  delay,
  duration,
  x,
  y
}: {
  delay: number
  duration: number
  x: number
  y: number
}) {
  return (
    <motion.div
      className="absolute h-2 w-2 rounded-full"
      style={{ backgroundColor: "#E6FF17", opacity: 0.6 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1, 1.2, 0],
        x: [x, x + 50, x - 30, x + 20],
        y: [y, y - 100, y - 200, y - 300]
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeOut"
      }}
    />
  )
}

function AnimatedMountain() {
  return (
    <motion.svg
      viewBox="0 0 800 400"
      className="mx-auto h-auto w-full max-w-4xl"
      initial="hidden"
      animate="visible">
      {/* Background mountain - light violet */}
      <motion.path
        d="M0 400 L200 150 L400 300 L600 100 L800 400 Z"
        fill="#D5C2F7"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: { duration: 1.5, ease: "easeOut" }
          }
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
            transition: { duration: 1.5, delay: 0.3, ease: "easeOut" }
          }
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
            transition: { duration: 0.5, delay: 1.2, ease: "backOut" }
          }
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
            transition: { duration: 0.5, delay: 1.4, ease: "backOut" }
          }
        }}
      />
    </motion.svg>
  )
}

function RotatingText({ words }: { words: readonly string[] }) {
  const [index, setIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const measureRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLSpanElement>(null)
  const underlineWidth = useMotionValue(0)
  const underlineSpring = useSpring(underlineWidth, { stiffness: 120, damping: 18 })

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [words])

  useEffect(() => {
    const doMeasure = () => {
      if (measureRef.current && containerRef.current) {
        const w = measureRef.current.getBoundingClientRect().width + 8
        containerRef.current.style.width = `${w}px`
        underlineWidth.set(w)
      }
    }
    const raf = requestAnimationFrame(() => {
      if (document.fonts?.ready) {
        document.fonts.ready.then(doMeasure)
      } else {
        doMeasure()
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [displayIndex, words, underlineWidth])

  const letters = words[displayIndex].split("")

  return (
    <span
      ref={containerRef}
      className="relative inline-block align-middle"
      style={{ height: "1.3em", transition: "width 200ms ease" }}>
      <span
        ref={measureRef}
        className="pointer-events-none invisible absolute font-semibold whitespace-nowrap"
        aria-hidden>
        {words[displayIndex]}
      </span>

      <AnimatePresence mode="wait" onExitComplete={() => setDisplayIndex(index)}>
        <motion.span
          key={index}
          className="absolute inset-0 flex items-center justify-center whitespace-nowrap">
          {letters.map((letter, i) => (
            <span key={i} className="inline-block overflow-hidden" style={{ height: "1.3em" }}>
              <motion.span
                initial={{ y: "100%", opacity: 0 }}
                animate={{
                  y: "0%",
                  opacity: 1,
                  transition: {
                    type: "spring",
                    stiffness: 250,
                    damping: 25,
                    delay: (letters.length - 1 - i) * 0.015 + 0.2
                  }
                }}
                exit={{
                  y: "-80%",
                  opacity: 0,
                  transition: {
                    duration: 0.15,
                    delay: i * 0.01
                  }
                }}
                className="text-primary inline-block font-semibold">
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            </span>
          ))}
        </motion.span>
      </AnimatePresence>

      <motion.span
        className="bg-secondary absolute bottom-0 left-0 h-0.5"
        style={{ width: underlineSpring }}
      />
    </span>
  )
}

export function Hero() {
  const [particles, setParticles] = useState<
    Array<{ id: number; delay: number; duration: number; x: number; y: number }>
  >([])
  const { language } = useLanguage()
  const { user } = useAuth()
  const text = copy[language]

  useEffect(() => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 2,
      x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
      y: (typeof window !== "undefined" ? window.innerHeight : 800) - 100
    }))
    setParticles(newParticles)
  }, [])

  return (
    <section className="bg-background relative flex min-h-svh items-center justify-center overflow-hidden pt-16 md:min-h-screen md:pt-0">
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, #D5C2F7 0%, transparent 70%)"
        }}
        animate={{
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
          className="bg-light-violet/30 border-light-violet mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-2">
          <Calendar className="text-violet h-4 w-4" />
          <span className="text-violet text-sm font-medium">{text.date}</span>
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-display mb-4 text-6xl font-bold tracking-tight md:text-7xl lg:text-8xl">
          <span className="text-violet">ZENTRAL</span>
          <br />
          <motion.span
            className="text-yellow inline-block"
            style={{ textShadow: "2px 2px 0px #530A5D" }}
            animate={{
              textShadow: ["2px 2px 0px #530A5D", "4px 4px 0px #530A5D", "2px 2px 0px #530A5D"]
            }}
            transition={{ duration: 2, repeat: Infinity }}>
            HACK
          </motion.span>
        </motion.h1>

        {/* Year */}
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="font-display text-violet/20 mb-8 text-6xl font-bold md:text-7xl lg:text-8xl">
          2026
        </motion.p>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-muted-foreground mx-auto mb-8 max-w-2xl text-center text-lg md:text-2xl">
          {/* Mobile: stacked, Desktop: inline row */}
          <span className="md:hidden">
            <div className="leading-snug">{text.subtitleLinePre}</div>
            <div className="my-1 flex justify-center leading-snug">
              <RotatingText words={text.subtitleLineRotate} />
            </div>
            <div className="leading-snug">{text.subtitleLinePost}</div>
          </span>
          <span className="hidden md:inline-flex md:items-center md:gap-2 md:leading-relaxed">
            <span>{text.subtitleLinePre}</span>
            <RotatingText words={text.subtitleLineRotate} />
            <span>{text.subtitleLinePost}</span>
          </span>
        </motion.div>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-muted-foreground mb-12 inline-flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          <span>{text.location}</span>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link href={user ? "/dashboard" : "/anmeldung"}>
            <Button
              size="lg"
              className="bg-violet hover:bg-violet/90 group px-8 py-6 text-lg font-semibold text-white">
              {user ? text.primaryCtaLoggedIn : text.primaryCta}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <a href="#about">
            <Button
              size="lg"
              variant="outline"
              className="border-violet text-violet hover:bg-violet px-8 py-6 text-lg font-semibold duration-300 hover:text-white">
              {text.secondaryCta}
            </Button>
          </a>
        </motion.div>
      </div>

      {/* Animated Mountain Graphic */}
      <motion.div
        className="pointer-events-none absolute right-0 bottom-0 left-0"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}>
        <AnimatedMountain />
      </motion.div>
    </section>
  )
}
