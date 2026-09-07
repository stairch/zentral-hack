"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Loader2,
  Plus,
  Send,
  Trash2,
  Ban,
  ExternalLink,
  MoreVertical,
  Pencil,
  HelpCircle
} from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { NewsletterCampaignStatus } from "@/lib/resend"

const ALL_CONTACTS = "__all__"
const RESEND_TEMPLATE_BASE = "https://resend.com/templates"
const RESEND_BROADCAST_BASE = "https://resend.com/broadcasts"

// Rendert Kurzanleitungs-Texte und ersetzt <code>…</code>-Abschnitte durch
// echte <code>-Elemente, damit technische Teile im Text hervorgehoben werden.
const GUIDE_CODE_SPLIT = /(<code>.*?<\/code>)/g

function renderGuideItem(item: string) {
  return item.split(GUIDE_CODE_SPLIT).map((part, i) => {
    const match = part.match(/^<code>(.*)<\/code>$/)
    return match ? (
      <code key={i} className="bg-muted rounded px-1 py-0.5 text-xs">
        {match[1]}
      </code>
    ) : (
      part
    )
  })
}

interface Campaign {
  id: string
  name: string
  status: NewsletterCampaignStatus
  segmentId: string | null
  createdAt: string
  scheduledAt: string | null
  sentAt: string | null
  lastModifiedAt: string
}

interface CampaignDetail extends Campaign {
  subject: string | null
  previewText: string | null
  from: string | null
  templateId: string | null
}

interface Segment {
  id: string
  name: string
}

interface TemplateSummary {
  id: string
  name: string
  alias: string | null
  updatedAt: string
}

interface TemplateVariable {
  key: string
  type: "string" | "number"
  fallbackValue: string | null
  editable: boolean
}

