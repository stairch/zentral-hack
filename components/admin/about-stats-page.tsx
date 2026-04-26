"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"

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
    saveError: "Fehler beim Speichern"
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
    saveError: "Failed to save"
  }
} as const

export function AboutStatsPage() {
  const { language } = useLanguage()
  const text = copy[language]

  const [stats, setStats] = useState<Stat[]>(defaultStats)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/site-settings", { credentials: "include" })
        if (!res.ok) return
        const data = await res.json()
        const settings = data.data?.settings || []
        const aboutStats = settings.find((s: { key: string; value: unknown }) => s.key === "about_stats")
        if (aboutStats?.value) setStats(aboutStats.value)
      } catch {
        // use defaults
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const update = (index: number, field: keyof Stat, value: string | number) => {
    setStats((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const remove = (index: number) => {
    setStats((prev) => prev.filter((_, i) => i !== index))
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={add}>
            <Plus className="mr-2 h-4 w-4" />
            {text.add}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {text.save}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">
                <span className="text-yellow font-display text-2xl font-bold">
                  {stat.value}
                  {stat.suffix}
                </span>
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive h-8 w-8"
                onClick={() => remove(index)}>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
