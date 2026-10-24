"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "@/lib/language-context"
import { eventPhotoSrc, localize, type EventPhaseConfig, type EventPhoto } from "@/lib/event-phase"

const PREVIEW_COUNT = 8

const copy = {
  de: {
    badge: "RÜCKBLICK",
    empty: "Die Fotos folgen in Kürze.",
    showAll: (n: number) => `Alle ${n} ansehen`,
    showLess: "Weniger anzeigen",
    enlarge: "Foto vergrössern",
    photo: (n: number, total: number) => `Foto ${n} von ${total}`,
    previous: "Vorheriges Foto",
    next: "Nächstes Foto"
  },
  en: {
    badge: "REVIEW",
    empty: "Photos coming soon.",
    showAll: (n: number) => `View all ${n}`,
    showLess: "Show less",
    enlarge: "Enlarge photo",
    photo: (n: number, total: number) => `Photo ${n} of ${total}`,
    previous: "Previous photo",
    next: "Next photo"
  }
} as const

type Text = (typeof copy)[keyof typeof copy]

function PhotoLightbox({
  photos,
  index,
  onIndexChange,
  text
}: {
  photos: EventPhoto[]
  index: number | null
  onIndexChange: (index: number | null) => void
  text: Text
}) {
  const photo = index !== null ? photos[index] : null
  const hasMultiple = photos.length > 1
  // Wraps around at both ends
  const go = (offset: number) =>
    index !== null && onIndexChange((index + offset + photos.length) % photos.length)

  return (
    <Dialog open={photo !== null} onOpenChange={(open) => !open && onIndexChange(null)}>
      {photo && index !== null && (
        <DialogContent
          className="max-w-[calc(100%-2rem)] gap-3 border-0 bg-transparent p-0 shadow-none sm:max-w-5xl"
          closeButtonStyle={{ color: "white" }}
          onKeyDown={(e) => {
            if (!hasMultiple) return
            if (e.key === "ArrowLeft") go(-1)
            if (e.key === "ArrowRight") go(1)
          }}>
          <VisuallyHidden>
            <DialogTitle>{photo.caption || text.photo(index + 1, photos.length)}</DialogTitle>
          </VisuallyHidden>
          <div className="relative flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={eventPhotoSrc(photo.id)}
              alt={photo.caption || ""}
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain"
            />
            {hasMultiple && (
              <>
                <button
                  type="button"
                  aria-label={text.previous}
                  onClick={() => go(-1)}
                  className="text-violet absolute left-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-md transition-colors hover:bg-white">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label={text.next}
                  onClick={() => go(1)}
                  className="text-violet absolute right-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-md transition-colors hover:bg-white">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 px-1 text-sm text-white">
            <span>{photo.caption}</span>
            {hasMultiple && (
              <span className="shrink-0 text-white/70">{text.photo(index + 1, photos.length)}</span>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}

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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

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
              {visiblePhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  aria-label={photo.caption || text.enlarge}
                  onClick={() => setLightboxIndex(index)}
                  className="group focus-visible:ring-violet cursor-zoom-in overflow-hidden rounded-2xl focus-visible:ring-4 focus-visible:outline-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={eventPhotoSrc(photo.id, "thumbnail")}
                    alt={photo.caption || ""}
                    className="aspect-square w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
                    loading="lazy"
                  />
                </button>
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

      <PhotoLightbox photos={photos} index={lightboxIndex} onIndexChange={setLightboxIndex} text={text} />
    </section>
  )
}