const copy = {
  de: {
    heading: "NEWSLETTER",
    subtitle: "Newsletter-Kampagnen über Resend Broadcasts verwalten",
    newCampaign: "Neue Kampagne",
    empty: "Noch keine Kampagnen vorhanden.",
    colName: "Name",
    colStatus: "Status",
    colUpdated: "Zuletzt aktualisiert",
    colMore: "Mehr Details",
    statusDraft: "Entwurf",
    statusScheduled: "Geplant",
    statusSent: "Gesendet",
    statusQueued: "In Warteschlange",
    statusCanceled: "Abgebrochen",
    actions: "Aktionen",
    send: "Senden",
    edit: "Bearbeiten",
    cancelSend: "Versand abbrechen",
    delete: "Löschen",
    cancel: "Abbrechen",
    close: "Schliessen",
    save: "Speichern",
    loadError: "Kampagnen konnten nicht geladen werden",
    // create / edit
    createTitle: "Neue Kampagne",
    editTitle: "Kampagne bearbeiten",
    fieldName: "Name (intern)",
    fieldSubject: "Betreff",
    fieldPreview: "Vorschautext (optional)",
    createSuccess: "Kampagne erstellt",
    updateSuccess: "Kampagne aktualisiert",
    saveError: "Speichern fehlgeschlagen",
    required: "Name und Betreff sind erforderlich",
    // delete
    deleteTitle: "Kampagne löschen?",
    deleteDesc: "Diese Aktion kann nicht rückgängig gemacht werden.",
    deleteSuccess: "Kampagne gelöscht",
    deleteError: "Löschen fehlgeschlagen",
    // cancel
    cancelTitle: "Versand abbrechen?",
    cancelDesc: "Die geplante Kampagne wird nicht versendet.",
    cancelSuccess: "Versand abgebrochen",
    cancelError: "Abbrechen fehlgeschlagen",
    // send dialog
    sendTitle: "Kampagne senden",
    sendDesc: "Wähle ein Template und eine Zielgruppe für das Versenden des Newsletters.",
    template: "Template",
    templatePlaceholder: "Template auswählen",
    noTemplates: "Keine veröffentlichten Templates in Resend gefunden.",
    templateLoadError: "Template-Variablen konnten nicht geladen werden",
    variables: "Variablen",
    variablesHint: "Nur Variablen mit dem Präfix „admin_“ sind bearbeitbar.",
    noEditableVars: "Dieses Template hat keine bearbeitbaren Variablen.",
    audience: "Zielgruppe",
    audienceAll: "Alle Kontakte",
    audienceSegment: "Bestimmtes Segment",
    segmentPlaceholder: "Segment auswählen",
    noSegments: "Keine Segmente in Resend gefunden.",
    scheduling: "Zeitpunkt",
    sendNow: "Sofort senden",
    scheduleLater: "Später planen",
    scheduleAt: "Sendezeitpunkt",
    confirmSend: "Jetzt senden",
    confirmSchedule: "Planen",
    sendSuccess: "Kampagne gesendet",
    scheduleSuccess: "Kampagne geplant",
    sendError: "Senden fehlgeschlagen",
    pickTemplate: "Bitte ein Template auswählen",
    pickSegment: "Bitte ein Segment auswählen",
    pickTime: "Bitte einen Sendezeitpunkt wählen",
    openInResend: "Template ansehen",
    resendLinkText: "Link zu Resend",
    guideTrigger: "Kurzanleitung",
    guide: [
      {
        title: "Überblick",
        items: [
          "Diese Seite ist nur die Steuerung der Kampagnen. Inhalte, Empfänger, Templates und Statistiken leben in Resend (siehe Navigation links: Templates, Kontakte, bzw. 'Link zu Resend' in der Tabelle).",
          "Alles was man auf dieser Seite machen kann, kann man auch direkt im Resend Dashboard tun. Diese Seite ermöglicht es sich auf das Wichtigste zu konzentrieren."
        ]
      },
      {
        title: "Status einer Kampagne",
        items: [
          "Entwurf: Kampagne erstellt, aber noch nicht versendet. Senden, Bearbeiten und Löschen möglich.",
          "Geplant und In Warteschlange: Versand ist auf einen bestimmten Zeitpunkt geplant oder läuft gerade an. Versand abbrechen möglich (bei Geplant zusätzlich löschbar).",
          "Gesendet: Kampagne abgeschlossen und unveränderlich.",
          "Abgebrochen: Ein geplanter Versand wurde gestoppt."
        ]
      },
      {
        title: "Kampagne erstellen & bearbeiten",
        items: [
          "'Neue Kampagne' legt einen Entwurf an mit Name (intern), Betreff und optionalem Vorschautext.",
          "Das E-Mail-Layout selbst wird nicht hier bearbeitet, sondern kommt beim Senden aus einem Template. Die Templates können über Resend verwaltet werden."
        ]
      },
      {
        title: "Templates",
        items: [
          "Templates werden vollständig in Resend erstellt und gepflegt (siehe Navigation links: 'Templates').",
          "Im Sende-Dialog wird in der Auswahl nur veröffentlichte Templates angezeigt.",
          "Ein Template ist ein HTML-Layout mit Platzhaltern in der Form <code>{{{variablenname}}}</code>, optional mit Standardwert: <code>{{{variablenname|Standardwert}}}</code>.",
          "Beim Auswählen eines Templates werden dessen Variablen geladen und können daraufhin ausgefüllt werden.",
        ]
      },
      {
        title: "Variablen in Templates",
        items: [
          "Jede Template-Variable hat einen Namen (key), einen Typ (Text oder Zahl) und einen Fallback-Wert (in Resend definiert).",
          "Nur Variablen, deren Name mit <code>admin_</code> beginnt, sind hier bearbeitbar (z. B. <code>admin_titel</code>, <code>admin_intro_text</code>). Sie erscheinen als Eingabefelder, vorbelegt mit dem Fallback-Wert (falls vorhanden).",
          "Alle anderen Variablen (ohne <code>admin_</code>-Präfix) gelten als technisch und werden automatisch befüllt",
          "Eingebaute Resend-Tags wie <code>{{{RESEND_UNSUBSCRIBE_URL}}}</code> (Abmeldelink) oder <code>{{{contact.first_name}}}</code> (Kontaktfelder) sind keine Template-Variablen: sie werden von Resend automatisch eingesetzt.",
        ]
      },
      {
        title: "Gut zu wissen",
        items: [
          "Jeder Broadcast gilt für sich und gilt nach dem Senden/Abbrechen als abgeschlossen.",
          "Broadcasts, die direkt im Resend-E-Mail-Editor erstellt oder geöffnet wurden, können hier nicht gesendet werden.",
          "Öffnungen, Klicks und weitere Statistiken gibt es im Resend-Dashboard über den 'Link zu Resend' in der Tabelle."
        ]
      }
    ]
  },
  en: {
    heading: "NEWSLETTER",
    subtitle: "Manage newsletter campaigns via Resend Broadcasts",
    newCampaign: "New campaign",
    empty: "No campaigns yet.",
    colName: "Name",
    colStatus: "Status",
    colUpdated: "Last updated",
    colMore: "More details",
    statusDraft: "Draft",
    statusScheduled: "Scheduled",
    statusSent: "Sent",
    statusQueued: "Queued",
    statusCanceled: "Canceled",
    actions: "Actions",
    send: "Send",
    edit: "Edit",
    cancelSend: "Cancel send",
    delete: "Delete",
    cancel: "Cancel",
    close: "Close",
    save: "Save",
    loadError: "Failed to load campaigns",
    createTitle: "New campaign",
    editTitle: "Edit campaign",
    fieldName: "Name (internal)",
    fieldSubject: "Subject",
    fieldPreview: "Preview text (optional)",
    createSuccess: "Campaign created",
    updateSuccess: "Campaign updated",
    saveError: "Failed to save",
    required: "Name and subject are required",
    deleteTitle: "Delete campaign?",
    deleteDesc: "This action cannot be undone.",
    deleteSuccess: "Campaign deleted",
    deleteError: "Failed to delete",
    cancelTitle: "Cancel send?",
    cancelDesc: "The scheduled campaign will not be sent.",
    cancelSuccess: "Send canceled",
    cancelError: "Failed to cancel",
    sendTitle: "Send campaign",
    sendDesc: "Select a template and a target audience for sending the newsletter.",
    template: "Template",
    templatePlaceholder: "Select a template",
    noTemplates: "No published templates found in Resend.",
    templateLoadError: "Failed to load template variables",
    variables: "Variables",
    variablesHint: "Only variables prefixed with “admin_” are editable.",
    noEditableVars: "This template has no editable variables.",
    audience: "Audience",
    audienceAll: "All contacts",
    audienceSegment: "Specific segment",
    segmentPlaceholder: "Select a segment",
    noSegments: "No segments found in Resend.",
    scheduling: "Timing",
    sendNow: "Send now",
    scheduleLater: "Schedule for later",
    scheduleAt: "Send time",
    confirmSend: "Send now",
    confirmSchedule: "Schedule",
    sendSuccess: "Campaign sent",
    scheduleSuccess: "Campaign scheduled",
    sendError: "Failed to send",
    pickTemplate: "Please select a template",
    pickSegment: "Please select a segment",
    pickTime: "Please choose a send time",
    openInResend: "View template",
    resendLinkText: "Link to Resend",
    guideTrigger: "Quick guide",
    guide: [
      {
        title: "Overview",
        items: [
          "This page only controls campaigns. Content, recipients, templates, and statistics live in Resend (see navigation on the left: Templates, Contacts, or 'Link to Resend' in the table).",
          "Everything you can do on this page can also be done directly in the Resend dashboard. This page lets you focus on the essentials."
        ]
      },
      {
        title: "Campaign status",
        items: [
          "Draft: Campaign created but not yet sent. Can be sent, edited, or deleted.",
          "Scheduled and Queued: Sending is scheduled for a specific time or is currently starting. Sending can be canceled (Scheduled campaigns can also be deleted).",
          "Sent: Campaign completed and unchangeable.",
          "Canceled: A scheduled send was stopped."
        ]
      },
      {
        title: "Creating & editing a campaign",
        items: [
          "'New campaign' creates a draft with a name (internal), subject, and optional preview text.",
          "The email layout itself isn't edited here — it comes from a template when sending. Templates can be managed via Resend."
        ]
      },
      {
        title: "Templates",
        items: [
          "Templates are created and maintained entirely in Resend (see navigation on the left: 'Templates').",
          "In the send dialog, only published templates are shown in the selection.",
          "A template is an HTML layout with placeholders in the form <code>{{{variableName}}}</code>, optionally with a default value: <code>{{{variableName|defaultValue}}}</code>.",
          "When a template is selected, its variables are loaded and can then be filled in.",
        ]
      },
      {
        title: "Variables in templates",
        items: [
          "Each template variable has a name (key), a type (text or number), and a fallback value (defined in Resend).",
          "Only variables whose name starts with <code>admin_</code> are editable here (e.g. <code>admin_title</code>, <code>admin_intro_text</code>). They appear as input fields, pre-filled with the fallback value (if one exists).",
          "All other variables (without the <code>admin_</code> prefix) are considered technical and are filled in automatically",
          "Built-in Resend tags such as <code>{{{RESEND_UNSUBSCRIBE_URL}}}</code> (unsubscribe link) or <code>{{{contact.first_name}}}</code> (contact fields) are not template variables: they're inserted automatically by Resend.",
        ]
      },
      {
        title: "Good to know",
        items: [
          "Each broadcast stands on its own and is considered complete once sent/canceled.",
          "Broadcasts created or opened directly in the Resend email editor can't be sent from here.",
          "Opens, clicks, and other statistics are available in the Resend dashboard via the 'Link to Resend' in the table."
        ]
      }
    ]
  }
} as const

