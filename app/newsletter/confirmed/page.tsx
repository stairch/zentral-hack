"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"

const copy = {
  de: {
    success: {
      title: "Anmeldung bestätigt",
      description:
        "Danke! Deine E-Mail-Adresse ist bestätigt und du erhältst ab jetzt alle Updates zum Zentral Hack 2026."
    },
    invalid: {
      title: "Link ungültig oder abgelaufen",
      description:
        "Dieser Bestätigungslink ist nicht mehr gültig. Bitte trage deine E-Mail-Adresse erneut ein, um einen neuen Link zu erhalten."
    },
    error: {
      title: "Etwas ist schiefgelaufen",
      description:
        "Wir konnten deine Anmeldung gerade nicht abschliessen. Bitte versuche es später noch einmal."
    },
    home: "Zur Startseite"
  },
  en: {
    success: {
      title: "Subscription confirmed",
      description:
        "Thank you! Your email address is confirmed and you will now receive all updates about Zentral Hack 2026."
    },
    invalid: {
      title: "Link invalid or expired",
      description:
        "This confirmation link is no longer valid. Please enter your email address again to get a new link."
    },
    error: {
      title: "Something went wrong",
      description: "We couldn't complete your subscription right now. Please try again later."
    },
    home: "Back to home"
  }
} as const

type Status = "success" | "invalid" | "error"

function ConfirmedContent() {
  const { language } = useLanguage()
  const params = useSearchParams()
  const raw = params.get("status")
  const status: Status = raw === "success" || raw === "invalid" ? raw : "error"
  const text = copy[language]
  const message = text[status]

  const Icon = status === "success" ? CheckCircle : status === "invalid" ? XCircle : AlertTriangle
  const iconClass = status === "success" ? "text-green-600" : "text-destructive"

  return (
    <div className="bg-background flex min-h-screen items-center justify-center pt-48 pb-28">
      <div className="container mx-auto max-w-xl px-4 text-center">
        <Icon className={`mx-auto mb-6 h-16 w-16 ${iconClass}`} />
        <h1 className="font-display text-primary mb-4 text-3xl font-bold md:text-4xl">{message.title}</h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">{message.description}</p>
        <Link href="/">
          <Button size="lg" className="rounded-full px-8">
            {text.home}
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function NewsletterConfirmedPage() {
  return (
    <main className="relative">
      <Suspense fallback={<div className="min-h-screen" />}>
        <ConfirmedContent />
      </Suspense>
      <Footer />
    </main>
  )
}
