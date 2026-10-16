"use client"

import { useEffect, useState } from "react"
import { AlarmClock, AlertTriangle, Clock, CircleAlert } from "lucide-react"
import { cn } from "@/lib/utils"

const HOUR = 60 * 60 * 1000
const MINUTE = 60 * 1000

// Escalation levels tuned for a ~24h hackathon: the closer the deadline, the louder the banner
type DeadlineStage = "calm" | "notice" | "warning" | "urgent" | "critical" | "over"

function getStage(remainingMs: number): DeadlineStage {
  if (remainingMs <= 0) return "over"
  if (remainingMs <= 15 * MINUTE) return "critical"
  if (remainingMs <= HOUR) return "urgent"
  if (remainingMs <= 3 * HOUR) return "warning"
  if (remainingMs <= 12 * HOUR) return "notice"
  return "calm"
}

// Keep the "deadline passed" note visible for a while, then hide the banner
const SHOW_OVER_FOR_MS = HOUR

const stageStyles: Record<DeadlineStage, { banner: string; track: string; icon: typeof Clock }> = {
  calm: {
    banner: "bg-secondary text-secondary-foreground py-1.5 text-xs",
    track: "animate-marquee-slow",
    icon: Clock
  },
  notice: {
    banner: "bg-primary text-primary-foreground py-2 text-xs sm:text-sm",
    track: "animate-marquee",
    icon: AlarmClock
  },
  warning: {
    banner: "bg-accent text-accent-foreground sticky top-0 z-40 py-2 text-sm font-semibold shadow-md",
    track: "animate-marquee-fast",
    icon: AlertTriangle
  },
  urgent: {
    banner: "bg-destructive text-destructive-foreground sticky top-0 z-40 py-2.5 text-sm font-bold shadow-lg",
    track: "animate-marquee-fast",
    icon: CircleAlert
  },
  critical: {
    banner:
      "bg-destructive text-destructive-foreground sticky top-0 z-40 py-2.5 text-sm shadow-lg animate-pulse motion-reduce:animate-none border-accent border-y-4 font-extrabold uppercase shadow-xl",
    track: "animate-marquee-fast",
    icon: CircleAlert
  },
  over: {
    banner: "bg-muted text-muted-foreground py-2 sticky top-0 z-40 text-sm",
    track: "",
    icon: Clock
  }
}

const copy = {
  de: {
    days: "T.",
    hours: "Std.",
    minutes: "Min.",
    seconds: "Sek.",
    message: (remaining: string, title: string, deadline: string) =>
      `Noch ${remaining} bis zur Abgabe von «${title}» – Deadline: ${deadline} Uhr`,
    over: (title: string, deadline: string) =>
      `Die Abgabefrist für «${title}» ist abgelaufen (${deadline} Uhr).`
  },
  en: {
    days: "d",
    hours: "h",
    minutes: "min",
    seconds: "s",
    message: (remaining: string, title: string, deadline: string) =>
      `${remaining} left to submit “${title}” – Deadline: ${deadline}`,
    over: (title: string, deadline: string) =>
      `The submission deadline for “${title}” has passed (${deadline}).`
  }
} as const

interface DeadlineBannerProps {
  deadline: string
  challengeTitle: string
  language: "de" | "en"
}

export function DeadlineBanner({ deadline, challengeTitle, language }: DeadlineBannerProps) {
  const [now, setNow] = useState(() => Date.now())
  const text = copy[language]

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const deadlineDate = new Date(deadline)
  const remainingMs = deadlineDate.getTime() - now
  if (Number.isNaN(remainingMs) || remainingMs < -SHOW_OVER_FOR_MS) return null

  const stage = getStage(remainingMs)
  const styles = stageStyles[stage]
  const Icon = styles.icon
  const formattedDeadline = deadlineDate.toLocaleString(language === "en" ? "en-GB" : "de-CH", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })

  if (stage === "over") {
    return (
      <div role="status" className={cn("flex items-center justify-center gap-2 px-4", styles.banner)}>
        <Icon className="h-4 w-4 shrink-0" />
        <span>{text.over(challengeTitle, formattedDeadline)}</span>
      </div>
    )
  }

  const message = text.message(formatRemaining(remainingMs, text), challengeTitle, formattedDeadline)
  const item = (
    <span className="flex shrink-0 items-center gap-3 px-6">
      <Icon className={cn("h-4 w-4 shrink-0", stage === "critical" && "h-6 w-6")} />
      <span className="tabular-nums">{message}</span>
    </span>
  )

  return (
    <div className={cn("overflow-hidden whitespace-nowrap", styles.banner)}>
      {/* Screen readers read the message once instead of the repeated, animated copies */}
      <span className="sr-only">{message}</span>
      <div aria-hidden className={cn("flex w-max motion-reduce:animate-none", styles.track)}>
        {/* Two identical halves so the -50% translation loops seamlessly */}
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0">
            {[0, 1, 2, 3].map((i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function formatRemaining(ms: number, text: (typeof copy)[keyof typeof copy]) {
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, "0")

  if (days > 0) return `${days} ${text.days} ${hours} ${text.hours} ${minutes} ${text.minutes}`
  // Show seconds within the last 3 hours so the countdown visibly ticks
  if (ms <= 3 * HOUR) {
    return hours > 0
      ? `${hours} ${text.hours} ${pad(minutes)} ${text.minutes} ${pad(seconds)} ${text.seconds}`
      : `${minutes} ${text.minutes} ${pad(seconds)} ${text.seconds}`
  }
  return `${hours} ${text.hours} ${minutes} ${text.minutes}`
}
