"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Loader2,
  Trash2,
  Eye,
  FileCheck,
  FileX,
  Globe,
  GlobeOff,
  PenLine,
  Plus,
  AlarmClock,
  MoreHorizontal,
  SquarePen,
  SquarePlus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { SponsorChallengeEditor } from "@/components/dashboard/sponsor-challenge-editor"

interface Challenge {
  id: string
  user_id: string
  status: "draft" | "published"
  company_name: string | null
  challenge_title: string | null
  challenge_title_en: string | null
  short_description: string | null
  short_description_en: string | null
  difficulty: string | null
  team_size: string | null
  challenge_language: string | null
  contact_email: string | null
  challenge_data: Record<string, unknown> | null
  prize: string | null
  sponsor_id: string | null
  submission_enabled: boolean
  submission_description_required: boolean
  info_published: boolean
  submission_deadline: string | null
  sponsor_company_name: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  category_name: string
  category_id: string
  category_slug: string
  user_email: string
  first_name: string | null
  last_name: string | null
}

interface CategoryInfo {
  id: string
  name: string
  slug: string
}

const copy = {
  de: {
    heading: "Challenges",
    summary: (total: number, published: number) =>
      total > 0 && published === total
        ? `${total} Challenges · alle veröffentlicht`
        : `${total} Challenges · ${published} veröffentlicht`,
    filterAll: "Alle",
    filterLive: "Live",
    filterDraft: "Entwurf",
    colChallenge: "Challenge",
    colStatus: "Status",
    colDeadline: "Abgabe",
    colPrize: "Preisgeld",
    statusPublic: "Öffentlich",
    statusSubmission: "Submission",
    statusInfo: "Infos",
    tipPublicOn: "Challenge ist öffentlich",
    tipPublicOff: "Challenge ist ein Entwurf (nicht öffentlich)",
    tipSubmissionOn: "Submission für Teilnehmende geöffnet",
    tipSubmissionOff: "Submission für Teilnehmende geschlossen",
    tipSubmissionOnDescription: "Submission geöffnet, Beschreibung erforderlich",
    tipInfoOn: "Infos für Teilnehmende veröffentlicht",
    tipInfoOff: "Infos für Teilnehmende verborgen",
    noDeadline: "Keine Frist",
    today: "Heute",
    preview: "Vorschau",
    moreActions: "Weitere Aktionen",
    setDeadline: "Abgabefrist festlegen",
    changeDeadline: "Abgabefrist ändern",
    openSubmissionMenu: "Submission öffnen…",
    editSubmissionMenu: "Submission bearbeiten…",
    openSubmissionTitle: "Submission öffnen",
    editSubmissionTitle: "Submission bearbeiten",
    submissionDialogHint:
      "Angemeldete Teilnehmende dieser Kategorie sehen in ihrem Dashboard eine Auswahl und können sich für diese Challenge einschreiben.",
    descriptionRequiredLabel: "Beschreibung erforderlich",
    descriptionRequiredHint:
      "Teilnehmende müssen zusätzlich zur Auswahl eine kurze Beschreibung ihres Vorhabens einreichen.",
    openSubmission: "Submission öffnen",
    closeSubmission: "Submission schliessen",
    submissionOpened: "Submission für Teilnehmende geöffnet",
    submissionClosed: "Submission für Teilnehmende geschlossen",
    submissionSaved: "Submission-Einstellungen gespeichert",
    deleteMenu: "Löschen…",
    published: "Veröffentlicht",
    draft: "Entwurf",
    publishInfo: "Infos veröffentlichen",
    unpublishInfo: "Infos verbergen",
    publishInfoSuccess: "Challenge-Infos für Teilnehmer veröffentlicht",
    unpublishInfoSuccess: "Challenge-Infos für Teilnehmer verborgen",
    labelInfoPublished: "Infos für Teilnehmer",
    infoNotPublished: "Nicht veröffentlicht",
    deadlineDialogTitle: "Abgabedeadline",
    deadlineDialogHint:
      "Teilnehmer, deren Bewerbung für diese Challenge angenommen wurde, sehen bis zur Deadline einen Countdown-Banner in ihrem Dashboard.",
    deadlineLabel: "Datum und Uhrzeit",
    deadlineRemove: "Deadline entfernen",
    deadlineSave: "Speichern",
    deadlineSaved: "Abgabedeadline gespeichert",
    deadlineRemoved: "Abgabedeadline entfernt",
    labelDeadline: "Abgabedeadline",
    allCategories: "Alle Kategorien",
    noTitle: "(Kein Titel)",
    noResults: "Keine Challenges gefunden.",
    unpublish: "Zurückziehen",
    publish: "Veröffentlichen",
    close: "Schliessen",
    detailsDialogDefaultTitle: "Challenge Details",
    labelCompany: "Firma",
    labelCategory: "Kategorie",
    labelContact: "Kontakt",
    labelUser: "Nutzer",
    labelDifficulty: "Schwierigkeit",
    labelTeamSize: "Teamgrösse",
    labelLanguage: "Sprache",
    labelPrize: "Preisgeld",
    labelSponsor: "Sponsor",
    labelStatus: "Status",
    labelSubmitted: "Eingereicht",
    labelDescription: "Kurzbeschreibung (DE)",
    labelDescriptionEn: "Kurzbeschreibung (EN)",
    labelFullData: "Vollständige Challenge-Daten",
    deleteTitle: "Challenge löschen?",
    deleteWarning: "Diese Aktion kann nicht rückgängig gemacht werden.",
    cancel: "Abbrechen",
    deleteBtn: "Löschen",
    loadError: "Fehler beim Laden der Challenges",
    publishSuccess: "Veröffentlicht",
    unpublishSuccess: "Auf Entwurf gesetzt",
    toggleError: "Fehler beim Aktualisieren",
    deleted: "Gelöscht",
    deleteError: "Fehler beim Löschen",
    newChallenge: "Neue Challenge",
    editChallenge: "Challenge bearbeiten",
    challengeEditor: "Challenge-Editor",
    selectCategory: "Kategorie wählen",
    selectCategoryHint: "Für welche Kategorie soll die Challenge erstellt werden?"
  },
  en: {
    heading: "Challenges",
    summary: (total: number, published: number) =>
      total > 0 && published === total
        ? `${total} challenges · all published`
        : `${total} challenges · ${published} published`,
    filterAll: "All",
    filterLive: "Live",
    filterDraft: "Draft",
    colChallenge: "Challenge",
    colStatus: "Status",
    colDeadline: "Deadline",
    colPrize: "Prize",
    statusPublic: "Public",
    statusSubmission: "Submission",
    statusInfo: "Info",
    tipPublicOn: "Challenge is public",
    tipPublicOff: "Challenge is a draft (not public)",
    tipSubmissionOn: "Submission open for participants",
    tipSubmissionOff: "Submission closed for participants",
    tipSubmissionOnDescription: "Submission open, description required",
    tipInfoOn: "Info published to participants",
    tipInfoOff: "Info hidden from participants",
    noDeadline: "No deadline",
    today: "Today",
    preview: "Preview",
    moreActions: "More actions",
    setDeadline: "Set deadline",
    changeDeadline: "Change deadline",
    openSubmissionMenu: "Open submission…",
    editSubmissionMenu: "Edit submission…",
    openSubmissionTitle: "Open submission",
    editSubmissionTitle: "Edit submission",
    submissionDialogHint:
      "Registered participants of this category see a selection in their dashboard and can sign up for this challenge.",
    descriptionRequiredLabel: "Description required",
    descriptionRequiredHint:
      "Participants must also submit a short description of their approach alongside their selection.",
    openSubmission: "Open submission",
    closeSubmission: "Close submission",
    submissionOpened: "Submission opened for participants",
    submissionClosed: "Submission closed for participants",
    submissionSaved: "Submission settings saved",
    deleteMenu: "Delete…",
    published: "Published",
    draft: "Draft",
    publishInfo: "Publish info",
    unpublishInfo: "Hide info",
    publishInfoSuccess: "Challenge info published to participants",
    unpublishInfoSuccess: "Challenge info hidden from participants",
    labelInfoPublished: "Info for participants",
    infoNotPublished: "Not published",
    deadlineDialogTitle: "Submission deadline",
    deadlineDialogHint:
      "Participants accepted for this challenge see a countdown banner in their dashboard until the deadline.",
    deadlineLabel: "Date and time",
    deadlineRemove: "Remove deadline",
    deadlineSave: "Save",
    deadlineSaved: "Submission deadline saved",
    deadlineRemoved: "Submission deadline removed",
    labelDeadline: "Submission deadline",
    allCategories: "All Categories",
    noTitle: "(No Title)",
    noResults: "No challenges found.",
    unpublish: "Unpublish",
    publish: "Publish",
    close: "Close",
    detailsDialogDefaultTitle: "Challenge Details",
    labelCompany: "Company",
    labelCategory: "Category",
    labelContact: "Contact",
    labelUser: "User",
    labelDifficulty: "Difficulty",
    labelTeamSize: "Team Size",
    labelLanguage: "Language",
    labelPrize: "Prize",
    labelSponsor: "Sponsor",
    labelStatus: "Status",
    labelSubmitted: "Submitted",
    labelDescription: "Short Description (DE)",
    labelDescriptionEn: "Short Description (EN)",
    labelFullData: "Full Challenge Data",
    deleteTitle: "Delete challenge?",
    deleteWarning: "This action cannot be undone.",
    cancel: "Cancel",
    deleteBtn: "Delete",
    loadError: "Failed to load challenges",
    publishSuccess: "Published",
    unpublishSuccess: "Set to draft",
    toggleError: "Failed to update",
    deleted: "Deleted",
    deleteError: "Failed to delete",
    newChallenge: "New Challenge",
    editChallenge: "Edit Challenge",
    challengeEditor: "Challenge Editor",
    selectCategory: "Select category",
    selectCategoryHint: "Which category should this challenge be created for?"
  }
} as const

