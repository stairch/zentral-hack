"use client"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, CheckCircle, Calendar, Loader2 } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

const copy = {
  de: {
    date: "23. - 24. OKTOBER 2026",
    heading1: "BEREIT ZU",
    heading2: "HACKEN",
    description: "Abonniere den Newsletter, um alle Updates zum Zentral Hack 2026 zu erhalten.",
    register: "Jetzt anmelden",
    or: "oder",
    newsletterButton: "Abonnieren",
    newsletterPlaceholder: "deine@email.ch",
    wantsEmail: "Ich möchte Updates per E-Mail erhalten",
    success: "Super! Du bist angemeldet.",
    noSpam: "Kein Spam, versprochen. Nur wichtige Updates zum Zentral Hack.",
    signupFailed: "Anmeldung fehlgeschlagen",
    genericError: "Ein Fehler ist aufgetreten. Bitte versuche es erneut."
  },
  en: {
    date: "23 - 24 OCTOBER 2026",
    heading1: "READY TO",
    heading2: "HACK",
    description: "Sign up for the newsletter to receive all the latest updates on Zentral Hack 2026.",
    register: "Register now",
    or: "or",
    newsletterButton: "Subscribe",
    newsletterPlaceholder: "your@email.com",
    wantsEmail: "I want to receive updates by email",
    success: "Great! You are subscribed.",
    noSpam: "No spam, promised. Only important updates about Zentral Hack.",
    signupFailed: "Subscription failed",
    genericError: "An error occurred. Please try again."
  }
} as const

export function CTA() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true })
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { language } = useLanguage()
  const text = copy[language]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "cta"
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || text.signupFailed)
      }

      setIsSubmitted(true)
    } catch (err) {
      console.error("Newsletter signup error:", err)
      setError(err instanceof Error ? err.message : text.genericError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#530A5D] py-24">
      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}>
          <div>
            {/* Badge */}
            <motion.div
              className="mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-2"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", borderColor: "rgba(255, 255, 255, 0.2)" }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}>
              <Calendar className="text-accent h-4 w-4" />
              <span className="text-sm font-medium text-white">{text.date}</span>
            </motion.div>

            {/* Heading */}
            <motion.h2
              className="font-display mb-12 text-4xl font-bold text-white md:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}>
              {text.heading1} <span className="text-[#E6FF17]">{text.heading2}</span>?
            </motion.h2>
          </div>

          {/* Form / Registration CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="space-y-6">
            {/* Primary CTA - Registration */}
            <Link href="/anmeldung">
              <Button
                size="lg"
                className="bg-accent text-primary hover:bg-accent/90 group mb-20 rounded-full px-8 py-6 text-lg font-semibold">
                {text.register}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>

            <motion.p
              className="text-secondary mb-5 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}>
              {text.description}
            </motion.p>
            {/* Newsletter signup */}
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="mx-auto max-w-md">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="email"
                    placeholder={text.newsletterPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 flex-1 rounded-full border-white/20 bg-white/10 px-6 text-white placeholder:text-white/50 focus:border-[#E6FF17] focus:ring-[#E6FF17]"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 rounded-full bg-white/20 px-6 font-semibold text-white hover:bg-white/30">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : text.newsletterButton}
                  </Button>
                </div>
                {error && <p className="text-sm text-red-300">{error}</p>}
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-3 text-[#E6FF17]">
                <CheckCircle className="h-6 w-6" />
                <span className="text-lg font-semibold">{text.success}</span>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
