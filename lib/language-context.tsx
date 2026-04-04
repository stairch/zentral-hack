"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

type Language = "de" | "en"

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

const storageKey = "zh-language"

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("de")

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    if (saved === "de" || saved === "en") {
      setLanguage(saved)
      return
    }

    const browserLanguage = navigator.language.toLowerCase()
    if (browserLanguage.startsWith("en")) {
      setLanguage("en")
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(storageKey, language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(() => ({ language, setLanguage }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider")
  }
  return context
}
