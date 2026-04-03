"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const fallbackFaqs = [
  {
    question: "Was ist der Zentral Hack?",
    answer:
      "Der Zentral Hack ist der grösste Hackathon der Zentralschweiz. 48 Stunden, in denen Studierende, Fachleute und Kreative zusammenkommen, um innovative Lösungen für reale Herausforderungen zu entwickeln.",
  },
  {
    question: "Wer kann teilnehmen?",
    answer:
      "Alle sind willkommen! Ob Studierende, Berufstätige oder einfach technikbegeistert – jede:r kann sich anmelden und mitmachen.",
  },
  {
    question: "Brauche ich ein Team?",
    answer:
      "Nein, du kannst dich auch alleine anmelden. Wir helfen dir, ein passendes Team zu finden. Alternativ kannst du auch bereits mit einem Team kommen.",
  },
]

interface FAQItem {
  id?: string;
  question: string;
  answer: string;
}

export function FAQ() {
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true })
  const [faqs, setFaqs] = useState<FAQItem[]>(fallbackFaqs)

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch('/api/faqs')
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
    <section id="faq" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          ref={headerRef}
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-block px-4 py-2 rounded-full bg-light-violet/30 text-violet font-medium text-sm mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isHeaderInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            FAQ
          </motion.span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            HÄUFIGE <span className="text-violet">FRAGEN</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Alles was du über den Zentral Hack wissen musst.
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.id || faq.question}
                initial={{ opacity: 0, x: -20 }}
                animate={isHeaderInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-muted/50 rounded-xl border border-border px-6 data-[state=open]:bg-violet/5 data-[state=open]:border-violet/20 transition-colors"
                >
                  <AccordionTrigger className="text-left font-display font-bold text-foreground hover:text-violet transition-colors py-6 [&[data-state=open]]:text-violet">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                    {faq.answer}
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
