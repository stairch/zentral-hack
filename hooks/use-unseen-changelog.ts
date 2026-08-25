"use client"

import { useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { latestChangelogEntry, isMinorOrMajorRelease } from "@/lib/changelog"

export function useUnseenChangelog() {
  const { user, refreshAuth } = useAuth()

  const latestEntry = latestChangelogEntry
  const hasUnseen = !!latestEntry && latestEntry.version !== user?.lastSeenChangelogVersion
  const isMinorOrMajor =
    hasUnseen && !!latestEntry
      ? isMinorOrMajorRelease(latestEntry.version, user?.lastSeenChangelogVersion)
      : false

  const markAsSeen = useCallback(async () => {
    if (!latestEntry || !hasUnseen) return
    await fetch("/api/auth/changelog-seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: latestEntry.version })
    })
    await refreshAuth()
  }, [latestEntry, hasUnseen, refreshAuth])

  return { hasUnseen, latestEntry, isMinorOrMajor, markAsSeen }
}
