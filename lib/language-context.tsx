"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type Language = "de" | "en"

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  isReady: boolean
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

const storageKey = "zh-language"

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("de")
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    if (saved === "de" || saved === "en") {
      setLanguage(saved)
    } else {
      const browserLanguage = navigator.language.toLowerCase()
      if (browserLanguage.startsWith("en")) {
        setLanguage("en")
      }
    }
    setIsReady(true)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(storageKey, language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(() => ({ language, setLanguage, isReady }), [language, isReady])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider")
  }
  return context
}
