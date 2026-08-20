"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, MapPin, HeartHandshake } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { BrandMark } from "@/components/brand-mark"
import { BrandMountain } from "@/components/brand-mountain"
import Image from "next/image"
import { srcWithVersion } from "@/lib/helpers"
import { getSponsorPackageByLanguage, type SponsorPackage } from "@/lib/sponsorship-packages"
import { cn } from "@/lib/utils"

const copy = {
  de: {
    date: "23.–24. OKTOBER 2026",
    subtitleLinePre: "Ein Hackathon für",
    subtitleLineRotate: ["Innovation", "Talente", "Networking"],
    subtitleLinePost: "in der Zentralschweiz.",
    location: "Hochschule Luzern Informatik, Rotkreuz",
    primaryCta: "Jetzt Registrieren",
    primaryCtaLoggedIn: "Zum Dashboard",
    secondaryCta: "Mehr Erfahren",
    sponsorsTitle: "Unterstützt von",
    allSponsors: "und weiteren Sponsoren"
  },
  en: {
    date: "23–24 OCTOBER 2026",
    subtitleLinePre: "A hackathon for",
    subtitleLineRotate: ["Innovation", "Talents", "Networking"],
    subtitleLinePost: "in Central Switzerland.",
    location: "Lucerne School of Computer Science, Rotkreuz",
    primaryCta: "Register Now",
    primaryCtaLoggedIn: "To Dashboard",
    secondaryCta: "Learn More",
    sponsorsTitle: "Supported by",
    allSponsors: "and other sponsors"
  }
} as const

interface Sponsor {
  id: string
  company_name: string
  status: string
  logo_url: string | null
  website_url: string | null
  logo_size: string | null
  tier: string | null
  logo_bg_color: string | null
  updated_at: number
}

// tierIndex: 0=Platin, 1=Gold, 2=Silber (first 3 tiers by display_order)
type SlotDef = {
  tierIndex: number
  left: string
  top: string
  rotate: number
  delay: number
  widthPx: number
  heightPx: number
  floatRange: number // vertical travel in px
  floatDuration: number // seconds per cycle
}

const SLOTS: SlotDef[] = [
  {
    tierIndex: 0,
    left: "34%",
    top: "2%",
    rotate: 0,
    delay: 0.8,
    widthPx: 300,
    heightPx: 120,
    floatRange: 14,
    floatDuration: 7
  },
  {
    tierIndex: 1,
    left: "12%",
    top: "62%",
    rotate: 0,
    delay: 1.5,
    widthPx: 170,
    heightPx: 70,
    floatRange: 12,
    floatDuration: 6.2
  },
  {
    tierIndex: 1,
    left: "68%",
    top: "62%",
    rotate: 0,
    delay: 1.5,
    widthPx: 150,
    heightPx: 50,
    floatRange: 10,
    floatDuration: 5.5
  }
]

const TIER_FALLBACK_NAMES = ["PLATIN", "GOLD", "SILBER"]

function FloatingParticle({ delay, duration, x }: { delay: number; duration: number; x: number }) {
  return (
    <motion.div
      className="absolute -bottom-30 h-2 w-2 rounded-full sm:bottom-0"
      style={{ backgroundColor: "#E6FF17", opacity: 0.6 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 1, 0],
        scale: [0, 1, 1.2, 1.2, 0],
        x: [x, x + 50, x - 30, x + 20, x - 10],
        y: [0, -100, -200, -300, -350]
      }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeOut" }}
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
              {letter === " " ? " " : letter}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>

      <motion.span className="bg-secondary absolute bottom-0 left-0 h-0.5" style={{ width: widthSpring }} />
    </motion.span>
  )
}

