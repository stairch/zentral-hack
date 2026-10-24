"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { eventPhotoSrc, localize, type EventPhaseConfig, type EventPhoto } from "@/lib/event-phase"

const PREVIEW_COUNT = 8

const copy = {
  de: {
    badge: "RÜCKBLICK",
    empty: "Die Fotos folgen in Kürze.",
    showAll: (n: number) => `Alle ${n} ansehen`,
    showLess: "Weniger anzeigen"
  },
  en: {
    badge: "REVIEW",
    empty: "Photos coming soon.",
    showAll: (n: number) => `View all ${n}`,
    showLess: "Show less"
  }
} as const

export function EventGallerySection({
  content,
  photos
}: {
  content: EventPhaseConfig["gallery"]
  photos: EventPhoto[]
}) {
  const { language } = useLanguage()
  const text = copy[language]
  const [open, setOpen] = useState(false)

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
            {localize(content.heading, language)}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl text-lg">
            {localize(content.description, language)}
          </p>
        </motion.div>

        {photos.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">{text.empty}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {visiblePhotos.map((photo) => (
                <div key={photo.id} className="group overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={eventPhotoSrc(photo.id)}
                    alt={photo.caption || ""}
                    className="aspect-square w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
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
