"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/lib/language-context"

interface CategoryOption {
  id: string
  name: string
}

interface ProfileSectionProps {
  profile: {
    first_name: string | null
    last_name: string | null
    university: string | null
    study_program: string | null
    semester: number | null
  } | null
  categoryLabel: string
  currentCategoryId: string | null
  hasRegistration: boolean
  allergies: string | null
  dietaryRestrictions: string | null
  linkedinUrl: string | null
  onUpdated: () => Promise<void> | void
}

type FieldKey = "university" | "studyProgram" | "semester" | "allergies" | "dietaryRestrictions" | "category"

export function ProfileSection({
  profile,
  categoryLabel,
  currentCategoryId,
  hasRegistration,
  allergies,
  dietaryRestrictions,
  linkedinUrl,
  onUpdated
}: ProfileSectionProps) {
  const { language } = useLanguage()
  const [editing, setEditing] = useState<FieldKey | null>(null)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<CategoryOption[]>([])

  const t = useMemo(
    () =>
      ({
        de: {
          title: "Dein Profil",
          subtitle: "Klicke auf „Bearbeiten“, um ein Feld zu ändern",
          labelName: "Name",
          labelUniversity: "Universität / Schule / Firma",
          labelStudyProgram: "Studiengang / Ausbildung / Beruf",
          labelSemester: "Studiensemester / Ausbildungsjahr / Berufsjahre",
          labelAllergies: "Allergien",
          labelIntolerances: "Unverträglichkeiten",
          labelCategory: "Aktuelle Kategorie",
          labelLinkedIn: "LinkedIn",
          viewProfile: "Profil ansehen",
          selectCategory: "Kategorie wählen",
          empty: "—",
          edit: "Bearbeiten",
          save: "Speichern",
          cancel: "Abbrechen",
          saved: "Änderung gespeichert",
          error: "Änderung fehlgeschlagen"
        },
        en: {
          title: "Your Profile",
          subtitle: 'Click "Edit" to change a field',
          labelName: "Name",
          labelUniversity: "University",
          labelStudyProgram: "Study program",
          labelSemester: "Semester",
          labelAllergies: "Allergies",
          labelIntolerances: "Intolerances",
          labelCategory: "Current category",
          labelLinkedIn: "LinkedIn",
          viewProfile: "View profile",
          selectCategory: "Select category",
          empty: "—",
          edit: "Edit",
          save: "Save",
          cancel: "Cancel",
          saved: "Change saved",
          error: "Change failed"
        }
      })[language],
    [language]
  )

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories", { credentials: "include" })
        if (!res.ok) return
        const json = await res.json()
        setCategories(
          (json.data?.categories || []).map((c: { id: string; name: string }) => ({
            id: c.id,
            name: c.name
          }))
        )
      } catch (error) {
        console.error("Failed to load categories:", error)
      }
    }
    void loadCategories()
  }, [])

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ")

  const startEdit = (field: FieldKey, current: string) => {
    setEditing(field)
    setDraft(current)
  }

  const cancelEdit = () => {
    setEditing(null)
    setDraft("")
  }

  const buildPayload = (field: FieldKey, value: string): Record<string, string | number | null> => {
    const trimmed = value.trim()
    switch (field) {
      case "university":
        return { university: trimmed || null }
      case "studyProgram":
        return { studyProgram: trimmed || null }
      case "semester":
        return { semester: trimmed ? Number(trimmed) : null }
      case "allergies":
        return { allergies: trimmed || null }
      case "dietaryRestrictions":
        return { dietaryRestrictions: trimmed || null }
      case "category":
        return { categoryId: value }
    }
  }

  const save = async (field: FieldKey) => {
    if (field === "category" && !draft) return
    setSaving(true)
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(buildPayload(field, draft))
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || t.error)
      }
      await onUpdated()
      toast.success(t.saved)
      cancelEdit()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.error)
    } finally {
      setSaving(false)
    }
  }

  type Row = {
    key: FieldKey | "name" | "linkedin"
    label: string
    value: string
    editValue?: string
    editor?: "text" | "number" | "select"
    href?: string
    hidden?: boolean
  }

  const rows: Row[] = [
    { key: "name", label: t.labelName, value: fullName || t.empty },
    {
      key: "university",
      label: t.labelUniversity,
      value: profile?.university || t.empty,
      editValue: profile?.university || "",
      editor: "text"
    },
    {
      key: "studyProgram",
      label: t.labelStudyProgram,
      value: profile?.study_program || t.empty,
      editValue: profile?.study_program || "",
      editor: "text"
    },
    {
      key: "semester",
      label: t.labelSemester,
      value: profile?.semester?.toString() || t.empty,
      editValue: profile?.semester ? String(profile.semester) : "",
      editor: "number"
    },
    {
      key: "allergies",
      label: t.labelAllergies,
      value: allergies || t.empty,
      editValue: allergies || "",
      editor: "text",
      hidden: !hasRegistration
    },
    {
      key: "dietaryRestrictions",
      label: t.labelIntolerances,
      value: dietaryRestrictions || t.empty,
      editValue: dietaryRestrictions || "",
      editor: "text",
      hidden: !hasRegistration
    },
    {
      key: "category",
      label: t.labelCategory,
      value: categoryLabel,
      editValue: currentCategoryId || "",
      editor: "select",
      hidden: !hasRegistration
    },
    ...(linkedinUrl
      ? [{ key: "linkedin" as const, label: t.labelLinkedIn, value: t.viewProfile, href: linkedinUrl }]
      : [])
  ]

  return (
    <section>
      <h2 className="text-base font-bold">{t.title}</h2>
      <p className="text-muted-foreground mt-0.5 mb-3 text-[13px]">{t.subtitle}</p>

      <div className="divide-border divide-y">
        {rows
          .filter((row) => !row.hidden)
          .map((row) => {
            const isEditing = editing === row.key
            const fieldKey = row.key as FieldKey

            return (
              <div
                key={row.key}
                className={`flex justify-between gap-4 py-3 ${isEditing ? "flex-col md:flex-row" : "items-center"}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground mb-1 text-xs">{row.label}</p>
                  {isEditing && row.editor === "select" ? (
                    <Select value={draft} onValueChange={setDraft} disabled={saving}>
                      <SelectTrigger className="max-w-[240px] font-semibold">
                        <SelectValue placeholder={t.selectCategory} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : isEditing ? (
                    <Input
                      autoFocus
                      type={row.editor === "number" ? "number" : "text"}
                      value={draft}
                      disabled={saving}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void save(fieldKey)
                        if (e.key === "Escape") cancelEdit()
                      }}
                      className="w-full font-semibold md:max-w-[240px]"
                    />
                  ) : row.href ? (
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary inline-flex items-center gap-1 text-[15px] font-semibold hover:underline">
                      {row.value}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <p className="truncate text-[15px] font-semibold">{row.value}</p>
                  )}
                </div>

                {row.editor &&
                  (isEditing ? (
                    <div className="flex shrink-0 flex-col items-center gap-2 md:flex-row">
                      <Button
                        className="w-full md:w-auto"
                        size="sm"
                        onClick={() => void save(fieldKey)}
                        disabled={saving}>
                        {saving ? <Loader2 className="h-4 animate-spin" /> : t.save}
                      </Button>
                      <Button
                        className="w-full md:w-auto"
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={saving}>
                        {t.cancel}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary h-auto shrink-0 p-0 font-bold"
                      onClick={() => startEdit(fieldKey, row.editValue ?? "")}>
                      {t.edit}
                    </Button>
                  ))}
              </div>
            )
          })}
      </div>
    </section>
  )
}
