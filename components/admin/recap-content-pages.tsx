"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ContentVisibilityNotice } from "@/components/admin/content-visibility-notice"
import { EventPhotosManager } from "@/components/admin/event-photos-manager"
import { RankingsManager } from "@/components/admin/rankings-manager"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import {
  DEFAULT_EVENT_PHASE,
  POST_EVENT_STAT_KEYS,
  parseEventPhaseConfig,
  type EventPhaseConfig,
  type LocalizedText,
  type PostEventStats
} from "@/lib/event-phase"

const copy = {
  de: {
    hero: { heading: "HERO", subtitle: "Einstiegsbereich der Rückblick-Startseite" },
    stats: { heading: "KENNZAHLEN", subtitle: "Zahlen im Hero der Rückblick-Startseite" },
    leaderboard: { heading: "SIEGER-TEAMS", subtitle: "Rangliste der Gewinner-Teams pro Challenge" },
    gallery: { heading: "GALERIE", subtitle: "Fotos vom Event" },
    cta: { heading: "ABSCHLUSS", subtitle: "Abschlussbereich am Ende der Rückblick-Startseite" },
    unsaved: "Ungespeicherte Änderungen",
    dateLabel: "Datumszeile",
    headingLabel: "Titel",
    headingAccentLabel: "Titel (hervorgehoben)",
    descriptionLabel: "Beschreibung",
    statsHint: "Leer lassen, um den automatisch gezählten Wert zu verwenden.",
    statLabels: { participants: "Teilnehmende", teams: "Teams", sponsors: "Partner & Sponsoren" },
    automatic: "Automatisch",
    sectionEnabled: "Sektion anzeigen",
    badgeLabel: "Badge",
    german: "Deutsch",
    english: "Englisch",
    save: "Speichern",
    saveSuccess: "Einstellungen gespeichert",
    saveError: "Fehler beim Speichern",
    loadError: "Fehler beim Laden"
  },
  en: {
    hero: { heading: "HERO", subtitle: "Opening section of the recap homepage" },
    stats: { heading: "KEY FIGURES", subtitle: "Figures in the hero of the recap homepage" },
    leaderboard: { heading: "WINNING TEAMS", subtitle: "Ranking of the winning teams per challenge" },
    gallery: { heading: "GALLERY", subtitle: "Photos from the event" },
    cta: { heading: "CLOSING", subtitle: "Closing section at the end of the recap homepage" },
    unsaved: "Unsaved changes",
    dateLabel: "Date line",
    headingLabel: "Title",
    headingAccentLabel: "Title (highlighted)",
    descriptionLabel: "Description",
    statsHint: "Leave empty to use the automatically counted value.",
    statLabels: { participants: "Participants", teams: "Teams", sponsors: "Partners & Sponsors" },
    automatic: "Automatic",
    sectionEnabled: "Show section",
    badgeLabel: "Badge",
    german: "German",
    english: "English",
    save: "Save",
    saveSuccess: "Settings saved",
    saveError: "Failed to save",
    loadError: "Failed to load"
  }
} as const

type Copy = (typeof copy)[keyof typeof copy]
type RecapSection = Exclude<keyof EventPhaseConfig, "phase">

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

// Loads and saves one section of the recap config. The other sections and the phase are sent back as stored.
function useRecapSection<K extends RecapSection>(section: K, text: Copy) {
  const [draft, setDraft] = useState<EventPhaseConfig[K]>(DEFAULT_EVENT_PHASE[section])
  const [savedConfig, setSavedConfig] = useState<EventPhaseConfig>(DEFAULT_EVENT_PHASE)
  const [autoStats, setAutoStats] = useState<PostEventStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const dirty = JSON.stringify(draft) !== JSON.stringify(savedConfig[section])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/event-phase", { credentials: "include" })
        if (!res.ok) throw new Error()
        const data = await res.json()
        const loaded = parseEventPhaseConfig(data.data?.config)
        setSavedConfig(loaded)
        setDraft(loaded[section])
        setAutoStats(data.data?.autoStats ?? null)
      } catch {
        toast.error(text.loadError)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const update = (patch: Partial<EventPhaseConfig[K]>) => setDraft((prev) => ({ ...prev, ...patch }))

  // PUT stores the content only, the phase stays as it is on the server
  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/event-phase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...savedConfig, [section]: draft })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || text.saveError)
      const saved = parseEventPhaseConfig(data.data?.config)
      setSavedConfig(saved)
      setDraft(saved[section])
      toast.success(text.saveSuccess)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.saveError)
    } finally {
      setSaving(false)
    }
  }

  return { draft, update, autoStats, loading, saving, dirty, save }
}

function RecapPageLayout({
  section,
  text,
  state,
  children,
  extra
}: {
  section: RecapSection
  text: Copy
  state: Pick<ReturnType<typeof useRecapSection>, "loading" | "saving" | "dirty" | "save">
  children: ReactNode
  // Content with its own save logic, rendered below the form
  extra?: ReactNode
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{text[section].heading}</h1>
        <p className="text-muted-foreground mt-2">{text[section].subtitle}</p>
      </div>
      <ContentVisibilityNotice shownIn="post" />

      {state.loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-5">{children}</CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => void state.save()}
              disabled={state.saving || !state.dirty}
              className="bg-violet hover:bg-violet/90 gap-2">
              {state.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {text.save}
            </Button>
            {state.dirty && <Badge variant="outline">{text.unsaved}</Badge>}
          </div>

          {extra}
        </>
      )}
    </div>
  )
}

