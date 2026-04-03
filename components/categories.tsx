"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Sparkles, Brain, GraduationCap, Mountain } from "lucide-react"

const categories = [
  {
    title: "YOUNG TALENTS",
    description: "Für den Nachwuchs der ICT-Branche. Zeige dein Können und starte deine Karriere.",
    icon: Sparkles,
    color: "bg-yellow",
    textColor: "text-foreground",
    partner: "ICT Berufsbildung Zentralschweiz & UMB AG",
  },
  {
    title: "AI AGENTIC",
    description: "Entwickle innovative KI-Lösungen und intelligente Agenten der Zukunft.",
    icon: Brain,
    color: "bg-violet",
    textColor: "text-white",
    partner: "ICT Berufsbildung Zentralschweiz, Digital & AI Community & getAbstract",
  },
  {
    title: "CAMPUS CHALLENGE",
    description: "Die Herausforderung für Studierende. Kreativität trifft auf akademische Exzellenz.",
    icon: GraduationCap,
    color: "bg-light-violet",
    textColor: "text-violet",
    partner: "STAIR",
  },
  {
    title: "REGIONAL IMPACT",
    description: "Löse echte Probleme der Zentralschweiz. Dein Code für die Region.",
    icon: Mountain,
    color: "bg-violet",
    textColor: "text-white",
    partner: "SchwyzNext",
  },
]

function CategoryCard({
  category,
  index,
}: {
  category: (typeof categories)[0]
  index: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      whileHover={{ y: -10, scale: 1.02 }}
      className={`${category.color} ${category.textColor} rounded-2xl p-8 relative overflow-hidden group cursor-pointer`}
    >
      {/* Animated background pattern */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, currentColor 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Icon */}
      <motion.div
        className="relative z-10 mb-6"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
      >
        <category.icon className="w-12 h-12" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="font-display text-2xl font-bold mb-3">{category.title}</h3>
        <p className="opacity-90 mb-4 leading-relaxed">{category.description}</p>
        <p className="text-sm opacity-70">Partner: {category.partner}</p>
      </div>

      {/* Hover effect */}
      <motion.div
        className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={false}
      />
    </motion.div>
  )
}

export function Categories() {
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true })

  return (
    <section id="categories" className="py-24 bg-muted/30">
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
            className="inline-block px-4 py-2 rounded-full bg-light-violet/30 text-violet font-medium text-sm mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isHeaderInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            CHALLENGES
          </motion.span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            WÄHLE DEINE <span className="text-violet">KATEGORIE</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Vier spannende Kategorien warten auf dich. Finde deine Passion und löse Challenges, die einen echten Unterschied machen.
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {categories.map((category, index) => (
            <CategoryCard key={category.title} category={category} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
