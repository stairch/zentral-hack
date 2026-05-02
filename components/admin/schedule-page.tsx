"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Plus, Trash2, Edit2, ChevronUp, ChevronDown, Moon, Sun } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"

interface ScheduleItem {
  id: string
  day: 1 | 2
  time: string
  icon: string
  title_de: string
  title_en: string
  description_de: string
  description_en: string
  sort_order: number
}

const ICONS_DE = [
  { value: "clock", label: "Uhr" },
  { value: "coffee", label: "Kaffee" },
  { value: "utensils", label: "Besteck" },
  { value: "presentation", label: "Präsentation" },
  { value: "code", label: "Code" },
  { value: "party-popper", label: "Party" },
  { value: "star", label: "Stern" },
  { value: "zap", label: "Blitz" },
  { value: "music", label: "Musik" },
  { value: "trophy", label: "Pokal" },
  { value: "sun", label: "Sonne" },
  { value: "moon", label: "Mond" }
]

const ICONS_EN = [
  { value: "clock", label: "Clock" },
  { value: "coffee", label: "Coffee" },
  { value: "utensils", label: "Utensils" },
  { value: "presentation", label: "Presentation" },
  { value: "code", label: "Code" },
  { value: "party-popper", label: "Party" },
  { value: "star", label: "Star" },
  { value: "zap", label: "Lightning" },
  { value: "music", label: "Music" },
  { value: "trophy", label: "Trophy" },
  { value: "sun", label: "Sun" },
  { value: "moon", label: "Moon" }
]

const copy = {
  de: {
    heading: "ZEITPLAN",
    subtitle: "Schedule-Einträge verwalten",
    newEntry: "Neuer Eintrag",
    day: "Tag",
    day1: "Tag 1",
    day2: "Tag 2",
    day1Full: "Tag 1 (Freitag)",
    day2Full: "Tag 2 (Samstag)",
    noEntries: "Keine Einträge für diesen Tag.",
    left: "← Links",
    right: "Rechts →",
    editEntry: "Eintrag bearbeiten",
    newEntryDialog: "Neuer Eintrag",
    time: "Uhrzeit",
    timePlaceholder: "19:00",
    icon: "Icon",
    titleDe: "Titel Deutsch",
    titleEn: "Titel Englisch",
    descDe: "Beschreibung Deutsch",
    descEn: "Beschreibung Englisch",
    cancel: "Abbrechen",
    save: "Speichern",
    deleteTitle: "Eintrag löschen?",
    deleteWarning: "Diese Aktion kann nicht rückgängig gemacht werden.",
    delete: "Löschen",
    loadError: "Fehler beim Laden",
    validationError: "Zeit, Titel DE und Titel EN sind erforderlich",
    updated: "Aktualisiert",
    added: "Hinzugefügt",
    saveError: "Fehler beim Speichern",
    deleted: "Gelöscht",
    deleteError: "Fehler beim Löschen"
  },
  en: {
    heading: "SCHEDULE",
    subtitle: "Manage schedule entries",
    newEntry: "New Entry",
    day: "Day",
    day1: "Day 1",
    day2: "Day 2",
    day1Full: "Day 1 (Friday)",
    day2Full: "Day 2 (Saturday)",
    noEntries: "No entries for this day.",
    left: "← Left",
    right: "Right →",
    editEntry: "Edit entry",
    newEntryDialog: "New entry",
    time: "Time",
    timePlaceholder: "19:00",
    icon: "Icon",
    titleDe: "Title German",
    titleEn: "Title English",
    descDe: "Description German",
    descEn: "Description English",
    cancel: "Cancel",
    save: "Save",
    deleteTitle: "Delete entry?",
    deleteWarning: "This action cannot be undone.",
    delete: "Delete",
    loadError: "Failed to load",
    validationError: "Time, German title and English title are required",
    updated: "Updated",
    added: "Added",
    saveError: "Failed to save",
    deleted: "Deleted",
    deleteError: "Failed to delete"
  }
} as const

const empty = (): Omit<ScheduleItem, "id"> => ({
  day: 1,
  time: "",
  icon: "clock",
  title_de: "",
  title_en: "",
  description_de: "",
  description_en: "",
  sort_order: 0
})

