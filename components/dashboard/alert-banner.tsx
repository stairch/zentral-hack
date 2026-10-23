"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  ALERT_BANNER_SETTINGS_KEY,
  alertBannerIcons,
  alertBannerVariantClasses,
  isAlertBannerActive,
  parseAlertBannerConfig,
  type AlertBannerConfig
} from "@/lib/alert-banner"

// Re-fetch periodically so banners set by admins show up without a reload
const REFRESH_INTERVAL_MS = 60 * 1000

interface AlertBannerProps {
  language: "de" | "en"
}

export function AlertBanner({ language }: AlertBannerProps) {
  const [config, setConfig] = useState<AlertBannerConfig | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/site-settings?key=${ALERT_BANNER_SETTINGS_KEY}`)
        if (!res.ok) return
        const data = await res.json()
        setConfig(parseAlertBannerConfig(data.data?.value))
      } catch {
        // non-critical
      }
    }
    void load()
    const refresh = setInterval(() => void load(), REFRESH_INTERVAL_MS)
    // Tick every few seconds so the banner hides right when its deadline passes
    const tick = setInterval(() => setNow(Date.now()), 5000)
    return () => {
      clearInterval(refresh)
      clearInterval(tick)
    }
  }, [])

  if (!config || !isAlertBannerActive(config, now)) return null

  const message = (
    language === "en" ? config.messageEn || config.message : config.message || config.messageEn
  ).trim()

  const Icon = alertBannerIcons[config.icon]
  const item = (
    <span className="flex shrink-0 items-center gap-3 px-8">
      <Icon className="h-5 w-5 shrink-0" />
      <span>{message.replace(/\s*\n\s*/g, "  •  ")}</span>
    </span>
  )

  return (
    <div
      role="alert"
      className={cn(
        "overflow-hidden py-3 text-sm font-semibold whitespace-pre shadow-lg sm:text-base",
        alertBannerVariantClasses[config.variant]
      )}>
      {/* Screen readers read the message once instead of the repeated, animated copies */}
      <span className="sr-only">{message}</span>
      <div aria-hidden className="animate-marquee flex w-max motion-reduce:animate-none">
        {/* Two identical halves so the -50% translation loops seamlessly */}
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0">
            {[0, 1, 2].map((i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
