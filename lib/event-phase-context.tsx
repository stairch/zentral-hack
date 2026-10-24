"use client"

import { createContext, useContext } from "react"
import type { EventPhase } from "@/lib/event-phase"

const EventPhaseContext = createContext<EventPhase>("live")

// The phase is resolved once per request by proxy.ts and handed down from the root layout
export function EventPhaseProvider({ phase, children }: { phase: EventPhase; children: React.ReactNode }) {
  return <EventPhaseContext.Provider value={phase}>{children}</EventPhaseContext.Provider>
}

export function useEventPhase(): EventPhase {
  return useContext(EventPhaseContext)
}
