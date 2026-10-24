"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useLanguage } from "@/lib/language-context"
import MarkdownContent from "@/components/ui/markdown-content"
import MdLegalNoticeDE from "./legal-notice_de.md"
import MdLegalNoticeEN from "./legal-notice_en.md"

export default function ImpressumPage() {
  const { language } = useLanguage()

  return (
    <main className="relative">
      <Navigation />
      <div className="bg-background min-h-screen pt-48 pb-28">
        <div className="container mx-auto max-w-5xl px-4">
          <MarkdownContent>{language === "de" ? MdLegalNoticeDE : MdLegalNoticeEN}</MarkdownContent>
        </div>
      </div>
      <Footer />
    </main>
  )
}
