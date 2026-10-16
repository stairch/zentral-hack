"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export type Language = "de" | "en"

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  isReady: boolean
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

const storageKey = "zh-language"

function readSavedLanguage(): Language | null {
  try {
    const saved = window.localStorage.getItem(storageKey)
    return saved === "de" || saved === "en" ? saved : null
  } catch {
    return null
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("de")
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const saved = readSavedLanguage()
    if (saved) {
      setLanguageState(saved)
    } else if (navigator.language.toLowerCase().startsWith("en")) {
      setLanguageState("en")
    }
    setIsReady(true)
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    try {
      window.localStorage.setItem(storageKey, next)
    } catch {
      // Storage unavailable (e.g. private mode), language still applies for this session
    }
  }, [])

  const value = useMemo(() => ({ language, setLanguage, isReady }), [language, setLanguage, isReady])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider")
  }
  return context
}
