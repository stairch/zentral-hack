"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface Stat {
  value: number
  suffix: string
  label_de: string
  label_en: string
}

const defaultStats: Stat[] = [
  { value: 24, suffix: "", label_de: "Stunden", label_en: "Hours" },
  { value: 4, suffix: "", label_de: "Kategorien", label_en: "Categories" },
  { value: 200, suffix: "+", label_de: "Teilnehmende", label_en: "Participants" },
  { value: 1, suffix: "", label_de: "Ziel", label_en: "Goal" }
]

const copy = {
  de: {
    heading: "ABOUT STATS",
    subtitle: "Statistiken im About-Bereich der Website",
    add: "Hinzufügen",
    save: "Speichern",
    value: "Wert",
    suffix: "Suffix (z.B. +)",
    suffixPlaceholder: "leer lassen wenn kein Suffix",
    labelDe: "Label Deutsch",
    labelEn: "Label Englisch",
    newLabelDe: "Neu",
    newLabelEn: "New",
    saved: "Gespeichert",
    saveError: "Fehler beim Speichern",
    previewTitle: "Vorschau",
    unsavedChanges: "Ungespeicherte Änderungen",
    leaveTitle: "Seite verlassen?",
    leaveDescription: "Du hast ungespeicherte Änderungen. Wenn du die Seite verlässt, gehen diese verloren.",
    leaveConfirm: "Verlassen",
    leaveCancel: "Abbrechen"
  },
  en: {
    heading: "ABOUT STATS",
    subtitle: "Statistics displayed in the About section of the website",
    add: "Add",
    save: "Save",
    value: "Value",
    suffix: "Suffix (e.g. +)",
    suffixPlaceholder: "leave empty for no suffix",
    labelDe: "Label German",
    labelEn: "Label English",
    newLabelDe: "New",
    newLabelEn: "New",
    saved: "Saved",
    saveError: "Failed to save",
    previewTitle: "Preview",
    unsavedChanges: "Unsaved changes",
    leaveTitle: "Leave page?",
    leaveDescription: "You have unsaved changes. If you leave, they will be lost.",
    leaveConfirm: "Leave",
    leaveCancel: "Cancel"
  }
} as const

export function AboutStatsPage() {
  const { language } = useLanguage()
  const text = copy[language]
  const router = useRouter()

  const [stats, setStats] = useState<Stat[]>(defaultStats)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [leaveHref, setLeaveHref] = useState<string | null>(null)
  // Tracks the last persisted state to compare against
  const savedStats = useRef<Stat[]>(defaultStats)

  const isDirty = JSON.stringify(stats) !== JSON.stringify(savedStats.current)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/site-settings", { credentials: "include" })
        if (!res.ok) return
        const data = await res.json()
        const settings = data.data?.settings || []
        const aboutStats = settings.find((s: { key: string; value: unknown }) => s.key === "about_stats")
        if (aboutStats?.value) {
          setStats(aboutStats.value)
          savedStats.current = aboutStats.value
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  // Warn on browser refresh / tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  // Intercept Next.js link navigations
  useEffect(() => {
    if (!isDirty) return

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return

      e.preventDefault()
      setLeaveHref(href)
    }

    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [isDirty])

  const confirmLeave = () => {
    if (!leaveHref) return
    router.push(leaveHref)
    setLeaveHref(null)
  }

  const update = (index: number, field: keyof Stat, value: string | number) => {
    setStats((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const remove = () => {
    if (deleteIndex === null) return
    setStats((prev) => prev.filter((_, i) => i !== deleteIndex))
    setDeleteIndex(null)
  }

  const add = () => {
    setStats((prev) => [
      ...prev,
      { value: 0, suffix: "", label_de: text.newLabelDe, label_en: text.newLabelEn }
    ])
  }

  const save = async () => {
    try {
      setSaving(true)
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key: "about_stats", value: stats })
      })
      if (!res.ok) throw new Error()
      // Update the saved baseline so isDirty resets to false
      savedStats.current = stats
      toast.success(text.saved)
    } catch {
      toast.error(text.saveError)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">{text.heading}</h1>
          <p className="text-muted-foreground mt-2">{text.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="rounded-lg border border-yellow-400 bg-yellow-100 px-2 text-sm text-yellow-800">
              {text.unsavedChanges}
            </span>
          )}
          <Button variant="outline" onClick={add}>
            <Plus className="mr-2 h-4 w-4" />
            {text.add}
          </Button>
          <Button onClick={save} disabled={saving || !isDirty}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {text.save}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{language === "de" ? stat.label_de : stat.label_en}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive h-8 w-8"
                onClick={() => setDeleteIndex(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{text.value}</Label>
                  <Input
                    type="number"
                    value={stat.value}
                    onChange={(e) => update(index, "value", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">{text.suffix}</Label>
                  <Input
                    value={stat.suffix}
                    onChange={(e) => update(index, "suffix", e.target.value)}
                    placeholder={text.suffixPlaceholder}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{text.labelDe}</Label>
                  <Input value={stat.label_de} onChange={(e) => update(index, "label_de", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">{text.labelEn}</Label>
                  <Input value={stat.label_en} onChange={(e) => update(index, "label_en", e.target.value)} />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {/* Preview German */}
                <div>
                  <p className="text-xs font-medium">{text.previewTitle} (DE)</p>
                  <div className="bg-primary mt-2 flex w-fit flex-col items-center gap-1 rounded-lg px-5 py-2 font-bold">
                    <div className="text-yellow font-display text-3xl">
                      {stat.value}
                      {stat.suffix}
                    </div>
                    <div>
                      <div className="text-light-violet text-xs font-medium">{stat.label_de}</div>
                    </div>
                  </div>
                </div>
                {/* Preview English */}
                <div>
                  <p className="text-xs font-medium">{text.previewTitle} (EN)</p>
                  <div className="bg-primary mt-2 flex w-fit flex-col items-center gap-1 rounded-lg px-5 py-2 font-bold">
                    <div className="text-yellow font-display text-3xl">
                      {stat.value}
                      {stat.suffix}
                    </div>
                    <div>
                      <div className="text-light-violet text-xs font-medium">{stat.label_en}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteIndex !== null}
        onOpenChange={(open) => !open && setDeleteIndex(null)}
        title={language === "en" ? "Delete stat?" : "Statistik löschen?"}
        description={
          language === "en"
            ? "This stat will be removed. Don't forget to save afterwards."
            : "Diese Statistik wird entfernt. Vergiss nicht, danach zu speichern."
        }
        confirmLabel={language === "en" ? "Delete" : "Löschen"}
        cancelLabel={language === "en" ? "Cancel" : "Abbrechen"}
        onConfirm={remove}
      />
      {/* Leave page confirmation */}
      <ConfirmDialog
        open={leaveHref !== null}
        onOpenChange={(open) => !open && setLeaveHref(null)}
        title={text.leaveTitle}
        description={text.leaveDescription}
        confirmLabel={text.leaveConfirm}
        cancelLabel={text.leaveCancel}
        onConfirm={confirmLeave}
      />
    </div>
  )
}
