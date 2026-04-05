"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useInView, useMotionValue, useSpring } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  categoryDisplayOrder,
  getCategoryPresentationByLanguage,
  type CategoryRecord
} from "@/lib/category-config"
import { useLanguage } from "@/lib/language-context"

interface DisplayCategory {
  id?: string
  slug: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  textColor: string
  partnerName: string
  challengeDescription: string
  showChallengeDescription: boolean
}

function CategoryCard({
  category,
  index,
  onOpen,
  partnerLabel,
  detailsLabel
}: {
  category: DisplayCategory
  index: number
  onOpen: () => void
  partnerLabel: string
  detailsLabel: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { stiffness: 150, damping: 20, mass: 0.2 }
  const xSpring = useSpring(x, springConfig)
  const ySpring = useSpring(y, springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.05)
    y.set((e.clientY - centerY) * 0.05)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const cardVariants = {
    rest: { opacity: 0, y: 50, rotateX: -15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.6,
        delay: i * 0.15
      }
    }),
    hover: {
      scale: 1.02,
      transition: { duration: 0.3, delay: 0 }
    }
  }

  const cardStyle = {
    x: xSpring,
    y: ySpring,
    backgroundColor: category.color,
    color: category.textColor
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onOpen()
    }
  }

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      custom={index}
      initial="rest"
      animate={isInView ? "visible" : "rest"}
      whileHover="hover"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative cursor-pointer overflow-hidden rounded-2xl p-8"
      style={cardStyle}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}>
      {/* Animated background pattern */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, currentColor 1px, transparent 1px)`,
          backgroundSize: "20px 20px"
        }}
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Icon */}
      <div className="relative z-10 mb-6 w-fit">
        <category.icon className="h-12 w-12" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="font-display mb-3 text-2xl font-bold">{category.title}</h3>
        <p className="mb-4 leading-relaxed opacity-90">{category.description}</p>
        <p className="text-sm opacity-70">
          {partnerLabel}: {category.partnerName}
        </p>
        <p className="mt-4 text-xs opacity-70">{detailsLabel}</p>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </motion.div>
  )
}

export function Categories() {
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true })
  const [displayCategories, setDisplayCategories] = useState<DisplayCategory[]>(() =>
    categoryDisplayOrder.map((slug) => getCategoryPresentationByLanguage({ slug }, "de"))
  )
  const [selectedCategory, setSelectedCategory] = useState<DisplayCategory | null>(null)
  const { language } = useLanguage()

  const copy = {
    de: {
      badge: "CHALLENGES",
      heading: "WÄHLE DEINE",
      headingAccent: "KATEGORIE",
      description:
        "Vier spannende Kategorien warten auf dich. Finde deine Passion und löse Challenges, die einen echten Unterschied machen.",
      partner: "Partner",
      clickDetails: "Klicken für Details",
      challengeDescription: "Challenge-Beschrieb"
    },
    en: {
      badge: "CHALLENGES",
      heading: "CHOOSE YOUR",
      headingAccent: "CATEGORY",
      description:
        "Four exciting categories are waiting for you. Find your passion and solve challenges that make a real impact.",
      partner: "Partner",
      clickDetails: "Click for details",
      challengeDescription: "Challenge Description"
    }
  } as const

  const text = copy[language]

  // Fetch category content from DB (admin-editable)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories")
        if (!res.ok) return
        const data = await res.json()
        const dbCategories: CategoryRecord[] = data.data?.categories || []

        if (dbCategories.length === 0) return

        const orderedSlugs = Array.from(
          new Set([...categoryDisplayOrder, ...dbCategories.map((category) => category.slug)])
        )

        const merged = orderedSlugs.map((slug) => {
          const dbCategory = dbCategories.find((category) => category.slug === slug)
          return getCategoryPresentationByLanguage(dbCategory || { slug }, language)
        })

        setDisplayCategories(merged)
      } catch {
        // Keep fallback data on error
      }
    }
    fetchCategories()
  }, [language])

  return (
    <section id="categories" className="bg-muted/30 py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          ref={headerRef}
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}>
          <motion.span
            className="bg-light-violet/30 text-violet mb-4 inline-block rounded-full px-4 py-2 text-sm font-medium"
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

        {/* Categories Grid */}
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {displayCategories.map((category, index) => (
            <CategoryCard
              key={category.slug}
              category={category}
              index={index}
              onOpen={() => setSelectedCategory(category)}
              partnerLabel={text.partner}
              detailsLabel={text.clickDetails}
            />
          ))}
        </div>

        <Dialog open={Boolean(selectedCategory)} onOpenChange={(open) => !open && setSelectedCategory(null)}>
          <DialogContent className="sm:max-w-2xl">
            {selectedCategory ? (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display mt-4 text-3xl">{selectedCategory.title}</DialogTitle>
                  <DialogDescription className="text-muted-foreground text-base leading-relaxed">
                    {selectedCategory.description}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-2 space-y-4">
                  <div className="bg-muted/30 rounded-xl border p-4">
                    <p className="text-muted-foreground mb-2 text-xs tracking-wider uppercase">
                      {text.partner}
                    </p>
                    <p className="font-medium">{selectedCategory.partnerName}</p>
                  </div>

                  {selectedCategory.showChallengeDescription && selectedCategory.challengeDescription ? (
                    <div className="rounded-xl border p-4">
                      <p className="text-muted-foreground mb-2 text-xs tracking-wider uppercase">
                        {text.challengeDescription}
                      </p>
                      <p className="text-sm leading-relaxed md:text-base">
                        {selectedCategory.challengeDescription}
                      </p>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