export function AdminSchedulePage() {
  const { language, isReady } = useLanguage()
  const text = copy[language]
  const ICONS = language === "en" ? ICONS_EN : ICONS_DE

  const [items, setItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState<1 | 2>(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null)
  const [form, setForm] = useState(empty())
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const hasDataFetched = useRef(false)

  const dayItems = items.filter((i) => i.day === activeDay).sort((a, b) => a.sort_order - b.sort_order)

  useEffect(() => {
    if (!isReady || hasDataFetched.current) return
    hasDataFetched.current = true
    void load()
  }, [isReady])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/schedule", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setItems(data.data?.items || [])
    } catch {
      toast.error(text.loadError)
    } finally {
      setLoading(false)
    }
  }

  const openNew = (afterSortOrder?: number) => {
    const dayMax = Math.max(0, ...items.filter((i) => i.day === activeDay).map((i) => i.sort_order))
    const insertSortOrder = afterSortOrder !== undefined ? afterSortOrder + 5 : dayMax + 10
    setEditingItem(null)
    setForm({ ...empty(), day: activeDay, sort_order: insertSortOrder })
    setDialogOpen(true)
  }

  const openEdit = (item: ScheduleItem) => {
    setEditingItem(item)
    setForm({
      day: item.day,
      time: item.time,
      icon: item.icon,
      title_de: item.title_de,
      title_en: item.title_en,
      description_de: item.description_de,
      description_en: item.description_en,
      sort_order: item.sort_order
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!form.time || !form.title_de || !form.title_en) {
      toast.error(text.validationError)
      return
    }
    try {
      setSaving(true)
      const method = editingItem ? "PUT" : "POST"
      const body = editingItem ? { ...form, id: editingItem.id } : form
      const res = await fetch("/api/admin/schedule", {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error()
      toast.success(editingItem ? text.updated : text.added)
      setDialogOpen(false)
      await load()
    } catch {
      toast.error(text.saveError)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!deleteId) return
    try {
      await fetch(`/api/admin/schedule?id=${deleteId}`, { method: "DELETE", credentials: "include" })
      toast.success(text.deleted)
      setDeleteId(null)
      await load()
    } catch {
      toast.error(text.deleteError)
    }
  }

  const move = async (item: ScheduleItem, direction: "up" | "down") => {
    const sorted = [...dayItems]
    const idx = sorted.findIndex((i) => i.id === item.id)
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const sibling = sorted[swapIdx]
    await Promise.all([
      fetch("/api/admin/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: item.id, sort_order: sibling.sort_order })
      }),
      fetch("/api/admin/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: sibling.id, sort_order: item.sort_order })
      })
    ])
    await load()
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">{text.heading}</h1>
          <p className="text-muted-foreground mt-2">{text.subtitle}</p>
        </div>
        <Button onClick={() => openNew()} className="w-full shrink-0 sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {text.newEntry}
        </Button>
      </div>

      {/* Day selector */}
      <div className="flex gap-3">
        {([1, 2] as const).map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`font-display flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold transition-colors ${
              activeDay === day ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
            {day === 1 ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {day === 1 ? text.day1 : text.day2}
          </button>
        ))}
      </div>

      {/* Timeline preview */}
      <div className="space-y-3">
        {dayItems.length === 0 && <p className="text-muted-foreground py-8 text-center">{text.noEntries}</p>}
        {dayItems.map((item, index) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {/* Sort controls */}
                <div className="flex shrink-0 flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => move(item, "up")}
                    disabled={index === 0}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => move(item, "down")}
                    disabled={index === dayItems.length - 1}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Time badge */}
                <div className="bg-primary/10 text-primary shrink-0 rounded-full px-3 py-1 text-sm font-bold">
                  {item.time}
                </div>

                {/* Title + description */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {language === "en" ? item.title_en : item.title_de}
                  </p>
                  <p className="text-muted-foreground truncate text-sm">
                    {language === "en" ? item.description_en : item.description_de}
                  </p>
                </div>

                {/* Actions — hidden on mobile, shown on sm+ */}
                <div className="hidden shrink-0 gap-1 sm:flex">
                  <Button variant="ghost" size="icon" onClick={() => openNew(item.sort_order)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDeleteId(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Mobile action row */}
              <div className="mt-3 flex justify-end gap-1 sm:hidden">
                <Button variant="ghost" size="icon" onClick={() => openNew(item.sort_order)}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => setDeleteId(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? text.editEntry : text.newEntryDialog}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label>{text.day}</Label>
                <Select
                  value={String(form.day)}
                  onValueChange={(v) => setForm((f) => ({ ...f, day: Number(v) as 1 | 2 }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{text.day1Full}</SelectItem>
                    <SelectItem value="2">{text.day2Full}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{text.time}</Label>
                <Input
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  placeholder={text.timePlaceholder}
                />
              </div>
              <div>
                <Label>{text.icon}</Label>
                <Select value={form.icon} onValueChange={(v) => setForm((f) => ({ ...f, icon: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICONS.map((ic) => (
                      <SelectItem key={ic.value} value={ic.value}>
                        {ic.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>{text.titleDe}</Label>
                <Input
                  value={form.title_de}
                  onChange={(e) => setForm((f) => ({ ...f, title_de: e.target.value }))}
                />
              </div>
              <div>
                <Label>{text.titleEn}</Label>
                <Input
                  value={form.title_en}
                  onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>{text.descDe}</Label>
                <Textarea
                  value={form.description_de}
                  onChange={(e) => setForm((f) => ({ ...f, description_de: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label>{text.descEn}</Label>
                <Textarea
                  value={form.description_en}
                  onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {text.cancel}
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {text.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{text.deleteTitle}</DialogTitle>
            <p className="text-muted-foreground text-sm">{text.deleteWarning}</p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {text.cancel}
            </Button>
            <Button onClick={remove} className="bg-destructive text-destructive-foreground">
              {text.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
