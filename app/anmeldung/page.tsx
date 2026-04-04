"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { RegistrationForm } from "@/components/registration-form-new"
import { useLanguage } from "@/lib/language-context"

export default function AnmeldungPage() {
  const { language } = useLanguage()
  const text = {
    de: {
      heading: "JETZT ANMELDEN",
      description: "Sichere dir deinen Platz am Zentral Hack 2026",
    },
    en: {
      heading: "REGISTER NOW",
      description: "Secure your spot at Zentral Hack 2026",
    },
  } as const

  const copy = text[language]

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      
      <section className="pt-32 pb-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-display)" }}>
              {copy.heading}
            </h1>
            <p className="text-lg text-muted-foreground">
              {copy.description}
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-lg">
            <RegistrationForm />
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  )
}