type ApiResponse<T> = { success: boolean; data?: T; error?: string }

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init })
  const json = (await res.json()) as ApiResponse<T>
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Request failed (${res.status})`)
  }
  return json.data as T
}

export function NewsletterPage() {
  const { language } = useLanguage()
  const text = copy[language]

  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [templates, setTemplates] = useState<TemplateSummary[]>([])
  const hasFetched = useRef(false)

  // create / edit dialog
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [form, setForm] = useState({ name: "", subject: "", previewText: "" })
  const [saving, setSaving] = useState(false)

  // delete / cancel
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [mutating, setMutating] = useState(false)

  // send dialog
  const [sendCampaign, setSendCampaign] = useState<Campaign | null>(null)
  const [templateId, setTemplateId] = useState("")
  const [templateVars, setTemplateVars] = useState<TemplateVariable[]>([])
  const [varsLoading, setVarsLoading] = useState(false)
  const [adminValues, setAdminValues] = useState<Record<string, string>>({})
  const [targetMode, setTargetMode] = useState<"all" | "segment">("all")
  const [segmentId, setSegmentId] = useState("")
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now")
  const [scheduledAt, setScheduledAt] = useState("")
  const [sending, setSending] = useState(false)

  const loadOverview = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ campaigns: Campaign[]; segments: Segment[]; templates: TemplateSummary[] }>(
        "/api/admin/newsletter"
      )
      setCampaigns(data.campaigns)
      setSegments(data.segments)
      setTemplates(data.templates)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.loadError)
    } finally {
      setLoading(false)
    }
  }, [text.loadError])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    loadOverview()
  }, [loadOverview])

  /* ----------------------------- create / edit ---------------------------- */

  const openCreate = () => {
    setEditing(null)
    setForm({ name: "", subject: "", previewText: "" })
    setFormOpen(true)
  }

  const openEdit = async (campaign: Campaign) => {
    setEditing(campaign)
    setForm({ name: campaign.name, subject: "", previewText: "" })
    setFormOpen(true)
    try {
      const data = await api<{ campaign: CampaignDetail }>(
        `/api/admin/newsletter?id=${encodeURIComponent(campaign.id)}`
      )
      setForm({
        name: data.campaign.name,
        subject: data.campaign.subject ?? "",
        previewText: data.campaign.previewText ?? ""
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.loadError)
    }
  }

  const submitForm = async () => {
    if (!form.name.trim() || !form.subject.trim()) {
      toast.error(text.required)
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api(`/api/admin/newsletter`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...form })
        })
        toast.success(text.updateSuccess)
      } else {
        await api(`/api/admin/newsletter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        })
        toast.success(text.createSuccess)
      }
      setFormOpen(false)
      await loadOverview()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.saveError)
    } finally {
      setSaving(false)
    }
  }

  /* ------------------------------ delete / cancel ------------------------- */

  const confirmDelete = async () => {
    if (!deleteId) return
    setMutating(true)
    try {
      await api(`/api/admin/newsletter?id=${encodeURIComponent(deleteId)}`, { method: "DELETE" })
      toast.success(text.deleteSuccess)
      setDeleteId(null)
      await loadOverview()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.deleteError)
    } finally {
      setMutating(false)
    }
  }

  const confirmCancel = async () => {
    if (!cancelId) return
    setMutating(true)
    try {
      await api(`/api/admin/newsletter/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cancelId })
      })
      toast.success(text.cancelSuccess)
      setCancelId(null)
      await loadOverview()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.cancelError)
    } finally {
      setMutating(false)
    }
  }

  /* -------------------------------- send --------------------------------- */

  const openSend = (campaign: Campaign) => {
    setSendCampaign(campaign)
    setTemplateId("")
    setTemplateVars([])
    setAdminValues({})
    setTargetMode("all")
    setSegmentId("")
    setScheduleMode("now")
    setScheduledAt("")
  }

  const onPickTemplate = async (id: string) => {
    setTemplateId(id)
    setTemplateVars([])
    setAdminValues({})
    if (!id) return
    setVarsLoading(true)
    try {
      const data = await api<{ template: { variables: TemplateVariable[] } }>(
        `/api/admin/newsletter/template?id=${encodeURIComponent(id)}`
      )
      setTemplateVars(data.template.variables)
      const initial: Record<string, string> = {}
      for (const v of data.template.variables) {
        if (v.editable) initial[v.key] = v.fallbackValue ?? ""
      }
      setAdminValues(initial)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.templateLoadError)
      setTemplateId("")
    } finally {
      setVarsLoading(false)
    }
  }

  const submitSend = async () => {
    if (!sendCampaign) return
    if (!templateId) return toast.error(text.pickTemplate)
    if (targetMode === "segment" && !segmentId) return toast.error(text.pickSegment)
    if (scheduleMode === "later" && !scheduledAt) return toast.error(text.pickTime)

    setSending(true)
    try {
      await api(`/api/admin/newsletter/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sendCampaign.id,
          name: sendCampaign.name,
          templateId,
          segmentId: targetMode === "all" ? ALL_CONTACTS : segmentId,
          adminValues,
          scheduledAt: scheduleMode === "later" ? new Date(scheduledAt).toISOString() : undefined
        })
      })
      toast.success(scheduleMode === "later" ? text.scheduleSuccess : text.sendSuccess)
      setSendCampaign(null)
      await loadOverview()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.sendError)
    } finally {
      setSending(false)
    }
  }

  /* ------------------------------- helpers ------------------------------- */

  const statusLabel: Record<NewsletterCampaignStatus, string> = {
    draft: text.statusDraft,
    scheduled: text.statusScheduled,
    sent: text.statusSent,
    queued: text.statusQueued,
    canceled: text.statusCanceled
  }
  const statusColors: Record<NewsletterCampaignStatus, string> = {
    draft: "bg-gray-200 text-gray-800",
    scheduled: "bg-purple-200 text-purple-800",
    sent: "bg-green-200 text-green-800",
    queued: "bg-blue-200 text-blue-800",
    canceled: "bg-red-200 text-red-800"
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(language === "de" ? "de-CH" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short"
    })

  const editableVars = templateVars.filter((v) => v.editable)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">{text.heading}</h1>
          <p className="text-muted-foreground mt-2">{text.subtitle}</p>
        </div>
        <Button onClick={openCreate} className="w-full shrink-0 sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {text.newCampaign}
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label={text.guideTrigger}>
                <HelpCircle className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>{text.guideTrigger}</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 overflow-y-auto px-4 pb-8">
                {text.guide.map((section) => (
                  <div key={section.title} className="space-y-1.5">
                    <p className="text-foreground font-medium">{section.title}</p>
                    <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                      {section.items.map((item) => (
                        <li key={item}>{renderGuideItem(item)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              </div>
            ) : campaigns.length === 0 ? (
              <p className="text-muted-foreground px-6 py-16 text-center text-sm">{text.empty}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{text.colName}</TableHead>
                    <TableHead>{text.colStatus}</TableHead>
                    <TableHead>{text.colUpdated}</TableHead>
                    <TableHead>{text.colMore}</TableHead>
                    <TableHead className="w-10 text-right">
                      <span className="sr-only">{text.actions}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[campaign.status]}>
                          {statusLabel[campaign.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(campaign.lastModifiedAt)}
                      </TableCell>
                      <TableCell>
                        {campaign.status === "draft" ? (
                          <span>—</span>
                        ) : (
                          <Link
                            href={`${RESEND_BROADCAST_BASE}/${campaign.id}`}
                            target="_blank"
                            className="flex w-fit items-center gap-x-2 text-blue-600">
                            {text.resendLinkText}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </TableCell>
                      <TableCell className="flex items-center gap-2 text-right">
                        {campaign.status === "draft" && (
                          <Button size="sm" className="text-sm" onClick={() => openSend(campaign)}>
                            <Send className="h-4 w-4" />
                            {text.send}
                          </Button>
                        )}
                        {(campaign.status === "draft" ||
                          campaign.status === "queued" ||
                          campaign.status === "scheduled") && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">{text.actions}</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {campaign.status === "draft" && (
                                  <>
                                    <DropdownMenuItem onClick={() => openEdit(campaign)}>
                                      <Pencil className="h-4 w-4" />
                                      {text.edit}
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(campaign.status === "queued" || campaign.status === "scheduled") && (
                                  <DropdownMenuItem onClick={() => setCancelId(campaign.id)}>
                                    <Ban className="h-4 w-4" />
                                    {text.cancelSend}
                                  </DropdownMenuItem>
                                )}
                                {(campaign.status === "draft" || campaign.status === "scheduled") && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() => setDeleteId(campaign.id)}>
                                      <Trash2 className="h-4 w-4" />
                                      {text.delete}
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? text.editTitle : text.createTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nl-name">{text.fieldName}</Label>
              <Input
                id="nl-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nl-subject">{text.fieldSubject}</Label>
              <Input
                id="nl-subject"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nl-preview">{text.fieldPreview}</Label>
              <Textarea
                id="nl-preview"
                rows={2}
                value={form.previewText}
                onChange={(e) => setForm((f) => ({ ...f, previewText: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
              {text.cancel}
            </Button>
            <Button onClick={submitForm} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {text.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send dialog */}
      <Dialog open={sendCampaign !== null} onOpenChange={(open) => !open && setSendCampaign(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {text.sendTitle}
              {sendCampaign ? ` — ${sendCampaign.name}` : ""}
            </DialogTitle>
            <DialogDescription>{text.sendDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template */}
            <div className="space-y-2">
              <Label>{text.template}</Label>
              {templates.length === 0 ? (
                <p className="text-muted-foreground text-sm">{text.noTemplates}</p>
              ) : (
                <Select value={templateId} onValueChange={onPickTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder={text.templatePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                        <code className="text-[10px]">{t.alias}</code>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {templateId && (
                <a
                  href={`${RESEND_TEMPLATE_BASE}/${templateId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground inline-flex items-center gap-1 text-xs text-blue-600">
                  <ExternalLink className="h-3 w-3" />
                  {text.openInResend}
                </a>
              )}
            </div>

            {/* Variables */}
            {templateId && (
              <div className="space-y-3">
                <div>
                  <Label>{text.variables}</Label>
                  <p className="text-muted-foreground mt-1 text-xs">{text.variablesHint}</p>
                </div>
                {varsLoading ? (
                  <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                ) : editableVars.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{text.noEditableVars}</p>
                ) : (
                  editableVars.map((v) => (
                    <div key={v.key} className="space-y-1.5">
                      <Label htmlFor={`var-${v.key}`} className="font-mono text-xs">
                        {v.key}
                      </Label>
                      <Input
                        id={`var-${v.key}`}
                        type={v.type === "number" ? "number" : "text"}
                        placeholder={v.fallbackValue ?? ""}
                        value={adminValues[v.key] ?? ""}
                        onChange={(e) => setAdminValues((prev) => ({ ...prev, [v.key]: e.target.value }))}
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Audience */}
            <div className="space-y-2">
              <Label>{text.audience}</Label>
              <div className="flex flex-col gap-2">
                <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="nl-target"
                    className="cursor-pointer"
                    checked={targetMode === "all"}
                    onChange={() => setTargetMode("all")}
                  />
                  {text.audienceAll}
                </label>
                <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="nl-target"
                    className="cursor-pointer"
                    checked={targetMode === "segment"}
                    onChange={() => setTargetMode("segment")}
                    disabled={segments.length === 0}
                  />
                  {text.audienceSegment}
                </label>
              </div>
              {targetMode === "segment" &&
                (segments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{text.noSegments}</p>
                ) : (
                  <Select value={segmentId} onValueChange={setSegmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder={text.segmentPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {segments.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ))}
            </div>

            {/* Scheduling */}
            <div className="space-y-2">
              <Label>{text.scheduling}</Label>
              <div className="flex flex-col gap-2">
                <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="nl-schedule"
                    className="cursor-pointer"
                    checked={scheduleMode === "now"}
                    onChange={() => setScheduleMode("now")}
                  />
                  {text.sendNow}
                </label>
                <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="nl-schedule"
                    className="cursor-pointer"
                    checked={scheduleMode === "later"}
                    onChange={() => setScheduleMode("later")}
                  />
                  {text.scheduleLater}
                </label>
              </div>
              {scheduleMode === "later" && (
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendCampaign(null)} disabled={sending}>
              {text.cancel}
            </Button>
            <Button onClick={submitSend} disabled={sending || !templateId}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {scheduleMode === "later" ? text.confirmSchedule : text.confirmSend}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={text.deleteTitle}
        description={text.deleteDesc}
        confirmLabel={text.delete}
        cancelLabel={text.cancel}
        loading={mutating}
        onConfirm={confirmDelete}
      />
      <ConfirmDialog
        open={cancelId !== null}
        onOpenChange={(open) => !open && setCancelId(null)}
        title={text.cancelTitle}
        description={text.cancelDesc}
        confirmLabel={text.cancel}
        cancelLabel={text.close}
        loading={mutating}
        onConfirm={confirmCancel}
      />
    </div>
  )
}
