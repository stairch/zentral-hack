"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowDown, ArrowUp, ImageIcon, Loader2, Plus, Save, Trash2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { uploadEventPhoto } from "@/lib/client-upload"
import {
  eventPhotoSrc,
  rankingGroupKey,
  type AdminRankingCategory,
  type AdminRankingGroup
} from "@/lib/event-phase"

const copy = {
  de: {
    hint: "Pro Challenge beliebig viele Ränge vergeben. Alle vergebenen Ränge und das Gewinnerfoto erscheinen auf der Rückblick-Startseite. Fotos werden sofort hochgeladen, Ränge mit „Speichern“ pro Challenge.",
    loadError: "Fehler beim Laden der Platzierungen",
    noCategories: "Noch keine Kategorien vorhanden.",
    categoryRanking: "Kategorie-Wertung",
    withoutChallenge: "Teams ohne Challenge",
    noTeams: "Diese Challenge hat keine Teams.",
    place: (n: number) => `Platz ${n}`,
    selectTeam: "Team wählen",
    addRank: "Rang hinzufügen",
    save: "Speichern",
    saveSuccess: "Platzierungen gespeichert",
    saveError: "Fehler beim Speichern der Platzierungen",
    unsaved: "Ungespeichert",
    moveUp: "Nach oben",
    moveDown: "Nach unten",
    removeRank: "Rang entfernen",
    winnerPhoto: "Gewinnerfoto",
    upload: "Hochladen",
    replace: "Ersetzen",
    uploadSuccess: "Gewinnerfoto hochgeladen",
    uploadError: "Fehler beim Hochladen",
    deleteTitle: "Gewinnerfoto löschen?",
    deleteDescription: "Diese Aktion kann nicht rückgängig gemacht werden.",
    deleteConfirm: "Löschen",
    cancel: "Abbrechen",
    deleteSuccess: "Gewinnerfoto gelöscht",
    deleteError: "Fehler beim Löschen"
  },
  en: {
    hint: "Add as many ranks as you like per challenge. All ranks and the winner photo appear on the recap landing page. Photos upload right away, ranks are saved per challenge with “Save”.",
    loadError: "Failed to load placements",
    noCategories: "No categories yet.",
    categoryRanking: "Category ranking",
    withoutChallenge: "Teams without a challenge",
    noTeams: "This challenge has no teams.",
    place: (n: number) => `Place ${n}`,
    selectTeam: "Select team",
    addRank: "Add rank",
    save: "Save",
    saveSuccess: "Placements saved",
    saveError: "Failed to save placements",
    unsaved: "Unsaved",
    moveUp: "Move up",
    moveDown: "Move down",
    removeRank: "Remove rank",
    winnerPhoto: "Winner photo",
    upload: "Upload",
    replace: "Replace",
    uploadSuccess: "Winner photo uploaded",
    uploadError: "Failed to upload",
    deleteTitle: "Delete winner photo?",
    deleteDescription: "This action cannot be undone.",
    deleteConfirm: "Delete",
    cancel: "Cancel",
    deleteSuccess: "Winner photo deleted",
    deleteError: "Failed to delete"
  }
} as const

type Text = (typeof copy)[keyof typeof copy]

// Embedded in the leaderboard card of the event phase admin page
export function RankingsManager() {
  const { language } = useLanguage()
  const text = copy[language]

  const [categories, setCategories] = useState<AdminRankingCategory[]>([])
  const [loading, setLoading] = useState(true)
  // Unsaved ranks per group, kept here because a collapsed group unmounts its editor
  const [drafts, setDrafts] = useState<Record<string, string[]>>({})

  useEffect(() => {
    void load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/rankings", { credentials: "include" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCategories(data.data?.categories || [])
    } catch {
      toast.error(text.loadError)
    } finally {
      setLoading(false)
    }
  }

  const updateGroup = (
    categoryId: string,
    challengeId: string | null,
    changes: Partial<AdminRankingGroup>
  ) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              groups: category.groups.map((group) =>
                group.challenge_id === challengeId ? { ...group, ...changes } : group
              )
            }
      )
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-xs">{text.hint}</p>
      {categories.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">{text.noCategories}</p>
      ) : (
        categories.map((category) => (
          <div key={category.id} className="space-y-3">
            <h3 className="text-sm font-semibold">
              {(language === "en" && category.name_en) || category.name}
            </h3>
            <Accordion type="multiple" className="space-y-2">
              {category.groups.map((group) => {
                const groupKey = rankingGroupKey(category.id, group.challenge_id)
                return (
                  <RankingGroupEditor
                    key={groupKey}
                    groupKey={groupKey}
                    categoryId={category.id}
                    group={group}
                    draft={drafts[groupKey] ?? group.ranked_team_ids}
                    onDraftChange={(draft) => setDrafts((prev) => ({ ...prev, [groupKey]: draft }))}
                    isOnlyGroup={category.groups.length === 1}
                    text={text}
                    onChange={(changes) => updateGroup(category.id, group.challenge_id, changes)}
                  />
                )
              })}
            </Accordion>
          </div>
        ))
      )}
    </div>
  )
}

