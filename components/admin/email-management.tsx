"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Mail,
  Users,
  Send,
  Loader2,
  Check,
  Eye,
  FlaskConical,
  Layout,
  Save,
  Trash2,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import { renderEmailTemplate } from "@/lib/email-templates"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface NewsletterSubscriber {
  email: string
  subscribed: boolean
}

interface Template {
  id: string
  name: string
  description: string
}

interface SavedTemplate {
  id: string
  name: string
  description: string
  base_template_id: string
  subject: string
  content: string
  cta_text: string | null
  cta_url: string | null
  footer_note: string | null
  created_at: string
  updated_at: string
}

const templates: Template[] = [
  {
    id: "standard",
    name: "Standard",
    description: "Klares CD-Layout mit starkem Branding und ruhigem Lesefluss"
  },
  {
    id: "announcement",
    name: "Ankündigung",
    description: "Starker Fokus für wichtige News und Entscheidungen"
  },
  {
    id: "event-reminder",
    name: "Event-Erinnerung",
    description: "Fokussiert auf nächste Schritte vor dem Event"
  },
  {
    id: "update",
    name: "Update / Newsletter",
    description: "Editorial-Layout für regelmässige Updates und Rückblicke"
  }
]

interface CampaignPreset {
  id: string
  name: string
  description: string
  templateId: string
  subject: string
  content: string
  ctaText?: string
  ctaUrl?: string
  footerNote?: string
}

const campaignPresets: CampaignPreset[] = [
  {
    id: "deadline-reminder",
    name: "Deadline Reminder",
    description: "Schnelle Erinnerung mit klarer Handlung",
    templateId: "event-reminder",
    subject: "Wichtige Frist: Deine nächsten Schritte bei Zentral Hack",
    content:
      "Hallo zusammen!\n\nIn den nächsten Tagen steht eine wichtige Frist an. Bitte prüft eure Anmeldung und ergänzt fehlende Angaben rechtzeitig.\n\nVielen Dank für euren Einsatz und bis bald am Event!",
    ctaText: "Jetzt Anmeldung prüfen",
    ctaUrl: "https://zentralhack.ch/anmeldung",
    footerNote: "Bei Fragen sind wir jederzeit per Mail erreichbar."
  },
  {
    id: "announcement-news",
    name: "Wichtige Ankündigung",
    description: "Für Partner- oder Event-News mit hoher Sichtbarkeit",
    templateId: "announcement",
    subject: "Neuigkeiten rund um Zentral Hack 2026",
    content:
      "Wir haben eine wichtige Ankündigung für euch!\n\nBitte nehmt euch kurz Zeit und lest alle Details aufmerksam durch.\n\nWir freuen uns auf den nächsten Schritt mit euch.",
    ctaText: "Alle Details ansehen",
    ctaUrl: "https://zentralhack.ch"
  },
  {
    id: "weekly-update",
    name: "Weekly Update",
    description: "Regelmäßiger Newsletter mit ruhigem Lesefluss",
    templateId: "update",
    subject: "Zentral Hack Weekly: Das Wichtigste diese Woche",
    content:
      "Diese Woche im Überblick:\n\n- Neue Partner wurden bestätigt\n- Programm-Updates sind online\n- Die Q&A-Session startet am Mittwoch\n\nDanke, dass ihr Teil unserer Community seid!",
    footerNote: "Falls du diese Mails nicht mehr erhalten möchtest, kannst du dich jederzeit abmelden."
  }
]

const draftStorageKey = "zh-email-draft-v1"

