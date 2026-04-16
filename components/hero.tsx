"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, MapPin } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { BrandMark } from "@/components/brand-mark"
import { BrandMountain } from "@/components/brand-mountain"

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

function RotatingText({ words }: { words: readonly string[] }) {
  const [index, setIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const measureRef = useRef<HTMLSpanElement>(null)
  const width = useMotionValue(0)
  const widthSpring = useSpring(width, { stiffness: 120, damping: 18 })

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [words])

  useEffect(() => {
    if (measureRef.current) {
      width.set(measureRef.current.offsetWidth + 5)
    }
  }, [displayIndex, words])

  const letters = words[displayIndex].split("")

  return (
    <motion.span
      className="relative inline-block overflow-hidden align-middle"
      style={{ width: widthSpring, height: "1.3em" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: (letters.length - 1) * 0.02 }}>
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
            <motion.span
              key={i}
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
          ))}
        </motion.span>
      </AnimatePresence>

      <motion.span className="bg-secondary absolute bottom-0 left-0 h-0.5" style={{ width: widthSpring }} />
    </motion.span>
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
    <section className="bg-background relative isolate min-h-svh overflow-hidden pt-16 sm:pb-70">
      <motion.div
        className="absolute inset-0 opacity-35"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(213, 194, 247, 0.7) 0%, transparent 36%), radial-gradient(circle at 85% 18%, rgba(230, 255, 23, 0.14) 0%, transparent 28%), radial-gradient(circle at 50% 60%, rgba(83, 10, 93, 0.12) 0%, transparent 48%)"
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="from-background via-background/90 absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent" />

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <FloatingParticle key={particle.id} {...particle} />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto mt-14 px-4 pb-32 text-center sm:mt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-4 flex flex-col items-center gap-8 sm:gap-10">
          <div className="bg-light-violet/30 border-light-violet inline-flex items-center gap-2 rounded-full border px-3 py-1.5 sm:px-4 sm:py-2">
            <Calendar className="text-violet h-4 w-4" />
            <span className="text-violet text-sm font-medium">{text.date}</span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center">
            <BrandMark
              className="h-fit w-52 sm:w-64 md:w-72 lg:w-80 xl:w-96"
              imageClassName="mx-auto"
              priority
            />
          </motion.h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="font-display text-violet/20 mb-8 text-6xl font-bold md:text-7xl lg:text-8xl">
          2026
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-muted-foreground mx-auto mb-8 max-w-2xl text-center text-lg md:text-2xl">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-muted-foreground mb-12 inline-flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          <span>{text.location}</span>
        </motion.div>

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

      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 left-0 z-0 mx-auto flex max-w-3xl scale-120 justify-center opacity-32"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}>
        <BrandMountain className="w-[min(118vw,1460px)]" imageClassName="mx-auto" wide />
      </motion.div>
    </section>
  )
}
