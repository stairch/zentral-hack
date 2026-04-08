"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { RegistrationForm } from "@/components/registration-form-new"
import { useLanguage } from "@/lib/language-context"

export default function AnmeldungPage() {
  const { language } = useLanguage()
  const text = {
    de: {
      heading: "JETZT REGISTRIEREN",
      description: "Sichere dir deinen Platz am Zentral Hack 2026"
    },
    en: {
      heading: "REGISTER NOW",
      description: "Secure your spot at Zentral Hack 2026"
    }
  } as const

  const copy = text[language]

  return (
    <main className="bg-background min-h-screen">
      <Navigation />

      <section className="px-4 pt-32 pb-24">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1
              className="text-foreground mb-4 text-4xl font-bold md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}>
              {copy.heading}
            </h1>
            <p className="text-muted-foreground text-lg">{copy.description}</p>
          </div>

          <div className="bg-card border-border rounded-2xl border p-8 shadow-lg md:p-12">
            <RegistrationForm />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
