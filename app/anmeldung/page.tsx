"use client"

import { Suspense } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { RegistrationForm } from "@/components/registration-form"
import { useLanguage } from "@/lib/language-context"
import { useEventPhase } from "@/lib/event-phase-context"

function AnmeldungContent() {
  const { language } = useLanguage()
  const isPostEvent = useEventPhase() === "post"
  const text = {
    de: {
      heading: "JETZT REGISTRIEREN",
      description: "Sichere dir deinen Platz am Zentral Hack 2026",
      closedHeading: "ANMELDUNG GESCHLOSSEN",
      closedDescription:
        "Die Anmeldung für Zentral Hack 2026 ist geschlossen. Danke an alle, die dabei waren — wir freuen uns schon auf 2027!",
      backHome: "Zurück zur Startseite"
    },
    en: {
      heading: "REGISTER NOW",
      description: "Secure your spot at Zentral Hack 2026",
      closedHeading: "REGISTRATION CLOSED",
      closedDescription:
        "Registration for Zentral Hack 2026 is closed. Thank you to everyone who took part — we're already looking forward to 2027!",
      backHome: "Back to homepage"
    }
  } as const

  const copy = text[language]

  if (isPostEvent) {
    return (
      <main className="bg-background min-h-screen">
        <Navigation />

        <section className="px-4 pt-32 pb-24">
          <div className="container mx-auto max-w-2xl text-center">
            <h1 className="text-foreground font-display mb-4 text-4xl font-bold md:text-5xl">
              {copy.closedHeading}
            </h1>
            <p className="text-muted-foreground mb-8 text-lg">{copy.closedDescription}</p>
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

  return (
    <main className="bg-background min-h-screen">
      <Navigation />

      <section className="px-4 pt-32 pb-24">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h1 className="text-foreground font-display mb-4 text-4xl font-bold md:text-5xl">
              {copy.heading}
            </h1>
            <p className="text-muted-foreground text-lg">{copy.description}</p>
          </div>

          <div className="bg-card border-border rounded-2xl border p-8 shadow-lg md:p-12">
            <Suspense fallback={<div>Loading...</div>}>
              <RegistrationForm />
            </Suspense>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default function AnmeldungPage() {
  return <AnmeldungContent />
}