export function AdminChallengesPage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const text = copy[language]

  // Show the challenge text for the active admin language, falling back to the other language.
  const pickLocale = (de: string | null | undefined, en: string | null | undefined) =>
    (language === "en" ? en || de : de || en) || ""

  const isCategoryPartner = user?.role === "category_partner"

  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [detailChallenge, setDetailChallenge] = useState<Challenge | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [togglingInfoId, setTogglingInfoId] = useState<string | null>(null)
  const [editingSubmission, setEditingSubmission] = useState<{
    id: string
    wasEnabled: boolean
    descriptionRequired: boolean
  } | null>(null)
  const [savingSubmission, setSavingSubmission] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  // value is in the "datetime-local" input format (local time, no timezone)
  const [editingDeadline, setEditingDeadline] = useState<{ id: string; value: string } | null>(null)
  const [savingDeadline, setSavingDeadline] = useState(false)

  // Editor sheet state
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorCategory, setEditorCategory] = useState<CategoryInfo | null>(null)
  const [editorChallengeId, setEditorChallengeId] = useState<string | null>(null)
  const [allCategories, setAllCategories] = useState<CategoryInfo[]>([])
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [pickedCategoryId, setPickedCategoryId] = useState<string>("")

  const dateLocale = language === "en" ? "en-GB" : "de-CH"

  useEffect(() => {
    void load()
    if (!isCategoryPartner) void loadAllCategories()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/challenges", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      const list: Challenge[] = data.data?.challenges || []
      setChallenges(list)

      // For category partner, derive editor category from the loaded data or user
      if (isCategoryPartner && list.length > 0) {
        setEditorCategory({
          id: list[0].category_id,
          name: list[0].category_name,
          slug: list[0].category_slug
        })
      }
    } catch {
      toast.error(text.loadError)
    } finally {
      setLoading(false)
    }
  }

  const loadAllCategories = async () => {
    try {
      const res = await fetch("/api/categories", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      const cats: CategoryInfo[] = (data.data?.categories || []).map(
        (c: { id: string; name: string; slug: string }) => ({
          id: c.id,
          name: c.name,
          slug: c.slug
        })
      )
      setAllCategories(cats)
    } catch {
      // non-critical
    }
  }

  // Fetch category info for category_partner when there are no challenges yet
  useEffect(() => {
    if (!isCategoryPartner || editorCategory || !user?.categoryId) return
    const found = challenges.find((c) => c.category_id === user.categoryId)
    if (found) {
      setEditorCategory({ id: found.category_id, name: found.category_name, slug: found.category_slug })
      return
    }
    // Fetch from public categories endpoint
    fetch("/api/categories", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const cat = (data.data?.categories || []).find((c: { id: string }) => c.id === user.categoryId)
        if (cat) setEditorCategory({ id: cat.id, name: cat.name, slug: cat.slug })
      })
      .catch(() => {})
  }, [isCategoryPartner, challenges, editorCategory, user?.categoryId])

  const openEditor = (category: CategoryInfo, challengeId: string | null) => {
    setEditorCategory(category)
    setEditorChallengeId(challengeId)
    setEditorOpen(true)
  }

  const handleNewChallenge = () => {
    if (isCategoryPartner) {
      if (editorCategory) openEditor(editorCategory, null)
      return
    }
    // Admin: pick category first
    setPickedCategoryId(allCategories[0]?.id || "")
    setCategoryPickerOpen(true)
  }

  const handleEditChallenge = (challenge: Challenge) => {
    openEditor(
      { id: challenge.category_id, name: challenge.category_name, slug: challenge.category_slug },
      challenge.id
    )
  }

  const toggleStatus = async (challenge: Challenge) => {
    const newStatus = challenge.status === "published" ? "draft" : "published"
    try {
      setTogglingId(challenge.id)
      const res = await fetch("/api/admin/challenges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: challenge.id, status: newStatus })
      })
      if (!res.ok) throw new Error()
      toast.success(newStatus === "published" ? text.publishSuccess : text.unpublishSuccess)
      setChallenges((prev) => prev.map((c) => (c.id === challenge.id ? { ...c, status: newStatus } : c)))
    } catch {
      toast.error(text.toggleError)
    } finally {
      setTogglingId(null)
    }
  }

  const toggleInfoPublished = async (challenge: Challenge) => {
    const infoPublished = !challenge.info_published
    try {
      setTogglingInfoId(challenge.id)
      const res = await fetch("/api/admin/challenges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: challenge.id, infoPublished })
      })
      if (!res.ok) throw new Error()
      toast.success(infoPublished ? text.publishInfoSuccess : text.unpublishInfoSuccess)
      setChallenges((prev) =>
        prev.map((c) => (c.id === challenge.id ? { ...c, info_published: infoPublished } : c))
      )
    } catch {
      toast.error(text.toggleError)
    } finally {
      setTogglingInfoId(null)
    }
  }

  const saveDeadline = async (value: string | null) => {
    if (!editingDeadline) return
    const submissionDeadline = value ? new Date(value).toISOString() : null
    try {
      setSavingDeadline(true)
      const res = await fetch("/api/admin/challenges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: editingDeadline.id, submissionDeadline })
      })
      if (!res.ok) throw new Error()
      toast.success(submissionDeadline ? text.deadlineSaved : text.deadlineRemoved)
      setChallenges((prev) =>
        prev.map((c) => (c.id === editingDeadline.id ? { ...c, submission_deadline: submissionDeadline } : c))
      )
      setEditingDeadline(null)
    } catch {
      toast.error(text.toggleError)
    } finally {
      setSavingDeadline(false)
    }
  }

  const formatDeadline = (iso: string) =>
    new Date(iso).toLocaleString(dateLocale, {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })

  const formatDeadlineTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })

  const formatDeadlineDay = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, { weekday: "short", day: "2-digit", month: "2-digit" })

  const saveSubmission = async (enabled: boolean) => {
    if (!editingSubmission) return
    const { id, wasEnabled } = editingSubmission
    // Closing the submission also drops the description requirement (mirrors the server)
    const descriptionRequired = enabled && editingSubmission.descriptionRequired
    try {
      setSavingSubmission(true)
      const res = await fetch("/api/admin/challenges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id,
          submissionEnabled: enabled,
          submissionDescriptionRequired: descriptionRequired
        })
      })
      if (!res.ok) throw new Error()
      toast.success(
        !enabled ? text.submissionClosed : wasEnabled ? text.submissionSaved : text.submissionOpened
      )
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, submission_enabled: enabled, submission_description_required: descriptionRequired }
            : c
        )
      )
      setEditingSubmission(null)
    } catch {
      toast.error(text.toggleError)
    } finally {
      setSavingSubmission(false)
    }
  }

  const remove = async () => {
    if (!deleteId) return
    try {
      await fetch(`/api/admin/challenges?id=${deleteId}`, { method: "DELETE", credentials: "include" })
      toast.success(text.deleted)
      setChallenges((prev) => prev.filter((c) => c.id !== deleteId))
      setDeleteId(null)
    } catch {
      toast.error(text.deleteError)
    }
  }

  const categories = Array.from(new Set(challenges.map((c) => c.category_name))).sort()

  const inCategory = challenges.filter((c) => filterCategory === "all" || c.category_name === filterCategory)
  const filtered = inCategory.filter((c) => filterStatus === "all" || c.status === filterStatus)
  const publishedCount = challenges.filter((c) => c.status === "published").length

  const statusFilters = [
    { value: "all", label: text.filterAll, count: inCategory.length },
    {
      value: "published",
      label: text.filterLive,
      count: inCategory.filter((c) => c.status === "published").length
    },
    { value: "draft", label: text.filterDraft, count: inCategory.filter((c) => c.status === "draft").length }
  ]

  // Shared column template so header and rows stay aligned
  const gridCols = "grid grid-cols-[minmax(0,2.6fr)_300px_150px_110px_120px] items-center gap-4 px-5 py-4"

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{text.heading}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {text.summary(challenges.length, publishedCount)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isCategoryPartner && categories.length > 1 && (
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{text.allCategories}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="bg-muted inline-flex rounded-lg p-1">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filterStatus === f.value}
                onClick={() => setFilterStatus(f.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  filterStatus === f.value
                    ? "bg-background text-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                {f.label} <span className="tabular-nums">{f.count}</span>
              </button>
            ))}
          </div>
          <Button onClick={handleNewChallenge} className="gap-2">
            <Plus className="h-4 w-4" />
            {text.newChallenge}
          </Button>
        </div>
      </div>

      {/* Challenge table */}
      <div className="bg-card border-border overflow-x-auto rounded-[14px] border">
        <div className="min-w-[960px]">
          <div
            className={cn(
              gridCols,
              "border-border text-muted-foreground border-b py-3 text-xs font-medium tracking-[0.04em] uppercase"
            )}>
            <span>{text.colChallenge}</span>
            <span>{text.colStatus}</span>
            <span>{text.colDeadline}</span>
            <span className="text-right">{text.colPrize}</span>
            <span />
          </div>

          {filtered.length === 0 && (
            <p className="text-muted-foreground py-12 text-center">{text.noResults}</p>
          )}

          <div className="divide-border divide-y">
            {filtered.map((challenge) => {
              const title =
                pickLocale(challenge.challenge_title, challenge.challenge_title_en) || text.noTitle
              const description = pickLocale(challenge.short_description, challenge.short_description_en)
              const isPublished = challenge.status === "published"
              const isBusy = togglingId === challenge.id || togglingInfoId === challenge.id
              const deadline = challenge.submission_deadline

              return (
                <div key={challenge.id} className={cn(gridCols, "hover:bg-muted/40 transition-colors")}>
                  {/* Challenge */}
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-[15px] font-semibold">{title}</p>
                      <Badge variant="secondary" className="rounded-full">
                        {challenge.category_name}
                      </Badge>
                    </div>
                    {description && (
                      <p className="text-muted-foreground mt-0.5 truncate text-[13px]">{description}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-4 text-[13px]">
                    <StatusIndicator
                      active={isPublished}
                      label={text.statusPublic}
                      tooltip={isPublished ? text.tipPublicOn : text.tipPublicOff}
                    />
                    <StatusIndicator
                      active={challenge.submission_enabled}
                      label={text.statusSubmission}
                      tooltip={
                        !challenge.submission_enabled
                          ? text.tipSubmissionOff
                          : challenge.submission_description_required
                            ? text.tipSubmissionOnDescription
                            : text.tipSubmissionOn
                      }
                    />
                    <StatusIndicator
                      active={challenge.info_published}
                      label={text.statusInfo}
                      tooltip={challenge.info_published ? text.tipInfoOn : text.tipInfoOff}
                    />
                  </div>

                  {/* Deadline */}
                  <div className="text-[13px]">
                    {!deadline ? (
                      <span className="text-muted-foreground">{text.noDeadline}</span>
                    ) : isToday(deadline) ? (
                      <>
                        <p className="font-medium text-amber-700 dark:text-amber-500">
                          {text.today}, {formatDeadlineTime(deadline)}
                        </p>
                        <p className="text-muted-foreground">{formatDeadlineDay(deadline)}</p>
                      </>
                    ) : (
                      <span>{formatDeadline(deadline)}</span>
                    )}
                  </div>

                  {/* Prize */}
                  <div className="text-right text-sm font-medium tabular-nums">
                    {challenge.prize ? (
                      formatPrize(challenge.prize)
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end">
                    <IconAction label={text.preview} onClick={() => setDetailChallenge(challenge)}>
                      <Eye className="h-4 w-4" />
                    </IconAction>
                    <IconAction label={text.editChallenge} onClick={() => handleEditChallenge(challenge)}>
                      <PenLine className="h-4 w-4" />
                    </IconAction>
                    <DropdownMenu modal={false}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={text.moreActions}
                              className="text-muted-foreground hover:bg-muted hover:text-foreground data-[state=open]:bg-muted">
                              {isBusy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{text.moreActions}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="end" className="min-w-56 rounded-lg p-1.5">
                        <DropdownMenuItem
                          className={menuItemClass}
                          disabled={togglingInfoId === challenge.id}
                          onSelect={() => toggleInfoPublished(challenge)}>
                          {challenge.info_published ? <FileX /> : <FileCheck />}
                          {challenge.info_published ? text.unpublishInfo : text.publishInfo}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={menuItemClass}
                          onSelect={() =>
                            setEditingDeadline({
                              id: challenge.id,
                              value: deadline ? toDatetimeLocal(deadline) : ""
                            })
                          }>
                          <AlarmClock />
                          {deadline ? text.changeDeadline : text.setDeadline}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={menuItemClass}
                          onSelect={() =>
                            setEditingSubmission({
                              id: challenge.id,
                              wasEnabled: challenge.submission_enabled,
                              descriptionRequired: challenge.submission_description_required
                            })
                          }>
                          {challenge.submission_enabled ? <SquarePen /> : <SquarePlus />}
                          {challenge.submission_enabled ? text.editSubmissionMenu : text.openSubmissionMenu}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={menuItemClass}
                          disabled={togglingId === challenge.id}
                          onSelect={() => toggleStatus(challenge)}>
                          {isPublished ? <GlobeOff /> : <Globe />}
                          {isPublished ? text.unpublish : text.publish}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleteId(challenge.id)}>
                          <Trash2 />
                          {text.deleteMenu}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Challenge Editor Sheet */}
      <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
        <SheetContent side="right" className="flex w-full max-w-4xl flex-col gap-0 p-0 sm:max-w-4xl">
          <SheetHeader className="border-border border-b px-6 py-4">
            <SheetTitle>
              {text.challengeEditor}
              {editorCategory ? ` – ${editorCategory.name}` : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {editorCategory && (
              <SponsorChallengeEditor
                key={`${editorCategory.id}:${editorChallengeId ?? "new"}`}
                categoryName={editorCategory.name}
                categorySlug={editorCategory.slug}
                categoryId={editorCategory.id}
                initialChallenge={null}
                initialChallengeId={editorChallengeId}
                forceNew={editorChallengeId === null}
                onSaved={() => {
                  void load()
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Admin category picker for new challenge */}
      {!isCategoryPartner && (
        <Dialog open={categoryPickerOpen} onOpenChange={setCategoryPickerOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{text.newChallenge}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">{text.selectCategoryHint}</p>
              <Select value={pickedCategoryId} onValueChange={setPickedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder={text.selectCategory} />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setCategoryPickerOpen(false)}>
                {text.cancel}
              </Button>
              <Button
                disabled={!pickedCategoryId}
                onClick={() => {
                  const cat = allCategories.find((c) => c.id === pickedCategoryId)
                  if (cat) {
                    setCategoryPickerOpen(false)
                    openEditor(cat, null)
                  }
                }}>
                {text.newChallenge}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detailChallenge} onOpenChange={(open) => !open && setDetailChallenge(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {pickLocale(detailChallenge?.challenge_title, detailChallenge?.challenge_title_en) ||
                text.detailsDialogDefaultTitle}
            </DialogTitle>
          </DialogHeader>
          {detailChallenge && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <Detail label={text.labelCompany} value={detailChallenge.company_name} />
                <Detail label={text.labelSponsor} value={detailChallenge.sponsor_company_name} />
                <Detail label={text.labelCategory} value={detailChallenge.category_name} />
                <Detail label={text.labelContact} value={detailChallenge.contact_email} />
                <Detail label={text.labelUser} value={detailChallenge.user_email} />
                <Detail label={text.labelDifficulty} value={detailChallenge.difficulty} />
                <Detail label={text.labelTeamSize} value={detailChallenge.team_size} />
                <Detail label={text.labelLanguage} value={detailChallenge.challenge_language} />
                <Detail label={text.labelPrize} value={detailChallenge.prize} />
                <Detail
                  label={text.labelStatus}
                  value={detailChallenge.status === "published" ? text.published : text.draft}
                />
                <Detail
                  label={text.labelInfoPublished}
                  value={detailChallenge.info_published ? text.published : text.infoNotPublished}
                />
                <Detail
                  label={text.labelDeadline}
                  value={
                    detailChallenge.submission_deadline
                      ? formatDeadline(detailChallenge.submission_deadline)
                      : null
                  }
                />
                <Detail
                  label={text.labelSubmitted}
                  value={new Date(detailChallenge.created_at).toLocaleString(dateLocale)}
                />
              </div>
              {detailChallenge.short_description && (
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                    {text.labelDescription}
                  </p>
                  <p className="leading-relaxed">{detailChallenge.short_description}</p>
                </div>
              )}
              {detailChallenge.short_description_en && (
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                    {text.labelDescriptionEn}
                  </p>
                  <p className="leading-relaxed">{detailChallenge.short_description_en}</p>
                </div>
              )}
              {detailChallenge.challenge_data && Object.keys(detailChallenge.challenge_data).length > 0 && (
                <details className="rounded-lg border p-3">
                  <summary className="cursor-pointer font-medium">{text.labelFullData}</summary>
                  <pre className="text-muted-foreground mt-3 overflow-x-auto text-xs whitespace-pre-wrap">
                    {JSON.stringify(detailChallenge.challenge_data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailChallenge(null)}>
              {text.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submission settings dialog */}
      <Dialog open={!!editingSubmission} onOpenChange={(open) => !open && setEditingSubmission(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSubmission?.wasEnabled ? text.editSubmissionTitle : text.openSubmissionTitle}
            </DialogTitle>
          </DialogHeader>
          {editingSubmission && (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">{text.submissionDialogHint}</p>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="submission-description-required"
                  className="mt-0.5"
                  checked={editingSubmission.descriptionRequired}
                  onCheckedChange={(checked) =>
                    setEditingSubmission({ ...editingSubmission, descriptionRequired: checked === true })
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="submission-description-required">{text.descriptionRequiredLabel}</Label>
                  <p className="text-muted-foreground text-xs">{text.descriptionRequiredHint}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {editingSubmission?.wasEnabled && (
              <Button
                variant="destructive"
                className="sm:mr-auto"
                disabled={savingSubmission}
                onClick={() => saveSubmission(false)}>
                {text.closeSubmission}
              </Button>
            )}
            <Button variant="outline" onClick={() => setEditingSubmission(null)}>
              {text.cancel}
            </Button>
            <Button disabled={savingSubmission} onClick={() => saveSubmission(true)}>
              {savingSubmission && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingSubmission?.wasEnabled ? text.deadlineSave : text.openSubmission}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submission deadline dialog */}
      <Dialog open={!!editingDeadline} onOpenChange={(open) => !open && setEditingDeadline(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{text.deadlineDialogTitle}</DialogTitle>
          </DialogHeader>
          {editingDeadline && (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">{text.deadlineDialogHint}</p>
              <div className="space-y-1.5">
                <Label htmlFor="submission-deadline">{text.deadlineLabel}</Label>
                <Input
                  id="submission-deadline"
                  type="datetime-local"
                  value={editingDeadline.value}
                  onChange={(e) => setEditingDeadline({ ...editingDeadline, value: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {challenges.find((c) => c.id === editingDeadline?.id)?.submission_deadline && (
              <Button
                variant="outline"
                className="text-destructive sm:mr-auto"
                disabled={savingDeadline}
                onClick={() => saveDeadline(null)}>
                {text.deadlineRemove}
              </Button>
            )}
            <Button variant="outline" onClick={() => setEditingDeadline(null)}>
              {text.cancel}
            </Button>
            <Button
              disabled={savingDeadline || !editingDeadline?.value}
              onClick={() => saveDeadline(editingDeadline?.value || null)}>
              {savingDeadline && <Loader2 className="h-4 w-4 animate-spin" />}
              {text.deadlineSave}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{text.deleteTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">{text.deleteWarning}</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {text.cancel}
            </Button>
            <Button
              onClick={remove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {text.deleteBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function toDatetimeLocal(iso: string) {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Neutral hover instead of the default accent (yellow) highlight
const menuItemClass = "focus:bg-muted focus:text-foreground"

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString()
}

// Formats plain numeric prizes as "CHF 1'000"; free-text prizes are shown as entered
function formatPrize(prize: string) {
  const raw = prize.trim()
  const digits = raw.replace(/^CHF\s*/i, "").replace(/['’\s,]/g, "")
  if (!/^\d+$/.test(digits)) return raw
  return `CHF ${digits.replace(/\B(?=(\d{3})+(?!\d))/g, "'")}`
}

function StatusIndicator({ active, label, tooltip }: { active: boolean; label: string; tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "focus-visible:ring-ring/50 inline-flex cursor-default items-center gap-1.5 rounded-sm outline-none focus-visible:ring-2",
            active ? "text-foreground" : "text-muted-foreground"
          )}>
          <span
            aria-hidden
            className={cn("size-2 shrink-0 rounded-full", active ? "bg-green-600" : "bg-red-600")}
          />
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

function IconAction({
  label,
  onClick,
  children
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          onClick={onClick}
          className="text-muted-foreground hover:bg-muted hover:text-foreground">
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{label}</p>
      <p className="mt-0.5">{value || <span className="text-muted-foreground">—</span>}</p>
    </div>
  )
}
