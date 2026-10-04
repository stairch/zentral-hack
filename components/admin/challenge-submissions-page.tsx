"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Eye, CheckCircle, XCircle, Clock, Filter } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { normalizeHexColor, getContrastForegroundColor } from "@/lib/helpers"
import type { ChallengeSubmissionStatus } from "@/lib/challenge-submission"

interface Submission {
  id: string
  user_id: string
  category_id: string
  challenge_id: string
  description: string | null
  status: ChallengeSubmissionStatus
  review_comment: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  user_email: string
  first_name: string | null
  last_name: string | null
  category_name: string
  category_color: string | null
  challenge_title: string | null
  challenge_title_en: string | null
}

const copy = {
  de: {
    heading: "CHALLENGE SUBMISSIONS",
    subtitle: "Challenge-Einreichungen der Teilnehmer verwalten",
    subtitleCategory: "Challenge-Einreichungen deiner Kategorie verwalten",
    total: "total",
    allStatus: "Alle Status",
    pending: "Ausstehend",
    accepted: "Angenommen",
    rejected: "Abgelehnt",
    allCategories: "Alle Kategorien",
    of: "von",
    submissions: "Einreichungen",
    noResults: "Keine Einreichungen gefunden.",
    noTitle: "(Kein Titel)",
    detailsTitle: "Details",
    close: "Schliessen",
    labelUser: "Nutzer",
    labelCategory: "Kategorie",
    labelChallenge: "Challenge",
    labelStatus: "Status",
    labelSubmitted: "Eingereicht",
    labelDescription: "Challengebeschreibung",
    labelReviewComment: "Kommentar",
    changeDecision: "Entscheidung ändern",
    accept: "Annehmen",
    reject: "Ablehnen",
    rejectTitle: "Einreichung ablehnen",
    rejectCommentLabel: "Kommentar für den Teilnehmer",
    rejectCommentPlaceholder: "Begründung der Ablehnung...",
    rejectCommentRequired: "Ein Kommentar ist beim Ablehnen erforderlich",
    cancel: "Abbrechen",
    confirmReject: "Ablehnen",
    loadError: "Fehler beim Laden der Einreichungen",
    acceptSuccess: "Einreichung angenommen",
    rejectSuccess: "Einreichung abgelehnt",
    updateError: "Fehler beim Aktualisieren"
  },
  en: {
    heading: "CHALLENGE SUBMISSIONS",
    subtitle: "Manage participant challenge submissions",
    subtitleCategory: "Manage challenge submissions for your category",
    total: "total",
    allStatus: "All Status",
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Rejected",
    allCategories: "All Categories",
    of: "of",
    submissions: "submissions",
    noResults: "No submissions found.",
    noTitle: "(No title)",
    detailsTitle: "Details",
    close: "Close",
    labelUser: "User",
    labelCategory: "Category",
    labelChallenge: "Challenge",
    labelStatus: "Status",
    labelSubmitted: "Submitted",
    labelDescription: "Challenge description",
    labelReviewComment: "Comment",
    changeDecision: "Change decision",
    accept: "Accept",
    reject: "Reject",
    rejectTitle: "Reject submission",
    rejectCommentLabel: "Comment for the participant",
    rejectCommentPlaceholder: "Reason for rejection...",
    rejectCommentRequired: "A comment is required when rejecting",
    cancel: "Cancel",
    confirmReject: "Reject",
    loadError: "Failed to load submissions",
    acceptSuccess: "Submission accepted",
    rejectSuccess: "Submission rejected",
    updateError: "Failed to update"
  }
} as const

function categoryBadgeStyle(color: string | null) {
  if (!color) return undefined
  const normalized = normalizeHexColor(color)
  return {
    backgroundColor: normalized,
    color: getContrastForegroundColor(normalized),
    borderColor: normalized
  }
}

