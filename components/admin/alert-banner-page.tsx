"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Check, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"
import { ContentVisibilityNotice } from "@/components/admin/content-visibility-notice"
import {
  ALERT_BANNER_ICONS,
  ALERT_BANNER_SETTINGS_KEY,
  ALERT_BANNER_VARIANTS,
  DEFAULT_ALERT_BANNER,
  alertBannerIcons,
  alertBannerVariantClasses,
  isAlertBannerActive,
  parseAlertBannerConfig,
  type AlertBannerConfig,
  type AlertBannerVariant
} from "@/lib/alert-banner"

const copy = {
  de: {
    heading: "ALERT BANNER",
    subtitle: "Wichtige Hinweise zuoberst im User-Dashboard anzeigen",
    settingsTitle: "Banner",
    enabledLabel: "Banner aktiv",
    messageLabel: "Nachricht (Deutsch)",
    messageEnLabel: "Nachricht (Englisch, optional)",
    messagePlaceholder: "z.B. Stromausfall - wir machen morgen um 08:00 weiter.",
    colorLabel: "Farbe",
    iconLabel: "Icon",
    icons: {
      alert: "Warnung",
      info: "Info",
      megaphone: "Ankündigung",
      clock: "Zeit",
      power: "Strom",
      weather: "Unwetter",
      offline: "Offline",
      food: "Essen",
      success: "Erledigt",
      party: "Feier"
    },
    expiresLabel: "Verschwindet am (optional)",
    expiresHint: "Leer lassen, damit der Banner sichtbar bleibt, bis er deaktiviert wird.",
    clearExpiry: "Frist entfernen",
    preview: "Vorschau",
    statusActive: "Wird angezeigt",
    statusExpired: "Abgelaufen",
    statusInactive: "Nicht sichtbar",
    save: "Speichern",
    saveSuccess: "Banner gespeichert",
    saveError: "Fehler beim Speichern",
    loadError: "Fehler beim Laden",
    validationError: "Bitte eine Nachricht eingeben",
    expiryInPastError: "Die Frist liegt in der Vergangenheit",
    variants: {
      red: "Rot",
      orange: "Orange",
      yellow: "Gelb",
      green: "Grün",
      blue: "Blau",
      violet: "Violett"
    }
  },
  en: {
    heading: "ALERT BANNER",
    subtitle: "Show important notices at the very top of the user dashboard",
    settingsTitle: "Banner",
    enabledLabel: "Banner active",
    messageLabel: "Message (German)",
    messageEnLabel: "Message (English, optional)",
    messagePlaceholder: "e.g. Power outage - we resume tomorrow at 08:00.",
    colorLabel: "Color",
    iconLabel: "Icon",
    icons: {
      alert: "Warning",
      info: "Info",
      megaphone: "Announcement",
      clock: "Time",
      power: "Power",
      weather: "Storm",
      offline: "Offline",
      food: "Food",
      success: "Done",
      party: "Celebration"
    },
    expiresLabel: "Disappears at (optional)",
    expiresHint: "Leave empty to keep the banner visible until it is disabled.",
    clearExpiry: "Remove deadline",
    preview: "Preview",
    statusActive: "Visible",
    statusExpired: "Expired",
    statusInactive: "Not visible",
    save: "Save",
    saveSuccess: "Banner saved",
    saveError: "Failed to save",
    loadError: "Failed to load",
    validationError: "Please enter a message",
    expiryInPastError: "The deadline is in the past",
    variants: {
      red: "Red",
      orange: "Orange",
      yellow: "Yellow",
      green: "Green",
      blue: "Blue",
      violet: "Violet"
    }
  }
} as const

