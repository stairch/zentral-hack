"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface EventPhoto {
  id: string
  image_url: string
  caption: string | null
}

const PREVIEW_COUNT = 8

const copy = {
  de: {
    badge: "RÜCKBLICK",
    heading: "Die Highlights",
    description: "Fotos von zwei intensiven, inspirierenden Tagen.",
    empty: "Die Fotos folgen in Kürze.",
    showAll: (n: number) => `Alle ${n} ansehen`,
    showLess: "Weniger anzeigen"
  },
  en: {
    badge: "REVIEW",
    heading: "The Highlights",
    description: "Photos from two intense, inspiring days.",
    empty: "Photos coming soon.",
    showAll: (n: number) => `View all ${n}`,
    showLess: "Show less"
  }
} as const

export function EventGallerySection() {
  const { language } = useLanguage()
  const text = copy[language]
  const [photos, setPhotos] = useState<EventPhoto[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/post-event")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled) setPhotos(json?.data?.photos || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const visiblePhotos = open ? photos : photos.slice(0, PREVIEW_COUNT)

  return (
    <section id="gallery" className="bg-background py-24">
      <div className="container mx-auto px-4">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}>
          <span className="bg-secondary text-violet mb-4 inline-block rounded-full px-4 py-2 text-sm font-medium">
            {text.badge}
          </span>
          <h2 className="font-display text-foreground mb-4 text-4xl font-bold uppercase md:text-5xl">
            {text.heading}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl text-lg">{text.description}</p>
        </motion.div>

        {photos.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">{text.empty}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {visiblePhotos.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.id}
                  src={photo.image_url}
                  alt={photo.caption || ""}
                  className="aspect-square w-full rounded-2xl object-cover"
                  loading="lazy"
                />
              ))}
            </div>

            {photos.length > PREVIEW_COUNT && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => setOpen((prev) => !prev)}
                  className="border-violet text-violet hover:bg-violet/5 flex items-center gap-2 rounded-full border-[1.5px] bg-white px-6 py-3 text-sm font-bold transition-colors">
                  {open ? text.showLess : text.showAll(photos.length)}
                  <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
