"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useLanguage } from "@/lib/language-context"
import MarkdownContent from "@/components/ui/markdown-content"
import MdTermsDE from "./terms_de.md"
import MdTermsEN from "./terms_en.md"

export default function AGBPage() {
  const { language } = useLanguage()

  return (
    <main className="relative">
      <Navigation />
      <div className="bg-background min-h-screen pt-48 pb-28">
        <div className="content-numbered container mx-auto max-w-5xl px-4">
          <MarkdownContent>{language === "de" ? MdTermsDE : MdTermsEN}</MarkdownContent>
        </div>
      </div>
      <Footer />
    </main>
  )
}
