"use client"

import { Lock } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function ComingSoon() {
  const { language } = useLanguage()
  const text = {
    de: {
      title: "Demnächst verfügbar",
      description: "Dieses Feature ist noch nicht verfügbar und wird demnächst freigeschaltet."
    },
    en: {
      title: "Coming soon",
      description: "This feature is not available yet and will be released soon."
    }
  }

  const copy = text[language]

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 px-10 py-30 text-center">
      <div className="bg-secondary flex h-12 w-12 items-center justify-center rounded-full">
        <Lock />
      </div>
      <h3 className="text-lg font-semibold">{copy.title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{copy.description}</p>
    </div>
  )
}
