"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useInView } from "framer-motion"
import { Sparkles, Brain, GraduationCap, Mountain } from "lucide-react"

// Static styling/metadata per category slug
const categoryMeta: Record<string, {
  icon: typeof Sparkles;
  color: string;
  textColor: string;
  partner: string;
  fallbackDescription: string;
}> = {
  "young-talents": {
    icon: Sparkles,
    color: "bg-yellow",
    textColor: "text-foreground",
    partner: "ICT Berufsbildung Zentralschweiz & UMB AG",
    fallbackDescription: "Für den Nachwuchs der ICT-Branche. Zeige dein Können und starte deine Karriere.",
  },
  "ai-agentic": {
    icon: Brain,
    color: "bg-violet",
    textColor: "text-white",
    partner: "ICT Berufsbildung Zentralschweiz, Digital & AI Community & getAbstract",
    fallbackDescription: "Entwickle innovative KI-Lösungen und intelligente Agenten der Zukunft.",
  },
  "campus-challenge": {
    icon: GraduationCap,
    color: "bg-light-violet",
    textColor: "text-violet",
    partner: "STAIR",
    fallbackDescription: "Die Herausforderung für Studierende. Kreativität trifft auf akademische Exzellenz.",
  },
  "regional-impact": {
    icon: Mountain,
    color: "bg-violet",
    textColor: "text-white",
    partner: "SchwyzNext",
    fallbackDescription: "Löse echte Probleme der Zentralschweiz. Dein Code für die Region.",
  },
}

// Display order for categories
const slugOrder = ["young-talents", "ai-agentic", "campus-challenge", "regional-impact"]

interface DBCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface DisplayCategory {
  title: string;
  description: string;
  icon: typeof Sparkles;
  color: string;
  textColor: string;
  partner: string;
}

function CategoryCard({
  category,
  index,
}: {
  category: DisplayCategory
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
  const [displayCategories, setDisplayCategories] = useState<DisplayCategory[]>(() =>
    // Start with fallback data so it renders immediately
    slugOrder.map((slug) => {
      const meta = categoryMeta[slug]!;
      return {
        title: slug.replace(/-/g, ' ').toUpperCase(),
        description: meta.fallbackDescription,
        icon: meta.icon,
        color: meta.color,
        textColor: meta.textColor,
        partner: meta.partner,
      };
    })
  );

  // Fetch descriptions from DB (admin-editable)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) return;
        const data = await res.json();
        const dbCategories: DBCategory[] = data.data?.categories || [];

        if (dbCategories.length === 0) return;

        // Merge DB descriptions with static styling
        const merged = slugOrder.map((slug) => {
          const meta = categoryMeta[slug]!;
          const dbCat = dbCategories.find((c) => c.slug === slug);
          return {
            title: dbCat?.name || slug.replace(/-/g, ' ').toUpperCase(),
            description: dbCat?.description || meta.fallbackDescription,
            icon: meta.icon,
            color: meta.color,
            textColor: meta.textColor,
            partner: meta.partner,
          };
        });

        setDisplayCategories(merged);
      } catch {
        // Keep fallback data on error
      }
    };
    fetchCategories();
  }, []);

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
          {displayCategories.map((category, index) => (
            <CategoryCard key={category.title} category={category} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
