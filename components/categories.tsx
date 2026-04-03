"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useInView } from "framer-motion"
import {
  categoryDisplayOrder,
  getCategoryPresentation,
  type CategoryRecord,
} from "@/lib/category-config"

interface DisplayCategory {
  id?: string;
  slug: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  textColor: string;
  partnerName: string;
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
      className="rounded-2xl p-8 relative overflow-hidden group cursor-pointer"
      style={{ backgroundColor: category.color, color: category.textColor }}
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
        <p className="text-sm opacity-70">Partner: {category.partnerName}</p>
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
    categoryDisplayOrder.map((slug) => getCategoryPresentation({ slug }))
  );

  // Fetch category content from DB (admin-editable)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) return;
        const data = await res.json();
        const dbCategories: CategoryRecord[] = data.data?.categories || [];

        if (dbCategories.length === 0) return;

        const orderedSlugs = Array.from(
          new Set([...categoryDisplayOrder, ...dbCategories.map((category) => category.slug)])
        );

        const merged = orderedSlugs.map((slug) => {
          const dbCategory = dbCategories.find((category) => category.slug === slug);
          return getCategoryPresentation(dbCategory || { slug });
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
            <CategoryCard key={category.slug} category={category} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
