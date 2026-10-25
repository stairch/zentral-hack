"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useEventPhase } from "@/lib/event-phase-context"
import { parseEventPhaseConfig, type EventPhase } from "@/lib/event-phase"

interface WebsiteModeContextValue {
  phase: EventPhase
  // true once the stored phase has been read from the admin API
  loaded: boolean
  setPhase: (phase: EventPhase) => void
}

const WebsiteModeContext = createContext<WebsiteModeContextValue | null>(null)

// The phase header from proxy.ts is cached per instance and can lag behind a switch for a few seconds.
// Admin UI therefore starts with the header value, then trusts the uncached admin API and its own switches.
export function WebsiteModeProvider({ children }: { children: React.ReactNode }) {
  const headerPhase = useEventPhase()
  const [phase, setPhase] = useState<EventPhase>(headerPhase)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/event-phase", { credentials: "include" })
        // Non-admins have no access, they keep the header value
        if (!res.ok) return
        const data = await res.json()
        setPhase(parseEventPhaseConfig(data.data?.config).phase)
      } catch {
        // Keep the header value
      } finally {
        setLoaded(true)
      }
    }
    void load()
  }, [])

  return (
    <WebsiteModeContext.Provider value={{ phase, loaded, setPhase }}>{children}</WebsiteModeContext.Provider>
  )
}

export function useWebsiteMode(): WebsiteModeContextValue {
  const context = useContext(WebsiteModeContext)
  if (!context) throw new Error("useWebsiteMode must be used within WebsiteModeProvider")
  return context
}