export function EmailManagementPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [campaignSent, setCampaignSent] = useState(false)
  const [activeTab, setActiveTab] = useState("compose")
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [draftRestored, setDraftRestored] = useState(false)

  const [emailForm, setEmailForm] = useState({
    subject: "",
    subjectEn: "",
    content: "",
    contentEn: "",
    templateId: "standard",
    recipientType: "central_updates" as string,
    ctaText: "",
    ctaTextEn: "",
    ctaUrl: "",
    footerNote: "",
    footerNoteEn: "",
    testEmail: ""
  })

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/admin/email-subscribers", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setSubscribers(data.data?.subscribers || [])
        }
      } catch (error) {
        console.error("Failed to fetch subscribers:", error)
        toast.error("Fehler beim Laden der Abonnenten")
      } finally {
        setLoading(false)
      }
    }
    fetchSubscribers()
    fetchSavedTemplates()
  }, [])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftStorageKey)
      if (!raw) return

      const parsed = JSON.parse(raw) as { form?: typeof emailForm }
      if (!parsed.form) return

      setEmailForm((prev) => ({ ...prev, ...parsed.form }))
      setDraftRestored(true)
    } catch (error) {
      console.warn("Failed to restore email draft", error)
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        draftStorageKey,
        JSON.stringify({ form: emailForm, savedAt: new Date().toISOString() })
      )
    } catch (error) {
      console.warn("Failed to save email draft", error)
    }
  }, [emailForm])

  async function fetchSavedTemplates() {
    try {
      const res = await fetch("/api/admin/email-templates", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setSavedTemplates(data.data?.templates || [])
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    }
  }

  async function handleSaveTemplate() {
    if (!templateName.trim() || !emailForm.subject.trim() || !emailForm.content.trim()) {
      toast.error("Name, Betreff und Inhalt sind erforderlich")
      return
    }
    try {
      setSavingTemplate(true)
      const res = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          baseTemplateId: emailForm.templateId,
          subject: emailForm.subject,
          content: emailForm.content,
          ctaText: emailForm.ctaText || null,
          ctaUrl: emailForm.ctaUrl || null,
          footerNote: emailForm.footerNote || null
        })
      })
      if (res.ok) {
        toast.success("Vorlage gespeichert")
        setTemplateDialogOpen(false)
        setTemplateName("")
        setTemplateDescription("")
        fetchSavedTemplates()
      } else {
        throw new Error("Save failed")
      }
    } catch {
      toast.error("Fehler beim Speichern der Vorlage")
    } finally {
      setSavingTemplate(false)
    }
  }

  async function confirmDeleteTemplate() {
    if (!deleteTemplateId) return
    try {
      setDeletingTemplate(true)
      const res = await fetch(`/api/admin/email-templates?id=${deleteTemplateId}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (res.ok) {
        toast.success("Vorlage gelöscht")
        setDeleteTemplateId(null)
        fetchSavedTemplates()
      }
    } catch {
      toast.error("Fehler beim Löschen")
    } finally {
      setDeletingTemplate(false)
    }
  }

  function loadSavedTemplate(template: SavedTemplate) {
    setEmailForm({
      subject: template.subject,
      subjectEn: "",
      content: template.content,
      contentEn: "",
      templateId: template.base_template_id,
      recipientType: "central_updates",
      ctaText: template.cta_text || "",
      ctaTextEn: "",
      ctaUrl: template.cta_url || "",
      footerNote: template.footer_note || "",
      footerNoteEn: "",
      testEmail: emailForm.testEmail
    })
    setDialogOpen(true)
    toast.success(`Vorlage "${template.name}" geladen`)
  }

  function applyPreset(preset: CampaignPreset) {
    setEmailForm((prev) => ({
      ...prev,
      subject: preset.subject,
      subjectEn: "",
      content: preset.content,
      contentEn: "",
      templateId: preset.templateId,
      ctaText: preset.ctaText || "",
      ctaTextEn: "",
      ctaUrl: preset.ctaUrl || "",
      footerNote: preset.footerNote || "",
      footerNoteEn: ""
    }))
    toast.success(`Preset "${preset.name}" übernommen`)
  }

  function resetDraft() {
    const resetState = {
      subject: "",
      subjectEn: "",
      content: "",
      contentEn: "",
      templateId: "standard",
      recipientType: "central_updates" as string,
      ctaText: "",
      ctaTextEn: "",
      ctaUrl: "",
      footerNote: "",
      footerNoteEn: "",
      testEmail: ""
    }

    setEmailForm(resetState)
    window.localStorage.removeItem(draftStorageKey)
    toast.success("Entwurf zurückgesetzt")
  }

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === emailForm.templateId),
    [emailForm.templateId]
  )

  // Preview exactly matches the HTML generated by backend template rendering.
  const previewHtml = useMemo(() => {
    try {
      return renderEmailTemplate(emailForm.templateId, {
        subject: emailForm.subject || "Betreff",
        content: emailForm.content || "Hier erscheint deine Nachrichtenvorschau.",
        subjectEn: emailForm.subjectEn || undefined,
        contentEn: emailForm.contentEn || undefined,
        ctaText: emailForm.ctaText || undefined,
        ctaTextEn: emailForm.ctaTextEn || undefined,
        ctaUrl: emailForm.ctaUrl || undefined,
        footerNote: emailForm.footerNote || undefined,
        footerNoteEn: emailForm.footerNoteEn || undefined
      })
    } catch {
      return '<p style="font-family: sans-serif; color: #991b1b;">Vorschau konnte nicht geladen werden.</p>'
    }
  }, [
    emailForm.subject,
    emailForm.subjectEn,
    emailForm.content,
    emailForm.contentEn,
    emailForm.templateId,
    emailForm.ctaText,
    emailForm.ctaTextEn,
    emailForm.ctaUrl,
    emailForm.footerNote,
    emailForm.footerNoteEn
  ])

  const handleSendTest = async () => {
    if (!emailForm.testEmail.trim()) {
      toast.error("Test-E-Mail-Adresse erforderlich")
      return
    }
    if (!emailForm.subject.trim() || !emailForm.content.trim()) {
      toast.error("Betreff und Inhalt erforderlich")
      return
    }

    try {
      setSendingTest(true)
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subject: emailForm.subject,
          content: emailForm.content,
          subjectEn: emailForm.subjectEn || undefined,
          contentEn: emailForm.contentEn || undefined,
          templateId: emailForm.templateId,
          ctaText: emailForm.ctaText || undefined,
          ctaTextEn: emailForm.ctaTextEn || undefined,
          ctaUrl: emailForm.ctaUrl || undefined,
          footerNote: emailForm.footerNote || undefined,
          footerNoteEn: emailForm.footerNoteEn || undefined,
          campaignType: emailForm.recipientType,
          testEmail: emailForm.testEmail
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Fehler beim Versenden")
      }

      toast.success(`Test-E-Mail an ${emailForm.testEmail} gesendet`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Test-Versand")
    } finally {
      setSendingTest(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!emailForm.subject.trim() || !emailForm.content.trim()) {
      toast.error("Betreff und Inhalt erforderlich")
      return
    }

    try {
      setSending(true)
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subject: emailForm.subject,
          content: emailForm.content,
          subjectEn: emailForm.subjectEn || undefined,
          contentEn: emailForm.contentEn || undefined,
          templateId: emailForm.templateId,
          ctaText: emailForm.ctaText || undefined,
          ctaTextEn: emailForm.ctaTextEn || undefined,
          ctaUrl: emailForm.ctaUrl || undefined,
          footerNote: emailForm.footerNote || undefined,
          footerNoteEn: emailForm.footerNoteEn || undefined,
          campaignType: emailForm.recipientType
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Fehler beim Versenden")
      }

      const data = await res.json()
      setCampaignSent(true)
      toast.success(`E-Mail an ${data.data?.recipientCount || "?"} Empfänger versendet`)
      setEmailForm({
        subject: "",
        subjectEn: "",
        content: "",
        contentEn: "",
        templateId: "standard",
        recipientType: "central_updates",
        ctaText: "",
        ctaTextEn: "",
        ctaUrl: "",
        footerNote: "",
        footerNoteEn: "",
        testEmail: ""
      })
      setTimeout(() => {
        setCampaignSent(false)
        setDialogOpen(false)
      }, 2500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Versenden")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground font-display text-3xl font-bold">E-MAIL VERWALTUNG</h1>
        <p className="text-muted-foreground mt-2">Newsletter-Abonnenten und E-Mail-Kampagnen verwalten</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Subscribers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#530A5D]" />
              Newsletter-Abonnenten
            </CardTitle>
            <CardDescription>{subscribers.length} aktive Abonnenten</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : subscribers.length > 0 ? (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {subscribers.map((sub) => (
                  <div
                    key={sub.email}
                    className="border-border flex items-center justify-between rounded border p-2 text-sm">
                    <span className="text-muted-foreground">{sub.email}</span>
                    {sub.subscribed && <Check className="h-4 w-4 text-green-500" />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center">Noch keine Abonnenten</p>
            )}
          </CardContent>
        </Card>

        {/* Email Campaign */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#530A5D]" />
              E-Mail Kampagne
            </CardTitle>
            <CardDescription>Versende E-Mails mit professionellen Vorlagen</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-violet hover:bg-violet/90 w-full gap-2">
                  <Send className="h-4 w-4" />
                  Neue Kampagne
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>E-Mail-Kampagne erstellen</DialogTitle>
                  <DialogDescription>
                    Wähle eine Vorlage, gib deinen Text ein und sende zuerst eine Test-E-Mail
                  </DialogDescription>
                </DialogHeader>

                {draftRestored ? (
                  <div className="rounded-lg border border-[#530A5D]/20 bg-[#530A5D]/5 px-3 py-2 text-sm text-[#3f0848]">
                    Ein gespeicherter Entwurf wurde automatisch geladen.
                  </div>
                ) : null}

                {campaignSent ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Check className="mb-4 h-12 w-12 text-green-500" />
                    <h3 className="mb-2 text-lg font-semibold">E-Mail versendet!</h3>
                    <p className="text-muted-foreground text-center">
                      Deine Kampagne wurde erfolgreich an alle Empfänger versendet.
                    </p>
                  </div>
                ) : (
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="compose" className="gap-2">
                        <Layout className="h-4 w-4" />
                        Verfassen
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Vorschau
                      </TabsTrigger>
                      <TabsTrigger value="send" className="gap-2">
                        <Send className="h-4 w-4" />
                        Senden
                      </TabsTrigger>
                    </TabsList>

                    {/* ── Tab: Compose ── */}
                    <TabsContent value="compose" className="mt-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <Label>Schnellstart</Label>
                          <Button type="button" variant="ghost" size="sm" onClick={resetDraft}>
                            Entwurf leeren
                          </Button>
                        </div>
                        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                          {campaignPresets.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => applyPreset(preset)}
                              className="border-border bg-card cursor-pointer rounded-md border px-3 py-3 text-left transition-colors hover:border-[#530A5D]/50 hover:bg-[#530A5D]/5">
                              <p className="text-sm font-semibold">{preset.name}</p>
                              <p className="text-muted-foreground mt-1 text-xs">{preset.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Template Selector */}
                      <div>
                        <Label>Vorlage</Label>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          {templates.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setEmailForm({ ...emailForm, templateId: t.id })}
                              className={`cursor-pointer rounded-lg border-2 p-3 text-left transition-all ${
                                emailForm.templateId === t.id
                                  ? "border-[#530A5D] bg-[#530A5D]/5"
                                  : "border-border hover:border-[#530A5D]/40"
                              }`}>
                              <p className="text-sm font-semibold">{t.name}</p>
                              <p className="text-muted-foreground mt-1 text-xs">{t.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <Label htmlFor="subject">Betreff *</Label>
                        <Input
                          id="subject"
                          value={emailForm.subject}
                          onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                          placeholder="z.B. Zentral Hack 2026 - Wichtige Updates"
                        />
                        <p className="text-muted-foreground mt-1 text-xs">
                          {emailForm.subject.length}/120 Zeichen
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="subjectEn">Subject (English, optional)</Label>
                        <Input
                          id="subjectEn"
                          value={emailForm.subjectEn}
                          onChange={(e) => setEmailForm({ ...emailForm, subjectEn: e.target.value })}
                          placeholder="e.g. Zentral Hack 2026 - Important Updates"
                        />
                      </div>

                      {/* Content */}
                      <div>
                        <Label htmlFor="content">Inhalt * (Nur Text – wird automatisch formatiert)</Label>
                        <Textarea
                          id="content"
                          value={emailForm.content}
                          onChange={(e) => setEmailForm({ ...emailForm, content: e.target.value })}
                          placeholder={
                            "Hallo Teilnehmer!\n\nWir freuen uns, euch mitzuteilen, dass...\n\nLiebe Grüsse,\nDas Zentral Hack Team"
                          }
                          rows={8}
                        />
                        <p className="text-muted-foreground mt-1 text-xs">
                          {emailForm.content.length} Zeichen
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="contentEn">Content (English, optional)</Label>
                        <Textarea
                          id="contentEn"
                          value={emailForm.contentEn}
                          onChange={(e) => setEmailForm({ ...emailForm, contentEn: e.target.value })}
                          placeholder={
                            "Hello participants!\n\nWe are excited to share that...\n\nBest regards,\nZentral Hack Team"
                          }
                          rows={6}
                        />
                        <p className="text-muted-foreground mt-1 text-xs">
                          Wenn ausgefüllt, wird die E-Mail zweisprachig (Deutsch + Englisch) versendet.
                        </p>
                      </div>

                      {/* CTA Button (optional) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="ctaText">Button-Text (optional)</Label>
                          <Input
                            id="ctaText"
                            value={emailForm.ctaText}
                            onChange={(e) => setEmailForm({ ...emailForm, ctaText: e.target.value })}
                            placeholder="z.B. Jetzt registrieren"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ctaTextEn">Button-Text (English, optional)</Label>
                          <Input
                            id="ctaTextEn"
                            value={emailForm.ctaTextEn}
                            onChange={(e) => setEmailForm({ ...emailForm, ctaTextEn: e.target.value })}
                            placeholder="e.g. Register now"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="ctaUrl">Button-Link</Label>
                          <Input
                            id="ctaUrl"
                            value={emailForm.ctaUrl}
                            onChange={(e) => setEmailForm({ ...emailForm, ctaUrl: e.target.value })}
                            placeholder="https://zentralhack.ch/anmeldung"
                          />
                        </div>
                        <div>
                          <Label htmlFor="footerNoteEn">Fussnote (English, optional)</Label>
                          <Input
                            id="footerNoteEn"
                            value={emailForm.footerNoteEn}
                            onChange={(e) => setEmailForm({ ...emailForm, footerNoteEn: e.target.value })}
                            placeholder="e.g. If you have any questions, just reply to this email."
                          />
                        </div>
                      </div>

                      {/* Footer Note (optional) */}
                      <div>
                        <Label htmlFor="footerNote">Fussnote (optional)</Label>
                        <Input
                          id="footerNote"
                          value={emailForm.footerNote}
                          onChange={(e) => setEmailForm({ ...emailForm, footerNote: e.target.value })}
                          placeholder="z.B. Bei Fragen antworte einfach auf diese E-Mail."
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => setActiveTab("preview")}
                          className="flex-1 gap-2"
                          variant="outline">
                          <Eye className="h-4 w-4" />
                          Vorschau anzeigen
                        </Button>
                        <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="gap-2"
                              disabled={!emailForm.subject || !emailForm.content}>
                              <Save className="h-4 w-4" />
                              Als Vorlage speichern
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Vorlage speichern</DialogTitle>
                              <DialogDescription>
                                Speichere diese E-Mail als wiederverwendbare Vorlage
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="tpl-name">Vorlagenname *</Label>
                                <Input
                                  id="tpl-name"
                                  value={templateName}
                                  onChange={(e) => setTemplateName(e.target.value)}
                                  placeholder="z.B. Willkommens-E-Mail"
                                />
                              </div>
                              <div>
                                <Label htmlFor="tpl-desc">Beschreibung (optional)</Label>
                                <Input
                                  id="tpl-desc"
                                  value={templateDescription}
                                  onChange={(e) => setTemplateDescription(e.target.value)}
                                  placeholder="z.B. Wird an neue Teilnehmer gesendet"
                                />
                              </div>
                              <Button
                                onClick={handleSaveTemplate}
                                disabled={savingTemplate || !templateName.trim()}
                                className="w-full gap-2">
                                {savingTemplate ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                                Speichern
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TabsContent>

                    {/* ── Tab: Preview ── */}
                    <TabsContent value="preview" className="mt-4">
                      <div className="space-y-4">
                        <div className="bg-muted text-muted-foreground flex items-center gap-2 rounded-lg p-2 text-sm">
                          <Layout className="h-4 w-4" />
                          Vorlage: <strong>{selectedTemplate?.name}</strong>
                        </div>

                        <div className="min-h-[300px] rounded-lg border bg-[#f4f4f7] p-3">
                          <iframe
                            title="E-Mail Vorschau"
                            srcDoc={previewHtml}
                            className="border-border h-[560px] w-full rounded-md border bg-white"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => setActiveTab("compose")}
                            variant="outline"
                            className="flex-1">
                            Zurück zum Bearbeiten
                          </Button>
                          <Button
                            onClick={() => setActiveTab("send")}
                            className="bg-violet hover:bg-violet/90 flex-1 gap-2">
                            <Send className="h-4 w-4" />
                            Weiter zum Senden
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* ── Tab: Send ── */}
                    <TabsContent value="send" className="mt-4 space-y-6">
                      <div className="border-border bg-muted/40 space-y-1 rounded-lg border p-3 text-sm">
                        <p className="font-medium">Versand-Checkliste</p>
                        <p className={emailForm.subject ? "text-green-700" : "text-muted-foreground"}>
                          {emailForm.subject ? "Erledigt" : "Offen"}: Betreff gesetzt
                        </p>
                        <p className={emailForm.content ? "text-green-700" : "text-muted-foreground"}>
                          {emailForm.content ? "Erledigt" : "Offen"}: Inhalt gepflegt
                        </p>
                        <p className={emailForm.testEmail ? "text-green-700" : "text-muted-foreground"}>
                          {emailForm.testEmail ? "Erledigt" : "Optional"}: Testadresse eingetragen
                        </p>
                      </div>

                      {/* Test Email Section */}
                      <Card className="border-dashed">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <FlaskConical className="h-4 w-4 text-blue-500" />
                            Test-E-Mail senden
                          </CardTitle>
                          <CardDescription>
                            Sende eine Vorschau an dich selbst, bevor du die Kampagne startest
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2">
                            <Input
                              value={emailForm.testEmail}
                              onChange={(e) => setEmailForm({ ...emailForm, testEmail: e.target.value })}
                              placeholder="deine@email.ch"
                              type="email"
                              className="flex-1"
                            />
                            <Button
                              onClick={handleSendTest}
                              disabled={sendingTest}
                              variant="outline"
                              className="gap-2">
                              {sendingTest ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FlaskConical className="h-4 w-4" />
                              )}
                              Testen
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recipient Selection */}
                      <div>
                        <Label>Empfänger</Label>
                        <Select
                          value={emailForm.recipientType}
                          onValueChange={(val) => setEmailForm({ ...emailForm, recipientType: val })}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="central_updates">
                              Alle registrierten Teilnehmer + Newsletter
                            </SelectItem>
                            <SelectItem value="newsletter_subscribers">
                              Nur Weekly-Update Empfänger
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Send Button */}
                      <Button
                        onClick={handleSendCampaign}
                        disabled={sending || !emailForm.subject || !emailForm.content}
                        className="bg-violet hover:bg-violet/90 h-12 w-full gap-2 text-base">
                        {sending ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Wird versendet...
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5" />
                            Kampagne jetzt versenden
                          </>
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>
                )}
              </DialogContent>
            </Dialog>

            <div className="mt-4 rounded-lg border border-[#d8c9ee] bg-[#f3f1f8] p-4">
              <p className="text-sm text-blue-900">
                <strong>Neu:</strong> Schnellstart-Presets, automatische Entwurfs-Speicherung und echte
                Live-Vorschau direkt im finalen Template.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saved Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#530A5D]" />
            Gespeicherte Vorlagen
          </CardTitle>
          <CardDescription>
            Klicke auf eine Vorlage, um sie für eine neue Kampagne zu verwenden
          </CardDescription>
        </CardHeader>
        <CardContent>
          {savedTemplates.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Noch keine gespeicherten Vorlagen. Erstelle eine Kampagne und speichere sie als Vorlage.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="group cursor-pointer rounded-lg border p-4 transition-all hover:border-[#530A5D]/40"
                  onClick={() => loadSavedTemplate(tpl)}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold">{tpl.name}</h4>
                      {tpl.description && (
                        <p className="text-muted-foreground mt-1 truncate text-xs">{tpl.description}</p>
                      )}
                      <p className="text-muted-foreground mt-2 text-xs">Betreff: {tpl.subject}</p>
                      <p className="text-muted-foreground text-xs">
                        Layout:{" "}
                        {templates.find((t) => t.id === tpl.base_template_id)?.name || tpl.base_template_id}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTemplateId(tpl.id)
                      }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-muted-foreground mt-3 border-t pt-2 text-xs">
                    Aktualisiert: {new Date(tpl.updated_at).toLocaleDateString("de-DE")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTemplateId}
        onOpenChange={(open) => !open && setDeleteTemplateId(null)}
        title="Vorlage löschen?"
        description="Möchtest du diese E-Mail-Vorlage wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        onConfirm={confirmDeleteTemplate}
        loading={deletingTemplate}
      />
    </div>
  )
}
