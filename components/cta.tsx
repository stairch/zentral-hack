"use client"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ArrowRight, CheckCircle, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

const copy = {
  de: {
    date: "23.-24. OKTOBER 2026",
    heading1: "BEREIT ZU",
    heading2: "HACKEN",
    description: "Melde dich jetzt für den Newsletter an und erhalte alle Updates zum Zentral Hack 2026.",
    register: "Jetzt anmelden",
    or: "oder",
    newsletterButton: "Newsletter",
    newsletterPlaceholder: "deine@email.ch",
    wantsEmail: "Ich möchte Updates per E-Mail erhalten",
    success: "Super! Du bist angemeldet.",
    noSpam: "Kein Spam, versprochen. Nur wichtige Updates zum Zentral Hack.",
    signupFailed: "Anmeldung fehlgeschlagen",
    genericError: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
  },
  en: {
    date: "23-24 OCTOBER 2026",
    heading1: "READY TO",
    heading2: "HACK",
    description: "Sign up for the newsletter now and receive all updates about Zentral Hack 2026.",
    register: "Register now",
    or: "or",
    newsletterButton: "Newsletter",
    newsletterPlaceholder: "your@email.com",
    wantsEmail: "I want to receive updates by email",
    success: "Great! You are subscribed.",
    noSpam: "No spam, promised. Only important updates about Zentral Hack.",
    signupFailed: "Subscription failed",
    genericError: "An error occurred. Please try again.",
  },
} as const

export function CTA() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true })
  const [email, setEmail] = useState("")
  const [wantsEmails, setWantsEmails] = useState(true)
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
          source: "cta",
        }),
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
    <section ref={sectionRef} className="py-24 bg-[#530A5D] relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(230, 255, 23, 0.2)" }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(213, 194, 247, 0.2)" }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 7, repeat: Infinity }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", borderColor: "rgba(255, 255, 255, 0.2)" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-[#E6FF17]" />
            <span className="text-white text-sm font-medium">{text.date}</span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            className="text-4xl md:text-6xl font-bold text-white mb-6"
            style={{ fontFamily: "var(--font-display)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {text.heading1}{" "}
            <span className="text-[#E6FF17]">{text.heading2}</span>?
          </motion.h2>

          <motion.p
            className="text-[#D5C2F7] text-lg mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {text.description}
          </motion.p>

          {/* Form / Registration CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="space-y-6"
          >
            {/* Primary CTA - Registration */}
            <Link href="/anmeldung">
              <Button
                size="lg"
                className="bg-[#E6FF17] hover:bg-[#E6FF17]/90 text-[#530A5D] font-bold px-10 h-16 rounded-full text-lg group"
              >
                {text.register}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <p className="text-white/60 text-sm">{text.or}</p>

            {/* Newsletter signup */}
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder={text.newsletterPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 px-6 rounded-full focus:border-[#E6FF17] focus:ring-[#E6FF17]"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 h-12 rounded-full"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      text.newsletterButton
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-center gap-2">
                  <Checkbox
                    id="wants-emails"
                    checked={wantsEmails}
                    onCheckedChange={(checked) => setWantsEmails(checked as boolean)}
                    className="border-white/50 data-[state=checked]:bg-[#E6FF17] data-[state=checked]:border-[#E6FF17]"
                  />
                  <Label htmlFor="wants-emails" className="text-white/70 text-sm cursor-pointer">
                    {text.wantsEmail}
                  </Label>
                </div>

                {error && (
                  <p className="text-red-300 text-sm">{error}</p>
                )}
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-3 text-[#E6FF17]"
              >
                <CheckCircle className="w-6 h-6" />
                <span className="font-semibold text-lg">{text.success}</span>
              </motion.div>
            )}
          </motion.div>

          {/* Trust text */}
          <motion.p
            className="text-white/50 text-sm mt-8"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            {text.noSpam}
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
