"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useLanguage } from "@/lib/language-context"

const fallbackFaqs = [
  {
    question: {
      de: "Was ist der Zentral Hack?",
      en: "What is Zentral Hack?"
    },
    answer: {
      de: "Der Zentral Hack ist der grösste Hackathon der Zentralschweiz. 48 Stunden, in denen Studierende, Fachleute und Kreative zusammenkommen, um innovative Lösungen für reale Herausforderungen zu entwickeln.",
      en: "Zentral Hack is the largest hackathon in Central Switzerland. 48 hours where students, professionals, and creatives come together to build innovative solutions for real challenges."
    }
  },
  {
    question: {
      de: "Wer kann teilnehmen?",
      en: "Who can participate?"
    },
    answer: {
      de: "Alle sind willkommen! Ob Studierende, Berufstätige oder einfach technikbegeistert – jede:r kann sich registrieren und mitmachen.",
      en: "Everyone is welcome. Whether student, professional, or simply tech-interested, you can join."
    }
  },
  {
    question: {
      de: "Brauche ich ein Team?",
      en: "Do I need a team?"
    },
    answer: {
      de: "Nein, du kannst dich auch alleine registrieren. Wir helfen dir, ein passendes Team zu finden. Alternativ kannst du auch bereits mit einem Team kommen.",
      en: "No, you can register alone. We help you find a fitting team. You can also join with your own team."
    }
  }
]

interface FAQItem {
  id?: string
  question: string
  question_en?: string
  answer: string
  answer_en?: string
}

const copy = {
  de: {
    badge: "FAQ",
    heading: "HÄUFIGE",
    headingAccent: "FRAGEN",
    description: "Alles was du über den Zentral Hack wissen musst."
  },
  en: {
    badge: "FAQ",
    heading: "FREQUENTLY",
    headingAccent: "ASKED QUESTIONS",
    description: "Everything you need to know about Zentral Hack."
  }
} as const

export function FAQ() {
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true })
  const { language } = useLanguage()
  const text = copy[language]
  const fallbackLocalized = fallbackFaqs.map((entry) => ({
    question: entry.question[language],
    answer: entry.answer[language]
  }))
  const [faqs, setFaqs] = useState<FAQItem[]>(fallbackLocalized)

  useEffect(() => {
    setFaqs((current) => {
      if (current.length > 0 && current[0].id) {
        return current
      }
      return fallbackFaqs.map((entry) => ({
        question: entry.question[language],
        answer: entry.answer[language]
      }))
    })
  }, [language])

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch("/api/faqs")
        if (res.ok) {
          const data = await res.json()
          const dbFaqs = data.data?.faqs
          if (dbFaqs && dbFaqs.length > 0) {
            setFaqs(dbFaqs)
          }
        }
      } catch {
        // Keep fallback FAQs
      }
    }
    fetchFaqs()
  }, [])

  return (
    <section id="faq" className="bg-background py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          ref={headerRef}
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}>
          <motion.span
            className="bg-light-violet/30 text-violet mb-4 inline-block rounded-full px-4 py-2 text-sm font-medium"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isHeaderInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}>
            {text.badge}
          </motion.span>
          <h2 className="font-display text-foreground mb-4 text-4xl font-bold md:text-5xl">
            {text.heading} <span className="text-violet">{text.headingAccent}</span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">{text.description}</p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          className="mx-auto max-w-3xl"
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.id || faq.question}
                initial={{ opacity: 0, x: -20 }}
                animate={isHeaderInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}>
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-muted/50 border-border data-[state=open]:bg-violet/5 data-[state=open]:border-violet/20 rounded-xl border px-6 transition-colors">
                  <AccordionTrigger className="font-display text-foreground hover:text-violet [&[data-state=open]]:text-violet py-6 text-left font-bold transition-colors">
                    {language === "en" ? faq.question_en || faq.question : faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                    {language === "en" ? faq.answer_en || faq.answer : faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
