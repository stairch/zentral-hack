"use client"

import Link from "next/link"
import { Footer } from "@/components/footer"
import { useLanguage } from "@/lib/language-context"

function AnmeldungContent() {
  const { language } = useLanguage()
  const text = {
    de: {
      heading: "ANMELDUNG GESCHLOSSEN",
      description:
        "Die Anmeldung für Zentral Hack 2026 ist geschlossen. Danke an alle, die dabei waren — wir freuen uns schon auf 2027!",
      backHome: "Zurück zur Startseite"
    },
    en: {
      heading: "REGISTRATION CLOSED",
      description:
        "Registration for Zentral Hack 2026 is closed. Thank you to everyone who took part — we're already looking forward to 2027!",
      backHome: "Back to homepage"
    }
  } as const

  const copy = text[language]

  return (
    <main className="bg-background min-h-screen">
      <section className="px-4 pt-28 pb-24">
        <div className="container mx-auto max-w-2xl text-center">
          <h1 className="text-foreground font-display mb-4 text-4xl font-bold md:text-5xl">{copy.heading}</h1>
          <p className="text-muted-foreground mb-8 text-lg">{copy.description}</p>
          <Link
            href="/"
            className="bg-violet hover:bg-violet/90 inline-block rounded-lg px-6 py-3 font-semibold text-white transition-colors">
            {copy.backHome}
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default function AnmeldungPage() {
  return <AnmeldungContent />
}
