"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Plus, Loader2, Pencil, Trash2, GripVertical, HelpCircle, ChevronUp, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"

interface FAQ {
  id: string
  question: string
  question_en?: string | null
  answer: string
  answer_en?: string | null
  order_position: number
  is_active: boolean
  created_at: string
}

export function FAQAdminPage() {
  const { language } = useLanguage()
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [form, setForm] = useState({ question: "", questionEn: "", answer: "", answerEn: "" })
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const text =
    language === "en"
      ? {
          heading: "FAQ MANAGEMENT",
          subtitle: "Manage frequently asked questions",
          newFaq: "New FAQ",
          editFaq: "Edit FAQ",
          createFaq: "Create FAQ",
          editDescription: "Edit the question and answer",
          createDescription: "Create a new frequently asked question",
          germanSection: "German",
          englishSection: "English",
          questionLabel: "Question",
          questionPlaceholder: "e.g. What is Zentral Hack?",
          answerLabel: "Answer",
          answerPlaceholder: "Answer to the question...",
          questionRequired: "Question and answer are required in German and English",
          loadError: "Failed to load FAQs",
          updateError: "Failed to update",
          createError: "Failed to create",
          saveError: "Failed to save",
          updateSuccess: "FAQ updated",
          createSuccess: "FAQ created",
          deleteConfirm: "Delete this FAQ?",
          deleteSuccess: "FAQ deleted",
          deleteError: "Failed to delete",
          sortError: "Failed to reorder",
          allFaqs: "All FAQs",
          active: "active",
          save: "Save",
          create: "Create",
          noFaqs: 'No FAQs yet. Click "New FAQ" to get started.'
        }
      : {
          heading: "FAQ VERWALTUNG",
          subtitle: "Häufig gestellte Fragen verwalten",
          newFaq: "Neue FAQ",
          editFaq: "FAQ bearbeiten",
          createFaq: "Neue FAQ erstellen",
          editDescription: "Bearbeite die Frage und Antwort",
          createDescription: "Erstelle eine neue häufig gestellte Frage",
          germanSection: "Deutsch",
          englishSection: "Englisch",
          questionLabel: "Frage",
          questionPlaceholder: "z.B. Was ist der Zentral Hack?",
          answerLabel: "Antwort",
          answerPlaceholder: "Die Antwort auf die Frage...",
          questionRequired: "Frage und Antwort sind in Deutsch und Englisch erforderlich",
          loadError: "Fehler beim Laden der FAQs",
          updateError: "Fehler beim Aktualisieren",
          createError: "Fehler beim Erstellen",
          saveError: "Fehler beim Speichern",
          updateSuccess: "FAQ aktualisiert",
          createSuccess: "FAQ erstellt",
          deleteConfirm: "FAQ wirklich löschen?",
          deleteSuccess: "FAQ gelöscht",
          deleteError: "Fehler beim Löschen",
          sortError: "Fehler beim Sortieren",
          allFaqs: "Alle FAQs",
          active: "aktiv",
          save: "Speichern",
          create: "Erstellen",
          noFaqs: 'Noch keine FAQs. Klicke auf "Neue FAQ", um zu starten.'
        }

  useEffect(() => {
    fetchFaqs()
  }, [])

  const fetchFaqs = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/faqs", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setFaqs(data.data?.faqs || [])
      }
    } catch {
      toast.error(text.loadError)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingFaq(null)
    setForm({ question: "", questionEn: "", answer: "", answerEn: "" })
    setDialogOpen(true)
  }

  const openEdit = (faq: FAQ) => {
    setEditingFaq(faq)
    setForm({
      question: faq.question,
      questionEn: faq.question_en || "",
      answer: faq.answer,
      answerEn: faq.answer_en || ""
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.question.trim() || !form.questionEn.trim() || !form.answer.trim() || !form.answerEn.trim()) {
      toast.error(text.questionRequired)
      return
    }

    setSaving(true)
    try {
      const payload = {
        question: form.question,
        questionEn: form.questionEn,
        answer: form.answer,
        answerEn: form.answerEn
      }

      if (editingFaq) {
        const res = await fetch("/api/admin/faqs", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            id: editingFaq.id,
            ...payload
          })
        })
        if (!res.ok) throw new Error(text.updateError)
        setFaqs(
          faqs.map((f) =>
            f.id === editingFaq.id
              ? {
                  ...f,
                  question: payload.question,
                  question_en: payload.questionEn,
                  answer: payload.answer,
                  answer_en: payload.answerEn
                }
              : f
          )
        )
        toast.success(text.updateSuccess)
      } else {
        const res = await fetch("/api/admin/faqs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error(text.createError)
        const data = await res.json()
        setFaqs([...faqs, data.data.faq])
        toast.success(text.createSuccess)
      }
      setDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.saveError)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(text.deleteConfirm)) return
    try {
      const res = await fetch(`/api/admin/faqs?id=${id}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (res.ok) {
        setFaqs(faqs.filter((f) => f.id !== id))
        toast.success(text.deleteSuccess)
      }
    } catch {
      toast.error(text.deleteError)
    }
  }

  const toggleActive = async (faq: FAQ) => {
    try {
      const res = await fetch("/api/admin/faqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: faq.id, is_active: !faq.is_active })
      })
      if (res.ok) {
        setFaqs(faqs.map((f) => (f.id === faq.id ? { ...f, is_active: !f.is_active } : f)))
      }
    } catch {
      toast.error(text.updateError)
    }
  }

  const moveOrder = async (faq: FAQ, direction: "up" | "down") => {
    const idx = faqs.findIndex((f) => f.id === faq.id)
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= faqs.length) return
    const newFaqs = [...faqs]
    ;[newFaqs[idx], newFaqs[swapIdx]] = [newFaqs[swapIdx], newFaqs[idx]]
    const updated = newFaqs.map((f, i) => ({ ...f, order_position: i + 1 }))
    setFaqs(updated)
    try {
      await fetch("/api/admin/faqs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderedIds: updated.map((f) => f.id) })
      })
    } catch {
      toast.error(text.sortError)
      fetchFaqs()
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (id !== dragId) setDragOverId(id)
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    setDragOverId(null)
    if (!dragId || dragId === targetId) {
      setDragId(null)
      return
    }
    const fromIdx = faqs.findIndex((f) => f.id === dragId)
    const toIdx = faqs.findIndex((f) => f.id === targetId)
    const newFaqs = [...faqs]
    const [removed] = newFaqs.splice(fromIdx, 1)
    newFaqs.splice(toIdx, 0, removed)
    const updated = newFaqs.map((f, i) => ({ ...f, order_position: i + 1 }))
    setFaqs(updated)
    setDragId(null)
    try {
      await fetch("/api/admin/faqs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderedIds: updated.map((f) => f.id) })
      })
    } catch {
      toast.error(text.sortError)
      fetchFaqs()
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
          <h1 className="text-foreground font-display text-3xl font-bold">{text.heading}</h1>
          <p className="text-muted-foreground mt-2">{text.subtitle}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet hover:bg-violet/90 gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> {text.newFaq}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingFaq ? text.editFaq : text.createFaq}</DialogTitle>
              <DialogDescription>
                {editingFaq ? text.editDescription : text.createDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pr-1">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4 rounded-lg border p-4">
                  <p className="text-sm font-semibold">{text.germanSection}</p>
                  <div>
                    <Label htmlFor="question">Frage</Label>
                    <Input
                      id="question"
                      value={form.question}
                      onChange={(e) => setForm({ ...form, question: e.target.value })}
                      placeholder="z.B. Was ist der Zentral Hack?"
                    />
                  </div>
                  <div>
                    <Label htmlFor="answer">Antwort</Label>
                    <Textarea
                      id="answer"
                      value={form.answer}
                      onChange={(e) => setForm({ ...form, answer: e.target.value })}
                      placeholder="Die Antwort auf die Frage..."
                      rows={5}
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                  <p className="text-sm font-semibold">{text.englishSection}</p>
                  <div>
                    <Label htmlFor="questionEn">Question</Label>
                    <Input
                      id="questionEn"
                      value={form.questionEn}
                      onChange={(e) => setForm({ ...form, questionEn: e.target.value })}
                      placeholder="e.g. What is Zentral Hack?"
                    />
                  </div>
                  <div>
                    <Label htmlFor="answerEn">Answer</Label>
                    <Textarea
                      id="answerEn"
                      value={form.answerEn}
                      onChange={(e) => setForm({ ...form, answerEn: e.target.value })}
                      placeholder="Answer to the question..."
                      rows={5}
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="bg-violet hover:bg-violet/90 w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingFaq ? text.save : text.create}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{text.allFaqs}</CardTitle>
          <CardDescription>
            {faqs.length} FAQ{faqs.length !== 1 ? "s" : ""} • {faqs.filter((f) => f.is_active).length}{" "}
            {text.active}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {faqs.length > 0 ? (
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={faq.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, faq.id)}
                  onDragOver={(e) => handleDragOver(e, faq.id)}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => handleDrop(e, faq.id)}
                  onDragEnd={() => {
                    setDragId(null)
                    setDragOverId(null)
                  }}
                  className={[
                    "flex items-start gap-3 rounded-lg border p-4 transition-colors select-none",
                    faq.is_active
                      ? "border-border bg-card"
                      : "border-muted bg-muted/30 border-dashed opacity-60",
                    dragId === faq.id ? "opacity-40" : "",
                    dragOverId === faq.id ? "border-primary ring-primary ring-2" : ""
                  ].join(" ")}>
                  {/* Drag handle + chevrons */}
                  <div className="flex shrink-0 flex-col items-center gap-0.5 pt-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={idx === 0}
                      onClick={() => moveOrder(faq, "up")}>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <GripVertical className="text-muted-foreground h-4 w-4 cursor-grab active:cursor-grabbing" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={idx === faqs.length - 1}
                      onClick={() => moveOrder(faq, "down")}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <HelpCircle className="text-violet mt-1 h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {language === "en" ? faq.question_en || faq.question : faq.question}
                    </p>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                      {language === "en" ? faq.answer_en || faq.answer : faq.answer}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch checked={faq.is_active} onCheckedChange={() => toggleActive(faq)} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(faq)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(faq.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <HelpCircle className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">{text.noFaqs}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