function SponsorFloat({ slot, sponsor }: { slot: SlotDef; sponsor: Sponsor | null }) {
  const hasLogo = sponsor?.logo_url

  // Scale the logo with the slot, keeping the per-sponsor logo_size ratio intact
  const logoWidth = sponsor
    ? Math.min((Number(sponsor.logo_size) || 50) * 3 * (slot.widthPx / 150), slot.widthPx)
    : slot.widthPx

  return (
    <motion.div
      className="absolute"
      style={{ left: slot.left, top: slot.top, rotate: slot.rotate }}
      initial={{ opacity: 0, scale: 0.85, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: slot.delay, ease: "easeOut" }}>
      <motion.div
        animate={{ y: [0, -slot.floatRange, 0, slot.floatRange * 0.6, 0] }}
        transition={{
          duration: slot.floatDuration,
          delay: slot.delay,
          repeat: Infinity,
          ease: "easeInOut"
        }}>
        {hasLogo && (
          <div
            style={{
              width: slot.widthPx,
              height: slot.heightPx,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}>
            <Image
              src={srcWithVersion(`/api/sponsor-logo?id=${sponsor.id}`, sponsor.updated_at)}
              alt={sponsor.company_name}
              width={slot.widthPx}
              height={slot.heightPx}
              style={{ width: `${logoWidth}px`, maxWidth: "100%", height: "auto" }}
              className="object-contain"
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function MobileSponsorTile({
  sponsor,
  tierName,
  variant
}: {
  sponsor: Sponsor | null
  tierName: string
  variant: "platin" | "gold"
}) {
  const isPlatin = variant === "platin"
  const boxWidth = isPlatin ? 220 : 130
  const boxHeight = isPlatin ? 90 : 56

  const logoWidth = sponsor
    ? Math.min((Number(sponsor.logo_size) || 50) * 3 * (boxWidth / 150), boxWidth)
    : boxWidth

  return (
    <div className={cn("flex items-center justify-center overflow-hidden")}>
      {sponsor?.logo_url ? (
        <a
          href={sponsor.website_url ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(!sponsor.website_url && "pointer-events-none")}>
          <Image
            src={srcWithVersion(`/api/sponsor-logo?id=${sponsor.id}`, sponsor.updated_at)}
            alt={sponsor.company_name}
            width={boxWidth}
            height={boxHeight}
            style={{
              width: `${logoWidth}px`,
              maxWidth: "100%",
              height: "auto",
              background:
                sponsor.logo_bg_color && sponsor.logo_bg_color !== "transparent"
                  ? sponsor.logo_bg_color
                  : undefined
            }}
            className="object-contain"
          />
        </a>
      ) : (
        <span
          className={cn(
            "text-muted-foreground/50 font-medium tracking-widest",
            isPlatin ? "text-xs" : "text-[10px]"
          )}>
          {tierName}
        </span>
      )}
    </div>
  )
}

export function Hero() {
  const [particles, setParticles] = useState<
    Array<{ id: number; delay: number; duration: number; x: number }>
  >([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [packages, setPackages] = useState<SponsorPackage[]>([])
  const { language } = useLanguage()
  const { user } = useAuth()
  const text = copy[language]

  useEffect(() => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 2,
      x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000)
    }))
    setParticles(newParticles)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pkgRes, sponsorRes] = await Promise.all([
          fetch("/api/sponsor-contact"),
          fetch("/api/sponsors")
        ])
        if (pkgRes.ok) {
          const json = await pkgRes.json()
          const list = (json.data?.packages || []) as SponsorPackage[]
          setPackages([...list].sort((a, b) => a.display_order - b.display_order))
        }
        if (sponsorRes.ok) {
          const json = await sponsorRes.json()
          const list = (json.data?.sponsors || []) as Sponsor[]
          setSponsors(list)
        }
      } catch {
        // ignore – show placeholder tiles
      }
    }
    void fetchData()
  }, [])

  // Map each slot to a sponsor (or null for placeholder)
  const sponsorsByTier = new Map<number, Sponsor[]>()
  packages.slice(0, 3).forEach((pkg, tierIndex) => {
    sponsorsByTier.set(
      tierIndex,
      sponsors.filter((s) => s.tier === pkg.id && s.status === "published" && s.logo_url)
    )
  })

  const tierSlotCount = [0, 0, 0]
  const slotSponsors = SLOTS.map((slot) => {
    const count = tierSlotCount[slot.tierIndex]
    tierSlotCount[slot.tierIndex] = count + 1
    return (sponsorsByTier.get(slot.tierIndex) ?? [])[count] ?? null
  })

  // Mobile tiers: platinum in the center column, gold on the outside
  const platinum = sponsorsByTier.get(0) ?? []
  const gold = sponsorsByTier.get(1) ?? []

  const mobileRowCount = Math.max(platinum.length, Math.ceil(gold.length / 2), 1)
  const mobileRows = Array.from({ length: mobileRowCount }, (_, row) => ({
    left: gold[row * 2] ?? null,
    center: platinum[row] ?? null,
    right: gold[row * 2 + 1] ?? null
  }))

  function getTierName(tierIndex: number): string {
    const pkg = packages[tierIndex]
    if (pkg) return getSponsorPackageByLanguage(pkg, language).name.toUpperCase()
    return TIER_FALLBACK_NAMES[tierIndex] ?? "LOGO"
  }

  return (
    <section className="bg-background relative isolate overflow-hidden pt-16 pb-40 sm:pb-96">
      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <FloatingParticle key={particle.id} {...particle} />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto mt-14 px-4 sm:mt-28">
        <div className="mb-4 grid items-start gap-20 lg:grid-cols-2 lg:gap-8">
          {/* Left: Text content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-8 sm:gap-12">
            {/* Date badge */}
            <div className="bg-secondary/30 text-primary border-secondary inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 sm:px-4 sm:py-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">{text.date}</span>
            </div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col gap-0">
              <BrandMark className="h-fit w-52 sm:w-64 md:w-72 lg:w-80" priority />
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="font-display text-violet/20 text-6xl font-bold md:text-7xl lg:text-8xl">
                2026
              </motion.span>
            </motion.h1>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-muted-foreground max-w-2xl text-lg md:text-2xl">
              <span>{text.subtitleLinePre}</span> <RotatingText words={text.subtitleLineRotate} />{" "}
              <span>{text.subtitleLinePost}</span>
            </motion.div>

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="text-muted-foreground inline-flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>{text.location}</span>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="flex flex-col gap-4 sm:flex-row">
              <Link href={user ? "/dashboard" : "/anmeldung"}>
                <Button
                  size="lg"
                  className="bg-violet hover:bg-violet/90 group w-full px-8 py-6 text-lg font-semibold text-white sm:w-auto">
                  {user ? text.primaryCtaLoggedIn : text.primaryCta}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a href="#about">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-violet text-violet hover:bg-violet w-full px-8 py-6 text-lg font-semibold duration-300 hover:text-white sm:w-auto">
                  {text.secondaryCta}
                </Button>
              </a>
            </motion.div>
          </motion.div>

          {/* Mobile sponsor grid*/}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "60px" }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="block lg:hidden">
            <div className="flex h-full items-center justify-start">
              <div className="text-primary/50 flex items-center text-center text-xs tracking-widest uppercase">
                <HeartHandshake className="group mr-2 h-4 w-4" />
                {text.sponsorsTitle}
              </div>
            </div>

            <div className="mt-10 mb-16">
              {mobileRows.map((row, i) => (
                <div key={i} className="grid grid-cols-3 items-center gap-5">
                  <MobileSponsorTile sponsor={row.center} tierName={getTierName(0)} variant="platin" />
                  <MobileSponsorTile sponsor={row.left} tierName={getTierName(1)} variant="gold" />
                  <MobileSponsorTile sponsor={row.right} tierName={getTierName(1)} variant="gold" />
                </div>
              ))}
            </div>
            <div className="flex h-full items-end justify-end">
              <Link
                href="/#partners"
                className="group text-primary/50 hover:text-primary flex items-center text-center text-xs transition-colors duration-150">
                {text.allSponsors}
                <ArrowRight className="group group-hover:text-primary ml-1 h-3 w-3 transition-all group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* Right: Floating sponsor logos */}
          <div className="hidden h-full flex-col lg:flex">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex h-full items-center justify-center">
              <div className="text-primary/50 flex items-center text-center text-xs tracking-widest uppercase">
                <HeartHandshake className="group mr-2 h-4 w-4" />
                {text.sponsorsTitle}
              </div>
            </motion.div>
            <div className="relative mt-30 min-h-[400px]">
              {SLOTS.map((slot, i) => (
                <SponsorFloat key={i} slot={slot} sponsor={slotSponsors[i]} />
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex h-full items-end justify-end">
              <Link
                href="/#partners"
                className="group text-primary/50 hover:text-primary flex items-center text-center text-xs transition-colors duration-150">
                {text.allSponsors}
                <ArrowRight className="group group-hover:text-primary ml-1 h-3 w-3 transition-all group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 left-0 z-0 mx-auto flex max-w-3xl translate-y-10 scale-120 justify-center opacity-32"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}>
        <BrandMountain className="w-[min(118vw,1460px)]" imageClassName="mx-auto" wide />
      </motion.div>
    </section>
  )
}
