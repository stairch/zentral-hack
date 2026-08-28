"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Loader2, Trash2, Eye, Trophy, CheckCircle, XCircle, Filter, PenLine, Plus } from "lucide-react"
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
    heading: "CHALLENGES",
    subtitle: "Alle eingereichten Sponsor-Challenges verwalten",
    subtitleCategory: "Challenges für deine Kategorie verwalten",
    total: "total",
    allStatus: "Alle Status",
    published: "Veröffentlicht",
    draft: "Entwurf",
    allCategories: "Alle Kategorien",
    of: "von",
    challenges: "Challenges",
    noTitle: "(Kein Titel)",
    noResults: "Keine Challenges gefunden.",
    editPrizePlaceholder: "z.B. CHF 500",
    editPrizeTitle: "Preisgeld bearbeiten",
    detailsTitle: "Details",
    unpublish: "Depublizieren",
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
    prizeSaved: "Preisgeld gespeichert",
    prizeSaveError: "Fehler beim Speichern",
    deleted: "Gelöscht",
    deleteError: "Fehler beim Löschen",
    newChallenge: "Neue Challenge",
    editChallenge: "Challenge bearbeiten",
    challengeEditor: "Challenge-Editor",
    selectCategory: "Kategorie wählen",
    selectCategoryHint: "Für welche Kategorie soll die Challenge erstellt werden?"
  },
  en: {
    heading: "CHALLENGES",
    subtitle: "Manage all submitted sponsor challenges",
    subtitleCategory: "Manage challenges for your category",
    total: "total",
    allStatus: "All Status",
    published: "Published",
    draft: "Draft",
    allCategories: "All Categories",
    of: "of",
    challenges: "Challenges",
    noTitle: "(No Title)",
    noResults: "No challenges found.",
    editPrizePlaceholder: "e.g. CHF 500",
    editPrizeTitle: "Edit prize",
    detailsTitle: "Details",
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
    prizeSaved: "Prize saved",
    prizeSaveError: "Failed to save",
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
  const [editingPrize, setEditingPrize] = useState<{ id: string; prize: string } | null>(null)
  const [savingPrize, setSavingPrize] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

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

  const savePrize = async () => {
    if (!editingPrize) return
    try {
      setSavingPrize(true)
      const res = await fetch("/api/admin/challenges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: editingPrize.id, prize: editingPrize.prize })
      })
      if (!res.ok) throw new Error()
      toast.success(text.prizeSaved)
      setChallenges((prev) =>
        prev.map((c) => (c.id === editingPrize.id ? { ...c, prize: editingPrize.prize || null } : c))
      )
      setEditingPrize(null)
    } catch {
      toast.error(text.prizeSaveError)
    } finally {
      setSavingPrize(false)
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

  const filtered = challenges.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false
    if (filterCategory !== "all" && c.category_name !== filterCategory) return false
    return true
  })

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
          <h1 className="font-display text-3xl font-bold">{text.heading}</h1>
          <p className="text-muted-foreground mt-2">
            {isCategoryPartner ? text.subtitleCategory : text.subtitle} ({challenges.length} {text.total})
          </p>
        </div>
        <Button onClick={handleNewChallenge} className="gap-2">
          <Plus className="h-4 w-4" />
          {text.newChallenge}
        </Button>
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
              <SelectItem value="published">{text.published}</SelectItem>
              <SelectItem value="draft">{text.draft}</SelectItem>
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
          {filtered.length} {text.of} {challenges.length} {text.challenges}
        </div>
      </div>

      {/* Challenge list */}
      <div className="space-y-3">
        {filtered.length === 0 && <p className="text-muted-foreground py-12 text-center">{text.noResults}</p>}
        {filtered.map((challenge) => (
          <div
            key={challenge.id}
            className="bg-card border-border flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center">
            <div className="shrink-0">
              {challenge.status === "published" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="text-muted-foreground h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">
                  {pickLocale(challenge.challenge_title, challenge.challenge_title_en) || text.noTitle}
                </p>
                <Badge variant={challenge.status === "published" ? "default" : "secondary"}>
                  {challenge.status === "published" ? text.published : text.draft}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-0.5 text-sm">
                {challenge.company_name} · {challenge.category_name} · {challenge.user_email}
              </p>
              {pickLocale(challenge.short_description, challenge.short_description_en) && (
                <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                  {pickLocale(challenge.short_description, challenge.short_description_en)}
                </p>
              )}
            </div>

            {/* Prize inline edit */}
            <div className="flex shrink-0 items-center gap-2">
              <Trophy className="text-muted-foreground h-4 w-4 shrink-0" />
              {editingPrize?.id === challenge.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    className="h-8 w-32 text-sm"
                    value={editingPrize.prize}
                    onChange={(e) => setEditingPrize({ ...editingPrize, prize: e.target.value })}
                    placeholder={text.editPrizePlaceholder}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void savePrize()
                      if (e.key === "Escape") setEditingPrize(null)
                    }}
                  />
                  <Button size="sm" className="h-8" onClick={savePrize} disabled={savingPrize}>
                    {savingPrize ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingPrize(null)}>
                    ✕
                  </Button>
                </div>
              ) : (
                <button
                  className="text-muted-foreground hover:text-foreground min-w-[60px] text-left text-sm transition-colors"
                  onClick={() => setEditingPrize({ id: challenge.id, prize: challenge.prize || "" })}
                  title={text.editPrizeTitle}>
                  {challenge.prize || <span className="opacity-50">—</span>}
                </button>
              )}
            </div>

            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                title={text.detailsTitle}
                onClick={() => setDetailChallenge(challenge)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={text.editChallenge}
                onClick={() => handleEditChallenge(challenge)}>
                <PenLine className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={togglingId === challenge.id}
                onClick={() => toggleStatus(challenge)}
                className={
                  challenge.status === "published"
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-green-600 hover:text-green-700"
                }>
                {togglingId === challenge.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : challenge.status === "published" ? (
                  text.unpublish
                ) : (
                  text.publish
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => setDeleteId(challenge.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
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
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
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

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{label}</p>
      <p className="mt-0.5">{value || <span className="text-muted-foreground">—</span>}</p>
    </div>
  )
}
