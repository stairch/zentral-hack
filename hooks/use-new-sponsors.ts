"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"

export function useNewSponsors() {
  const { user } = useAuth()
  const [hasNew, setHasNew] = useState(false)

  const isAdmin = user?.role === "admin"

  useEffect(() => {
    if (!isAdmin) return

    async function fetchAndCheck() {
      try {
        const res = await fetch("/api/admin/sponsor-contacts")
        if (!res.ok) return
        const data = await res.json()
        const contacts: { status: string }[] = data.data?.contacts ?? []
        setHasNew(contacts.some((c) => c.status === "new"))
      } catch {
        // silently ignore
      }
    }

    fetchAndCheck()
    window.addEventListener("sponsor-contacts-changed", fetchAndCheck)
    return () => window.removeEventListener("sponsor-contacts-changed", fetchAndCheck)
  }, [isAdmin])

  return { hasNew }
}