function RankingGroupEditor({
  groupKey,
  categoryId,
  group,
  draft,
  onDraftChange,
  isOnlyGroup,
  text,
  onChange
}: {
  groupKey: string
  categoryId: string
  group: AdminRankingGroup
  // "" = rank added but no team chosen yet
  draft: string[]
  onDraftChange: (draft: string[]) => void
  isOnlyGroup: boolean
  text: Text
  onChange: (changes: Partial<AdminRankingGroup>) => void
}) {
  const { language } = useLanguage()
  const setDraft = (update: string[] | ((prev: string[]) => string[])) =>
    onDraftChange(typeof update === "function" ? update(draft) : update)
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const title =
    (language === "en" ? group.title_en || group.title : group.title || group.title_en) ||
    (isOnlyGroup ? text.categoryRanking : text.withoutChallenge)
  const chosenIds = draft.filter(Boolean)
  const isDirty = chosenIds.join(",") !== group.ranked_team_ids.join(",") || draft.length !== chosenIds.length

  const setRow = (index: number, teamId: string) =>
    setDraft((prev) => prev.map((id, i) => (i === index ? teamId : id)))
  const moveRow = (index: number, offset: number) =>
    setDraft((prev) => {
      const next = [...prev]
      ;[next[index], next[index + offset]] = [next[index + offset], next[index]]
      return next
    })
  const removeRow = (index: number) => setDraft((prev) => prev.filter((_, i) => i !== index))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/rankings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ categoryId, challengeId: group.challenge_id, teamIds: chosenIds })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || text.saveError)
      setDraft(chosenIds)
      onChange({ ranked_team_ids: chosenIds })
      toast.success(text.saveSuccess)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.saveError)
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const photo = await uploadEventPhoto(file, {
        category_id: categoryId,
        challenge_id: group.challenge_id
      })
      onChange({ winner_photo_id: photo.id })
      setFile(null)
      setFileInputKey((k) => k + 1)
      toast.success(text.uploadSuccess)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.uploadError)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!group.winner_photo_id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/event-photos?id=${group.winner_photo_id}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (!res.ok) throw new Error()
      onChange({ winner_photo_id: null })
      toast.success(text.deleteSuccess)
      setConfirmDelete(false)
    } catch {
      toast.error(text.deleteError)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AccordionItem value={groupKey} className="rounded-md border last:border-b">
      <AccordionTrigger className="items-center px-4 py-3 hover:no-underline">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {group.sponsor_names.map((name) => (
            <Badge key={name} variant="secondary">
              {name}
            </Badge>
          ))}
          {group.winner_photo_id && (
            <ImageIcon className="text-muted-foreground h-4 w-4" aria-label={text.winnerPhoto} />
          )}
          {isDirty && <Badge className="bg-yellow text-violet">{text.unsaved}</Badge>}
        </span>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 px-4 pt-3 pb-4">
        <div className="space-y-2">
          <Label htmlFor={`winner-photo-${groupKey}`}>{text.winnerPhoto}</Label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-muted flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md">
              {group.winner_photo_id ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={eventPhotoSrc(group.winner_photo_id, "thumbnail")}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="text-muted-foreground h-5 w-5" />
              )}
            </div>
            <Input
              key={fileInputKey}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              id={`winner-photo-${groupKey}`}
              className="w-full sm:w-64"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Button
              variant="outline"
              onClick={() => void handleUpload()}
              disabled={uploading || !file}
              className="gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {group.winner_photo_id ? text.replace : text.upload}
            </Button>
            {group.winner_photo_id && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={text.deleteTitle}
                onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {group.teams.length === 0 ? (
          <p className="text-muted-foreground text-sm">{text.noTeams}</p>
        ) : (
          <div className="space-y-2">
            {draft.map((teamId, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-muted-foreground w-16 shrink-0 text-sm font-medium">
                  {text.place(index + 1)}
                </span>
                <Select value={teamId} onValueChange={(value) => setRow(index, value)}>
                  <SelectTrigger className="min-w-0 flex-1">
                    <SelectValue placeholder={text.selectTeam} />
                  </SelectTrigger>
                  <SelectContent>
                    {group.teams
                      .filter((team) => team.id === teamId || !draft.includes(team.id))
                      .map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <span className="truncate">
                            {team.name}
                            {team.members.length > 0 && (
                              <span className="text-muted-foreground ml-1.5 text-xs">
                                ({team.members.join(", ")})
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={text.moveUp}
                  disabled={index === 0}
                  onClick={() => moveRow(index, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={text.moveDown}
                  disabled={index === draft.length - 1}
                  onClick={() => moveRow(index, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={text.removeRank}
                  onClick={() => removeRow(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap justify-between gap-2 pt-1">
              <Button
                variant="outline"
                className="gap-2"
                disabled={draft.length >= group.teams.length}
                onClick={() => setDraft((prev) => [...prev, ""])}>
                <Plus className="h-4 w-4" />
                {text.addRank}
              </Button>
              <Button
                onClick={() => void handleSave()}
                disabled={saving || !isDirty}
                className="bg-violet hover:bg-violet/90 gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {text.save}
              </Button>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={text.deleteTitle}
          description={text.deleteDescription}
          confirmLabel={text.deleteConfirm}
          cancelLabel={text.cancel}
          onConfirm={() => void handleDelete()}
          loading={deleting}
        />
      </AccordionContent>
    </AccordionItem>
  )
}