function SectionEnabledSwitch({
  id,
  checked,
  onCheckedChange,
  text
}: {
  id: string
  checked: boolean
  onCheckedChange: (enabled: boolean) => void
  text: Copy
}) {
  return (
    <div className="flex items-center gap-3">
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id}>{text.sectionEnabled}</Label>
    </div>
  )
}

export function RecapHeroPage() {
  const { language } = useLanguage()
  const text = copy[language]
  const state = useRecapSection("hero", text)
  const { draft, update } = state

  return (
    <RecapPageLayout section="hero" text={text} state={state}>
      <LocalizedField
        id="hero-date"
        label={text.dateLabel}
        value={draft.date}
        onChange={(date) => update({ date })}
        text={text}
      />
      <LocalizedField
        id="hero-heading"
        label={text.headingLabel}
        value={draft.heading}
        onChange={(heading) => update({ heading })}
        text={text}
      />
      <LocalizedField
        id="hero-heading-accent"
        label={text.headingAccentLabel}
        value={draft.headingAccent}
        onChange={(headingAccent) => update({ headingAccent })}
        text={text}
      />
      <LocalizedField
        id="hero-description"
        label={text.descriptionLabel}
        value={draft.description}
        onChange={(description) => update({ description })}
        multiline
        text={text}
      />
    </RecapPageLayout>
  )
}

export function RecapStatsPage() {
  const { language } = useLanguage()
  const text = copy[language]
  const state = useRecapSection("stats", text)
  const { draft, update, autoStats } = state

  const handleStatChange = (key: (typeof POST_EVENT_STAT_KEYS)[number], value: string) => {
    const parsed = Number.parseInt(value, 10)
    update({ [key]: value === "" || Number.isNaN(parsed) ? null : Math.max(0, parsed) })
  }

  return (
    <RecapPageLayout section="stats" text={text} state={state}>
      <div className="grid gap-3 md:grid-cols-3">
        {POST_EVENT_STAT_KEYS.map((key) => (
          <div key={key}>
            <Label htmlFor={`stat-${key}`}>{text.statLabels[key]}</Label>
            <Input
              id={`stat-${key}`}
              type="number"
              min={0}
              value={draft[key] ?? ""}
              placeholder={`${text.automatic}: ${autoStats?.[key] ?? "–"}`}
              onChange={(e) => handleStatChange(key, e.target.value)}
            />
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">{text.statsHint}</p>
    </RecapPageLayout>
  )
}

export function RecapLeaderboardPage() {
  const { language } = useLanguage()
  const text = copy[language]
  const state = useRecapSection("leaderboard", text)
  const { draft, update } = state

  return (
    <RecapPageLayout section="leaderboard" text={text} state={state} extra={<RankingsManager />}>
      <SectionEnabledSwitch
        id="leaderboard-enabled"
        checked={draft.enabled}
        onCheckedChange={(enabled) => update({ enabled })}
        text={text}
      />
      <LocalizedField
        id="leaderboard-badge"
        label={text.badgeLabel}
        value={draft.badge}
        onChange={(badge) => update({ badge })}
        text={text}
      />
      <LocalizedField
        id="leaderboard-heading"
        label={text.headingLabel}
        value={draft.heading}
        onChange={(heading) => update({ heading })}
        text={text}
      />
      <LocalizedField
        id="leaderboard-description"
        label={text.descriptionLabel}
        value={draft.description}
        onChange={(description) => update({ description })}
        multiline
        text={text}
      />
    </RecapPageLayout>
  )
}

export function RecapGalleryPage() {
  const { language } = useLanguage()
  const text = copy[language]
  const state = useRecapSection("gallery", text)
  const { draft, update } = state

  return (
    <RecapPageLayout section="gallery" text={text} state={state} extra={<EventPhotosManager />}>
      <SectionEnabledSwitch
        id="gallery-enabled"
        checked={draft.enabled}
        onCheckedChange={(enabled) => update({ enabled })}
        text={text}
      />
      <LocalizedField
        id="gallery-heading"
        label={text.headingLabel}
        value={draft.heading}
        onChange={(heading) => update({ heading })}
        text={text}
      />
      <LocalizedField
        id="gallery-description"
        label={text.descriptionLabel}
        value={draft.description}
        onChange={(description) => update({ description })}
        multiline
        text={text}
      />
    </RecapPageLayout>
  )
}

export function RecapClosingPage() {
  const { language } = useLanguage()
  const text = copy[language]
  const state = useRecapSection("cta", text)
  const { draft, update } = state

  return (
    <RecapPageLayout section="cta" text={text} state={state}>
      <LocalizedField
        id="cta-heading"
        label={text.headingLabel}
        value={draft.heading}
        onChange={(heading) => update({ heading })}
        text={text}
      />
      <LocalizedField
        id="cta-description"
        label={text.descriptionLabel}
        value={draft.description}
        onChange={(description) => update({ description })}
        multiline
        text={text}
      />
    </RecapPageLayout>
  )
}