export function AdminChallengeSubmissionsPage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const text = copy[language]

  const pickLocale = (de: string | null | undefined, en: string | null | undefined) =>
    (language === "en" ? en || de : de || en) || ""

  const isCategoryPartner = user?.role === "category_partner"

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [detailSubmission, setDetailSubmission] = useState<Submission | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Submission | null>(null)
  const [rejectComment, setRejectComment] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [reconsiderId, setReconsiderId] = useState<string | null>(null)

  const dateLocale = language === "en" ? "en-GB" : "de-CH"

  useEffect(() => {
    void load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/challenge-submissions", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setSubmissions(data.data?.submissions || [])
    } catch {
      toast.error(text.loadError)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: "accepted" | "rejected", reviewComment?: string) => {
    try {
      setSavingId(id)
      const res = await fetch("/api/admin/challenge-submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status, reviewComment })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || text.updateError)
      }
      const data = await res.json()
      const updated = data.data?.submission as Submission
      setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)))
      setReconsiderId(null)
      toast.success(status === "accepted" ? text.acceptSuccess : text.rejectSuccess)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : text.updateError)
    } finally {
      setSavingId(null)
    }
  }

  const confirmReject = async () => {
    if (!rejectTarget) return
    if (!rejectComment.trim()) {
      toast.error(text.rejectCommentRequired)
      return
    }
    await updateStatus(rejectTarget.id, "rejected", rejectComment.trim())
    setRejectTarget(null)
    setRejectComment("")
  }

  const categories = Array.from(new Set(submissions.map((s) => s.category_name))).sort()

  const filtered = submissions.filter((s) => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false
    if (filterCategory !== "all" && s.category_name !== filterCategory) return false
    return true
  })

  const statusBadge = (status: ChallengeSubmissionStatus) => {
    if (status === "accepted") {
      return (
        <Badge className="gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          {text.accepted}
        </Badge>
      )
    }
    if (status === "rejected") {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          {text.rejected}
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        {text.pending}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{text.heading}</h1>
        <p className="text-muted-foreground mt-2">
          {isCategoryPartner ? text.subtitleCategory : text.subtitle} ({submissions.length} {text.total})
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground h-4 w-4" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{text.allStatus}</SelectItem>
              <SelectItem value="pending">{text.pending}</SelectItem>
              <SelectItem value="accepted">{text.accepted}</SelectItem>
              <SelectItem value="rejected">{text.rejected}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!isCategoryPartner && (
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-52">
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
        <div className="text-muted-foreground flex items-center text-sm">
          {filtered.length} {text.of} {submissions.length} {text.submissions}
        </div>
      </div>

      {/* Submissions list */}
      <div className="space-y-3">
        {filtered.length === 0 && <p className="text-muted-foreground py-12 text-center">{text.noResults}</p>}
        {filtered.map((submission) => (
          <div
            key={submission.id}
            className="bg-card border-border flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">
                  {pickLocale(submission.challenge_title, submission.challenge_title_en) || text.noTitle}
                </p>
                {statusBadge(submission.status)}
                <Badge variant="outline" style={categoryBadgeStyle(submission.category_color)}>
                  {submission.category_name}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-0.5 text-sm">
                {[submission.first_name, submission.last_name].filter(Boolean).join(" ") ||
                  submission.user_email}{" "}
                · {submission.user_email}
              </p>
              {submission.description && (
                <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">{submission.description}</p>
              )}
            </div>

            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                title={text.detailsTitle}
                onClick={() => setDetailSubmission(submission)}>
                <Eye className="h-4 w-4" />
              </Button>
              {submission.status === "pending" || reconsiderId === submission.id ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={savingId === submission.id}
                    onClick={() => void updateStatus(submission.id, "accepted")}
                    className="text-green-600 hover:text-green-700">
                    {savingId === submission.id ? <Loader2 className="h-4 w-4 animate-spin" /> : text.accept}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={savingId === submission.id}
                    onClick={() => {
                      setRejectTarget(submission)
                      setRejectComment(submission.review_comment || "")
                    }}
                    className="text-destructive hover:text-destructive">
                    {text.reject}
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setReconsiderId(submission.id)}>
                  {text.changeDecision}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detailSubmission} onOpenChange={(open) => !open && setDetailSubmission(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {pickLocale(detailSubmission?.challenge_title, detailSubmission?.challenge_title_en) ||
                text.detailsTitle}
            </DialogTitle>
          </DialogHeader>
          {detailSubmission && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <Detail
                  label={text.labelUser}
                  value={
                    [detailSubmission.first_name, detailSubmission.last_name].filter(Boolean).join(" ") ||
                    detailSubmission.user_email
                  }
                />
                <Detail label={text.labelCategory} value={detailSubmission.category_name} />
                <Detail
                  label={text.labelChallenge}
                  value={pickLocale(detailSubmission.challenge_title, detailSubmission.challenge_title_en)}
                />
                <Detail
                  label={text.labelStatus}
                  value={
                    detailSubmission.status === "accepted"
                      ? text.accepted
                      : detailSubmission.status === "rejected"
                        ? text.rejected
                        : text.pending
                  }
                />
                <Detail
                  label={text.labelSubmitted}
                  value={new Date(detailSubmission.created_at).toLocaleString(dateLocale)}
                />
              </div>
              {detailSubmission.description && (
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                    {text.labelDescription}
                  </p>
                  <p className="leading-relaxed whitespace-pre-wrap">{detailSubmission.description}</p>
                </div>
              )}
              {detailSubmission.review_comment && (
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                    {text.labelReviewComment}
                  </p>
                  <p className="leading-relaxed whitespace-pre-wrap">{detailSubmission.review_comment}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailSubmission(null)}>
              {text.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{text.rejectTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm font-medium">{text.rejectCommentLabel}</p>
            <Textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder={text.rejectCommentPlaceholder}
              rows={4}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              {text.cancel}
            </Button>
            <Button
              onClick={() => void confirmReject()}
              disabled={savingId === rejectTarget?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {savingId === rejectTarget?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                text.confirmReject
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
