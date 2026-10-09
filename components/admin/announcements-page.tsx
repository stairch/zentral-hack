"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Loader2, Megaphone, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { normalizeHexColor, getContrastForegroundColor } from "@/lib/helpers"

const GLOBAL_SENTINEL = "__global__"

function categoryBadgeStyle(color: string | null) {
  if (!color) return undefined
  const normalized = normalizeHexColor(color)
  return {
    backgroundColor: normalized,
    color: getContrastForegroundColor(normalized),
    borderColor: normalized
  }
}

interface Announcement {
  id: string
  title: string | null
  content: string
  created_at: string
  category_id: string | null
  category_name: string | null
  category_color: string | null
  first_name: string | null
  last_name: string | null
}

interface Category {
  id: string
  name: string
}

const copy = {
  de: {
    heading: "ANKÜNDIGUNGEN",
    subtitle: "Systemnachrichten an Teilnehmer und Admins senden",
    composeTitle: "Neue Ankündigung",
    titleLabel: "Titel (optional)",
    titlePlaceholder: "z.B. Wichtiges Update",
    contentLabel: "Nachricht",
    contentPlaceholder: "Was möchtest du mitteilen?",
    categoryLabel: "Sichtbarkeit",
    categoryPlaceholder: "Zielgruppe wählen",
    globalOption: "Global (alle Kategorien)",
    globalLabel: "Global",
    categoryOwnHint: "Sichtbar für deine Kategorie",
    send: "Veröffentlichen",
    sendSuccess: "Ankündigung veröffentlicht",
    sendError: "Fehler beim Veröffentlichen",
    validationError: "Bitte eine Nachricht eingeben",
    listTitle: "Bisherige Ankündigungen",
    noAnnouncements: "Noch keine Ankündigungen.",
    loadError: "Fehler beim Laden",
    deleteTitle: "Ankündigung löschen?",
    deleteDescription: "Diese Aktion kann nicht rückgängig gemacht werden.",
    deleteConfirm: "Löschen",
    cancel: "Abbrechen",
    deleteSuccess: "Ankündigung gelöscht",
    deleteError: "Fehler beim Löschen",
    by: "von"
  },
  en: {
    heading: "ANNOUNCEMENTS",
    subtitle: "Send system messages to participants and admins",
    composeTitle: "New announcement",
    titleLabel: "Title (optional)",
    titlePlaceholder: "e.g. Important update",
    contentLabel: "Message",
    contentPlaceholder: "What would you like to tell them?",
    categoryLabel: "Visibility",
    categoryPlaceholder: "Select audience",
    globalOption: "Global (all categories)",
    globalLabel: "Global",
    categoryOwnHint: "Visible to your category",
    send: "Publish",
    sendSuccess: "Announcement published",
    sendError: "Failed to publish",
    validationError: "Please enter a message",
    listTitle: "Previous announcements",
    noAnnouncements: "No announcements yet.",
    loadError: "Failed to load",
    deleteTitle: "Delete announcement?",
    deleteDescription: "This action cannot be undone.",
    deleteConfirm: "Delete",
    cancel: "Cancel",
    deleteSuccess: "Announcement deleted",
    deleteError: "Failed to delete",
    by: "by"
  }
} as const

export function AnnouncementsAdminPage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const text = copy[language]
  const dateLocale = language === "en" ? "en-GB" : "de-CH"
  const isCategoryPartner = user?.role === "category_partner"

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState<string>(GLOBAL_SENTINEL)
  const [sending, setSending] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    void load()
    if (!isCategoryPartner) void loadCategories()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/announcements", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setAnnouncements(data.data?.announcements || [])
    } catch {
      toast.error(text.loadError)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setCategories(
        (data.data?.categories || []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))
      )
    } catch {
      // non-critical
    }
  }

  const handleSend = async () => {
    if (!content.trim()) {
      toast.error(text.validationError)
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim() || null,
          content: content.trim(),
          categoryId: isCategoryPartner || categoryId === GLOBAL_SENTINEL ? null : categoryId
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || text.sendError)
      void load()
      setTitle("")
      setContent("")
      toast.success(text.sendSuccess)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.sendError)
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/announcements?id=${deleteId}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (!res.ok) throw new Error()
      setAnnouncements((prev) => prev.filter((a) => a.id !== deleteId))
      toast.success(text.deleteSuccess)
      setDeleteId(null)
    } catch {
      toast.error(text.deleteError)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{text.heading}</h1>
        <p className="text-muted-foreground mt-2">{text.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4" />
            {text.composeTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="announcement-title">{text.titleLabel}</Label>
            <Input
              id="announcement-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={text.titlePlaceholder}
            />
          </div>
          <div>
            <Label htmlFor="announcement-content">{text.contentLabel}</Label>
            <Textarea
              id="announcement-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={text.contentPlaceholder}
              rows={4}
            />
          </div>
          {isCategoryPartner ? (
            <p className="text-muted-foreground text-sm">{text.categoryOwnHint}</p>
          ) : (
            <div>
              <Label>{text.categoryLabel}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder={text.categoryPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GLOBAL_SENTINEL}>{text.globalOption}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            onClick={() => void handleSend()}
            disabled={sending || !content.trim()}
            className="bg-violet hover:bg-violet/90 gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
            {text.send}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-base font-bold">{text.listTitle}</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">{text.noAnnouncements}</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="bg-card border-border rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.title && <p className="font-semibold">{a.title}</p>}
                      <Badge variant="outline" style={categoryBadgeStyle(a.category_color)}>
                        {a.category_name || text.globalLabel}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{a.content}</p>
                    <p className="text-muted-foreground mt-2 text-xs">
                      {text.by} {[a.first_name, a.last_name].filter(Boolean).join(" ") || "—"} ·{" "}
                      {new Date(a.created_at).toLocaleString(dateLocale)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive shrink-0"
                    onClick={() => setDeleteId(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={text.deleteTitle}
        description={text.deleteDescription}
        confirmLabel={text.deleteConfirm}
        cancelLabel={text.cancel}
        onConfirm={() => void handleDelete()}
        loading={deleting}
      />
    </div>
  )
}