// <input type="datetime-local"> works with local wall-clock time without a timezone suffix
function toLocalInputValue(iso: string | null) {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function AlertBannerAdminPage() {
  const { language } = useLanguage()
  const text = copy[language]

  const [config, setConfig] = useState<AlertBannerConfig>(DEFAULT_ALERT_BANNER)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/site-settings?key=${ALERT_BANNER_SETTINGS_KEY}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setConfig(parseAlertBannerConfig(data.data?.value))
      } catch {
        toast.error(text.loadError)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const update = (patch: Partial<AlertBannerConfig>) => setConfig((prev) => ({ ...prev, ...patch }))

  const handleSave = async () => {
    const value: AlertBannerConfig = {
      ...config,
      message: config.message.trim(),
      messageEn: config.messageEn.trim()
    }
    if (value.enabled && !value.message && !value.messageEn) {
      toast.error(text.validationError)
      return
    }
    if (value.enabled && value.expiresAt && new Date(value.expiresAt).getTime() <= Date.now()) {
      toast.error(text.expiryInPastError)
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key: ALERT_BANNER_SETTINGS_KEY, value })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || text.saveError)
      setConfig(value)
      toast.success(text.saveSuccess)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.saveError)
    } finally {
      setSaving(false)
    }
  }

  const isExpired = !!config.expiresAt && new Date(config.expiresAt).getTime() <= Date.now()
  const isActive = isAlertBannerActive(config)
  const PreviewIcon = alertBannerIcons[config.icon]
  const previewMessage =
    (language === "en" ? config.messageEn || config.message : config.message || config.messageEn).trim() ||
    text.messagePlaceholder

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{text.heading}</h1>
        <p className="text-muted-foreground mt-2">{text.subtitle}</p>
      </div>
      {/* Banners are rendered on the live homepage and dashboard only */}
      <ContentVisibilityNotice shownIn="live" />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-base">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {text.settingsTitle}
              </span>
              <Badge variant={isActive ? "default" : "outline"}>
                {isActive
                  ? text.statusActive
                  : config.enabled && isExpired
                    ? text.statusExpired
                    : text.statusInactive}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <Switch
                id="alert-banner-enabled"
                checked={config.enabled}
                onCheckedChange={(enabled) => update({ enabled })}
              />
              <Label htmlFor="alert-banner-enabled">{text.enabledLabel}</Label>
            </div>

            <div>
              <Label htmlFor="alert-banner-message">{text.messageLabel}</Label>
              <Textarea
                id="alert-banner-message"
                value={config.message}
                onChange={(e) => update({ message: e.target.value })}
                placeholder={text.messagePlaceholder}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="alert-banner-message-en">{text.messageEnLabel}</Label>
              <Textarea
                id="alert-banner-message-en"
                value={config.messageEn}
                onChange={(e) => update({ messageEn: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label>{text.colorLabel}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALERT_BANNER_VARIANTS.map((variant: AlertBannerVariant) => (
                  <button
                    key={variant}
                    type="button"
                    onClick={() => update({ variant })}
                    aria-pressed={config.variant === variant}
                    className={cn(
                      "flex h-9 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium ring-offset-2 transition-shadow",
                      alertBannerVariantClasses[variant],
                      config.variant === variant ? "ring-foreground ring-2" : "opacity-80 hover:opacity-100"
                    )}>
                    {config.variant === variant && <Check className="h-4 w-4" />}
                    {text.variants[variant]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>{text.iconLabel}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALERT_BANNER_ICONS.map((icon) => {
                  const Icon = alertBannerIcons[icon]
                  const selected = config.icon === icon
                  return (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => update({ icon })}
                      aria-pressed={selected}
                      aria-label={text.icons[icon]}
                      title={text.icons[icon]}
                      className={cn(
                        "flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border transition-colors",
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-muted text-muted-foreground hover:border-foreground/50 hover:text-foreground"
                      )}>
                      <Icon className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="alert-banner-expires">{text.expiresLabel}</Label>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Input
                  id="alert-banner-expires"
                  type="datetime-local"
                  className="w-auto"
                  value={toLocalInputValue(config.expiresAt)}
                  onChange={(e) =>
                    update({ expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null })
                  }
                />
                {config.expiresAt && (
                  <Button variant="ghost" size="sm" onClick={() => update({ expiresAt: null })}>
                    {text.clearExpiry}
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{text.expiresHint}</p>
            </div>

            <div>
              <Label>{text.preview}</Label>
              <div
                className={cn(
                  "mt-2 flex items-center justify-center gap-3 rounded-md px-4 py-3 text-sm font-semibold",
                  alertBannerVariantClasses[config.variant]
                )}>
                <PreviewIcon className="h-5 w-5 shrink-0" />
                <span className="whitespace-pre-line">{previewMessage}</span>
              </div>
            </div>

            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="bg-violet hover:bg-violet/90 gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {text.save}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
