"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EventPhotosManager } from "@/components/admin/event-photos-manager"
import {
  BarChart3,
  Check,
  ExternalLink,
  Flag,
  Images,
  Info,
  Loader2,
  Megaphone,
  Save,
  Sparkles,
  Trophy
} from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"
import {
  DEFAULT_EVENT_PHASE,
  EVENT_PHASES,
  POST_EVENT_STAT_KEYS,
  parseEventPhaseConfig,
  type EventPhase,
  type EventPhaseConfig,
  type LocalizedText,
  type PostEventStats
} from "@/lib/event-phase"

const copy = {
  de: {
    heading: "EVENT-PHASE",
    subtitle: "Zwischen laufendem Event und Rückblick umschalten und die Inhalte der Startseite pflegen",
    phaseTitle: "Phase",
    phases: {
      live: {
        label: "Vor / während Event",
        description:
          "Normale Startseite mit Anmeldung. Teilnehmende, Partner und Sponsoren können sich einloggen und alles nutzen."
      },
      post: {
        label: "Nach Event",
        description:
          "Rückblick-Startseite. Login, Anmeldung, Uploads und alle anderen Aktionen sind gesperrt, nur Admins können sich noch einloggen."
      }
    },
    current: "Aktiv",
    unsaved: "Nicht gespeichert",
    heroTitle: "Hero",
    dateLabel: "Datumszeile",
    headingLabel: "Titel",
    headingAccentLabel: "Titel (hervorgehoben)",
    descriptionLabel: "Beschreibung",
    statsTitle: "Kennzahlen",
    statsHint: "Leer lassen, um den automatisch gezählten Wert zu verwenden.",
    stats: { participants: "Teilnehmende", teams: "Teams", sponsors: "Partner & Sponsoren" },
    automatic: "Automatisch",
    leaderboardTitle: "Sieger-Teams",
    leaderboardEnabled: "Sektion anzeigen",
    badgeLabel: "Badge",
    rankingsHint: "Die Platzierungen (Rang 1–3 pro Kategorie) werden bei den Teams gesetzt.",
    rankingsLink: "Zu den Teams",
    galleryTitle: "Galerie",
    galleryEnabled: "Sektion anzeigen",
    ctaTitle: "Abschluss",
    liveInfo:
      "Vor und während dem Event zeigt die Startseite den regulären Inhalt. Dieser wird auf den jeweiligen Seiten gepflegt (siehe Sidebar)",
    german: "Deutsch",
    english: "Englisch",
    save: "Speichern",
    saveSuccess: "Einstellungen gespeichert",
    saveError: "Fehler beim Speichern",
    loadError: "Fehler beim Laden",
    confirmTitle: "Plattform sperren?",
    confirmDescription:
      "Danach haben nur noch Super Admins Zugriff. Alle anderen werden sofort ausgeloggt, und Login, Anmeldung, Uploads sowie alle anderen Aktionen bleiben gesperrt, bis du wieder auf „Vor / während Event“ umschaltest.",
    confirmLabel: "Sperren und speichern",
    cancel: "Abbrechen"
  },
  en: {
    heading: "EVENT PHASE",
    subtitle: "Switch between the running event and the recap, and manage the homepage content",
    phaseTitle: "Phase",
    phases: {
      live: {
        label: "Before / during event",
        description:
          "Regular homepage with registration. Participants, partners and sponsors can sign in and use everything."
      },
      post: {
        label: "After event",
        description:
          "Recap homepage. Login, registration, uploads and every other action are locked, only admins can still sign in."
      }
    },
    current: "Active",
    unsaved: "Unsaved",
    heroTitle: "Hero",
    dateLabel: "Date line",
    headingLabel: "Title",
    headingAccentLabel: "Title (highlighted)",
    descriptionLabel: "Description",
    statsTitle: "Key figures",
    statsHint: "Leave empty to use the automatically counted value.",
    stats: { participants: "Participants", teams: "Teams", sponsors: "Partners & Sponsors" },
    automatic: "Automatic",
    leaderboardTitle: "Winning teams",
    leaderboardEnabled: "Show section",
    badgeLabel: "Badge",
    rankingsHint: "Placements (rank 1–3 per category) are set on the teams page.",
    rankingsLink: "Go to teams",
    galleryTitle: "Gallery",
    galleryEnabled: "Show section",
    ctaTitle: "Closing",
    liveInfo:
      "Before and during the event the homepage shows its regular content. It is managed on the respective pages (see sidebar).",
    german: "German",
    english: "English",
    save: "Save",
    saveSuccess: "Settings saved",
    saveError: "Failed to save",
    loadError: "Failed to load",
    confirmTitle: "Lock the platform?",
    confirmDescription:
      "Afterwards only super admins have access. Everyone else is signed out immediately, and login, registration, uploads and every other action stay locked until you switch back to “Before / during event”.",
    confirmLabel: "Lock and save",
    cancel: "Cancel"
  }
} as const

