"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { AlertBanner } from "@/components/dashboard/alert-banner"
import { DeadlineBanner } from "@/components/dashboard/deadline-banner"
import { type ChallengeSubmissionRecord } from "@/lib/challenge-submission"

// Same cadence as the dashboard, admins may set or move the deadline at any time
const SUBMISSION_REFRESH_INTERVAL_MS = 5 * 60 * 1000

export function LandingBanners() {
  const { user, isLoading } = useAuth()
  const { language } = useLanguage()
  const [submission, setSubmission] = useState<ChallengeSubmissionRecord | null>(null)

  const isParticipant = user?.role === "user"

  useEffect(() => {
    if (!isParticipant) {
      setSubmission(null)
      return
    }
    const load = async () => {
      try {
        const res = await fetch("/api/challenge-submissions", { credentials: "include" })
        if (!res.ok) return
        const json = await res.json()
        setSubmission((json.data?.submission as ChallengeSubmissionRecord | null) || null)
      } catch {
        // non-critical
      }
    }
    void load()
    const interval = setInterval(() => void load(), SUBMISSION_REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [isParticipant])

  if (isLoading || !user) return null

  const challengeTitle =
    (language === "en"
      ? submission?.challenge_title_en || submission?.challenge_title
      : submission?.challenge_title || submission?.challenge_title_en) || ""

  return (
    <>
      <AlertBanner language={language} />
      {submission?.status === "accepted" && submission.submission_deadline && (
        <DeadlineBanner
          deadline={submission.submission_deadline}
          challengeTitle={challengeTitle}
          language={language}
        />
      )}
    </>
  )
}