type Copy = (typeof copy)[keyof typeof copy]

function LocalizedField({
  id,
  label,
  value,
  onChange,
  multiline,
  text
}: {
  id: string
  label: string
  value: LocalizedText
  onChange: (value: LocalizedText) => void
  multiline?: boolean
  text: Copy
}) {
  const Field = multiline ? Textarea : Input
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid gap-3 md:grid-cols-2">
        {(["de", "en"] as const).map((lang) => (
          <div key={lang}>
            <Label htmlFor={`${id}-${lang}`} className="text-muted-foreground text-xs">
              {lang === "de" ? text.german : text.english}
            </Label>
            <Field
              id={`${id}-${lang}`}
              value={value[lang]}
              onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
              rows={multiline ? 3 : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionLink({ hint, href, label }: { hint: string; href: string; label: string }) {
  return (
    <div className="bg-muted flex flex-wrap items-center justify-between gap-2 rounded-md px-3 py-2 text-sm">
      <span className="text-muted-foreground">{hint}</span>
      <Link href={href} className="text-violet inline-flex items-center gap-1 font-medium hover:underline">
        {label}
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

export function EventPhaseAdminPage() {
  const { language } = useLanguage()
  const text = copy[language]

  const [config, setConfig] = useState<EventPhaseConfig>(DEFAULT_EVENT_PHASE)
  const [savedPhase, setSavedPhase] = useState<EventPhase>(DEFAULT_EVENT_PHASE.phase)
  const [autoStats, setAutoStats] = useState<PostEventStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/event-phase", { credentials: "include" })
        if (!res.ok) throw new Error()
        const data = await res.json()
        const loaded = parseEventPhaseConfig(data.data?.config)
        setConfig(loaded)
        setSavedPhase(loaded.phase)
        setAutoStats(data.data?.autoStats ?? null)
      } catch {
        toast.error(text.loadError)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const update = <K extends Exclude<keyof EventPhaseConfig, "phase">>(
    key: K,
    patch: Partial<EventPhaseConfig[K]>
  ) => setConfig((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/event-phase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(config)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || text.saveError)
      const saved = parseEventPhaseConfig(data.data?.config)
      setConfig(saved)
      setSavedPhase(saved.phase)
      setConfirmOpen(false)
      toast.success(text.saveSuccess)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.saveError)
    } finally {
      setSaving(false)
    }
  }

  // Locking the platform signs everyone out, so make that step explicit
  const handleSave = () => {
    if (config.phase === "post" && savedPhase !== "post") {
      setConfirmOpen(true)
      return
    }
    void save()
  }

  const handleStatChange = (key: (typeof POST_EVENT_STAT_KEYS)[number], value: string) => {
    const parsed = Number.parseInt(value, 10)
    update("stats", { [key]: value === "" || Number.isNaN(parsed) ? null : Math.max(0, parsed) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{text.heading}</h1>
        <p className="text-muted-foreground mt-2">{text.subtitle}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Flag className="h-4 w-4" />
                {text.phaseTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {EVENT_PHASES.map((phase) => {
                const selected = config.phase === phase
                return (
                  <button
                    key={phase}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, phase }))}
                    aria-pressed={selected}
                    className={cn(
                      "flex cursor-pointer flex-col gap-2 rounded-lg border-2 p-4 text-left transition-colors",
                      selected ? "border-violet bg-secondary" : "border-border hover:border-violet/50"
                    )}>
                    <span className="flex items-center justify-between gap-2 font-semibold">
                      <span className="flex items-center gap-2">
                        {selected && <Check className="text-violet h-4 w-4" />}
                        {text.phases[phase].label}
                      </span>
                      {savedPhase === phase ? (
                        <Badge>{text.current}</Badge>
                      ) : (
                        selected && <Badge variant="outline">{text.unsaved}</Badge>
                      )}
                    </span>
                    <span className="text-muted-foreground text-sm">{text.phases[phase].description}</span>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* Post-event content only applies to the recap homepage */}
          {config.phase === "post" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4" />
                    {text.heroTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <LocalizedField
                    id="hero-date"
                    label={text.dateLabel}
                    value={config.hero.date}
                    onChange={(date) => update("hero", { date })}
                    text={text}
                  />
                  <LocalizedField
                    id="hero-heading"
                    label={text.headingLabel}
                    value={config.hero.heading}
                    onChange={(heading) => update("hero", { heading })}
                    text={text}
                  />
                  <LocalizedField
                    id="hero-heading-accent"
                    label={text.headingAccentLabel}
                    value={config.hero.headingAccent}
                    onChange={(headingAccent) => update("hero", { headingAccent })}
                    text={text}
                  />
                  <LocalizedField
                    id="hero-description"
                    label={text.descriptionLabel}
                    value={config.hero.description}
                    onChange={(description) => update("hero", { description })}
                    multiline
                    text={text}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4" />
                    {text.statsTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    {POST_EVENT_STAT_KEYS.map((key) => (
                      <div key={key}>
                        <Label htmlFor={`stat-${key}`}>{text.stats[key]}</Label>
                        <Input
                          id={`stat-${key}`}
                          type="number"
                          min={0}
                          value={config.stats[key] ?? ""}
                          placeholder={`${text.automatic}: ${autoStats?.[key] ?? "–"}`}
                          onChange={(e) => handleStatChange(key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs">{text.statsHint}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4" />
                    {text.leaderboardTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="leaderboard-enabled"
                      checked={config.leaderboard.enabled}
                      onCheckedChange={(enabled) => update("leaderboard", { enabled })}
                    />
                    <Label htmlFor="leaderboard-enabled">{text.leaderboardEnabled}</Label>
                  </div>
                  <LocalizedField
                    id="leaderboard-badge"
                    label={text.badgeLabel}
                    value={config.leaderboard.badge}
                    onChange={(badge) => update("leaderboard", { badge })}
                    text={text}
                  />
                  <LocalizedField
                    id="leaderboard-heading"
                    label={text.headingLabel}
                    value={config.leaderboard.heading}
                    onChange={(heading) => update("leaderboard", { heading })}
                    text={text}
                  />
                  <LocalizedField
                    id="leaderboard-description"
                    label={text.descriptionLabel}
                    value={config.leaderboard.description}
                    onChange={(description) => update("leaderboard", { description })}
                    multiline
                    text={text}
                  />
                  <SectionLink hint={text.rankingsHint} href="/admin/teams" label={text.rankingsLink} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Images className="h-4 w-4" />
                    {text.galleryTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="gallery-enabled"
                      checked={config.gallery.enabled}
                      onCheckedChange={(enabled) => update("gallery", { enabled })}
                    />
                    <Label htmlFor="gallery-enabled">{text.galleryEnabled}</Label>
                  </div>
                  <LocalizedField
                    id="gallery-heading"
                    label={text.headingLabel}
                    value={config.gallery.heading}
                    onChange={(heading) => update("gallery", { heading })}
                    text={text}
                  />
                  <LocalizedField
                    id="gallery-description"
                    label={text.descriptionLabel}
                    value={config.gallery.description}
                    onChange={(description) => update("gallery", { description })}
                    multiline
                    text={text}
                  />
                  <EventPhotosManager />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Megaphone className="h-4 w-4" />
                    {text.ctaTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <LocalizedField
                    id="cta-heading"
                    label={text.headingLabel}
                    value={config.cta.heading}
                    onChange={(heading) => update("cta", { heading })}
                    text={text}
                  />
                  <LocalizedField
                    id="cta-description"
                    label={text.descriptionLabel}
                    value={config.cta.description}
                    onChange={(description) => update("cta", { description })}
                    multiline
                    text={text}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {config.phase === "live" && (
            <div className="bg-muted flex items-start gap-3 rounded-md px-4 py-3 text-sm">
              <Info className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                <p className="text-muted-foreground">{text.liveInfo}</p>
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="bg-violet hover:bg-violet/90 gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {text.save}
          </Button>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={text.confirmTitle}
        description={text.confirmDescription}
        confirmLabel={text.confirmLabel}
        cancelLabel={text.cancel}
        onConfirm={() => void save()}
        loading={saving}
      />
    </div>
  )
}
