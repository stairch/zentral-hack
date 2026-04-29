"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Edit2, Loader2, Check, Plus } from "lucide-react"
import { toast } from "sonner"
import {
  categoryIconMap,
  categoryIconOptions,
  getCategoryPresentation,
  getCategoryPresentationByLanguage,
  hexToRgba
} from "@/lib/category-config"
import { useLanguage } from "@/lib/language-context"
import { normalizeHexColor } from "@/lib/helpers"
import { useAuth } from "@/lib/auth-context"

interface Category {
  id: string
  name: string
  name_en?: string | null
  slug: string
  description: string
  description_en?: string | null
  partner_name?: string | null
  partner_name_en?: string | null
  color?: string | null
  icon?: string | null
  challenge_description?: string | null
  challenge_description_en?: string | null
  show_challenge_description?: boolean | null
  prize?: string | null
  target_group?: string | null
  target_group_en?: string | null
}

interface EditFormState {
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  partnerName: string
  partnerNameEn: string
  color: string
  icon: string
  challengeDescription: string
  challengeDescriptionEn: string
  showChallengeDescription: boolean
  prize: string
  targetGroup: string
  targetGroupEn: string
}

export function AdminCategoriesPage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const isCategoryPartner = user?.role === "category_partner"
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<EditFormState>({
    name: "",
    nameEn: "",
    description: "",
    descriptionEn: "",
    partnerName: "",
    partnerNameEn: "",
    color: "#530A5D",
    icon: "sparkles",
    challengeDescription: "",
    challengeDescriptionEn: "",
    showChallengeDescription: false,
    prize: "",
    targetGroup: "",
    targetGroupEn: ""
  })
  const [saved, setSaved] = useState(false)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: "",
    nameEn: "",
    slug: "",
    description: "",
    descriptionEn: "",
    partnerName: "",
    partnerNameEn: "",
    color: "#530A5D",
    icon: "sparkles"
  })

  const text =
    language === "en"
      ? {
          heading: "CATEGORIES",
          subtitle: "Manage hackathon categories and challenges",
          editTitle: "Edit category",
          editDescription:
            "Update title, partner, icon, color, and the category and challenge description for",
          germanSection: "German",
          englishSection: "English",
          titleLabel: "Title",
          titlePlaceholder: "Category title",
          partnerLabel: "Partner",
          partnerPlaceholder: "Partner name",
          iconLabel: "Icon",
          iconPlaceholder: "Choose icon",
          colorLabel: "Color",
          descriptionLabel: "Description",
          descriptionPlaceholder: "Describe this category and its challenge context...",
          challengeToggleLabel: "Show challenge description",
          challengeToggleHint:
            "If enabled, a challenge description is shown in the public category detail view.",
          challengeDescriptionLabel: "Challenge description",
          challengeDescriptionPlaceholder: "Concrete challenge statement, goals, and constraints...",
          previewLabel: "Preview",
          previewHint: "Preview follows the currently selected admin language.",
          partnerPreviewLabel: "Partner",
          challengePreviewLabel: "Challenge",
          prizeLabel: "Prize money (category-level)",
          prizePlaceholder: "e.g. CHF 500",
          prizeHint: "Shown publicly only for categories without individual challenges.",
          targetGroupLabel: "Target audience",
          targetGroupPlaceholder: "e.g. Students, professionals, ...",
          targetGroupPlaceholderEn: "e.g. Students, professionals, ...",
          save: "Save",
          saving: "Saving...",
          saved: "Saved successfully",
          required: "All German and English category fields are required",
          challengeRequired:
            "If challenge description is enabled, both German and English texts are required",
          loadError: "Failed to load categories",
          saveSuccess: "Category updated",
          saveError: "Failed to save",
          noCategories: "No categories found"
        }
      : {
          heading: "KATEGORIEN",
          subtitle: "Hackathon-Kategorien und Challenges verwalten",
          editTitle: "Kategorie bearbeiten",
          editDescription:
            "Aktualisiere Titel, Partner, Icon, Farbe sowie Kategorie- und Challenge-Beschrieb für",
          germanSection: "Deutsch",
          englishSection: "Englisch",
          titleLabel: "Titel",
          titlePlaceholder: "Name der Kategorie",
          partnerLabel: "Partner",
          partnerPlaceholder: "Partnername",
          iconLabel: "Icon",
          iconPlaceholder: "Icon wählen",
          colorLabel: "Farbe",
          descriptionLabel: "Beschreibung",
          descriptionPlaceholder: "Beschreibe diese Kategorie und ihre Herausforderungen...",
          challengeToggleLabel: "Challenge-Beschrieb anzeigen",
          challengeToggleHint:
            "Wenn aktiv, wird auf der öffentlichen Kategorie-Detailansicht zusätzlich ein Challenge-Beschrieb angezeigt.",
          challengeDescriptionLabel: "Challenge-Beschrieb",
          challengeDescriptionPlaceholder:
            "Konkrete Aufgabenstellung, Ziele und Rahmenbedingungen der Challenge...",
          previewLabel: "Vorschau",
          previewHint: "Die Vorschau folgt der aktuell gewählten Admin-Sprache.",
          partnerPreviewLabel: "Partner",
          challengePreviewLabel: "Challenge",
          prizeLabel: "Preisgeld (Kategorie-Ebene)",
          prizePlaceholder: "z.B. CHF 500",
          prizeHint: "Wird öffentlich nur für Kategorien ohne eigene Challenges angezeigt.",
          targetGroupLabel: "Zielgruppe",
          targetGroupPlaceholder: "z.B. Studierende, Berufstätige, ...",
          targetGroupPlaceholderEn: "e.g. Students, professionals, ...",
          save: "Speichern",
          saving: "Wird gespeichert...",
          saved: "Erfolgreich gespeichert!",
          required: "Alle deutschen und englischen Kategorie-Felder sind erforderlich",
          challengeRequired:
            "Wenn der Challenge-Beschrieb aktiviert ist, sind deutsche und englische Texte erforderlich",
          loadError: "Fehler beim Laden der Kategorien",
          saveSuccess: "Kategorie aktualisiert",
          saveError: "Fehler beim Speichern",
          noCategories: "Keine Kategorien gefunden"
        }

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/admin/categories", {
          credentials: "include"
        })
        if (res.ok) {
          const data = await res.json()
          setCategories(data.data?.categories || [])
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error)
        toast.error(text.loadError)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const updateEditForm = (field: keyof EditFormState, value: string) => {
    setEditForm((current) => ({ ...current, [field]: value }))
  }

  // Save category content
  const handleSaveCategory = async (categoryId: string) => {
    if (
      !editForm.name.trim() ||
      !editForm.nameEn.trim() ||
      !editForm.description.trim() ||
      !editForm.descriptionEn.trim() ||
      !editForm.partnerName.trim() ||
      !editForm.partnerNameEn.trim()
    ) {
      toast.error(text.required)
      return
    }

    if (
      editForm.showChallengeDescription &&
      (!editForm.challengeDescription.trim() || !editForm.challengeDescriptionEn.trim())
    ) {
      toast.error(text.challengeRequired)
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: categoryId,
          name: editForm.name,
          nameEn: editForm.nameEn,
          description: editForm.description,
          descriptionEn: editForm.descriptionEn,
          partnerName: editForm.partnerName,
          partnerNameEn: editForm.partnerNameEn,
          color: normalizeHexColor(editForm.color),
          icon: editForm.icon,
          challengeDescription: editForm.challengeDescription,
          challengeDescriptionEn: editForm.challengeDescriptionEn,
          showChallengeDescription: editForm.showChallengeDescription,
          prize: editForm.prize || null,
          targetGroup: editForm.targetGroup || null,
          targetGroupEn: editForm.targetGroupEn || null
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Fehler beim Speichern")
      }

      setSaved(true)
      toast.success(text.saveSuccess)

      // Update local state
      setCategories(
        categories.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                name: editForm.name,
                name_en: editForm.nameEn,
                description: editForm.description,
                description_en: editForm.descriptionEn,
                partner_name: editForm.partnerName,
                partner_name_en: editForm.partnerNameEn,
                color: normalizeHexColor(editForm.color),
                icon: editForm.icon,
                challenge_description: editForm.challengeDescription,
                challenge_description_en: editForm.challengeDescriptionEn,
                show_challenge_description: editForm.showChallengeDescription,
                prize: editForm.prize || null,
                target_group: editForm.targetGroup || null,
                target_group_en: editForm.targetGroupEn || null
              }
            : category
        )
      )

      setTimeout(() => {
        setSaved(false)
        setEditingId(null)
      }, 2000)
    } catch (error) {
      console.error("Failed to save category:", error)
      toast.error(error instanceof Error ? error.message : text.saveError)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!createForm.name.trim()) {
      toast.error(
        language === "en" ? "German category name required" : "Deutscher Kategoriename erforderlich"
      )
      return
    }
    if (!createForm.slug.trim()) {
      toast.error(language === "en" ? "Slug required" : "Slug erforderlich")
      return
    }
    try {
      setCreating(true)
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: createForm.name,
          nameEn: createForm.nameEn || null,
          slug: createForm.slug,
          description: createForm.description || null,
          descriptionEn: createForm.descriptionEn || null,
          partnerName: createForm.partnerName || null,
          partnerNameEn: createForm.partnerNameEn || null,
          color: normalizeHexColor(createForm.color),
          icon: createForm.icon || null
        })
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || text.saveError)
        return
      }
      const data = await res.json()
      setCategories((prev) => [...prev, data.data.category])
      toast.success(language === "en" ? "Category created" : "Kategorie erstellt")
      setCreateDialogOpen(false)
      setCreateForm({
        name: "",
        nameEn: "",
        slug: "",
        description: "",
        descriptionEn: "",
        partnerName: "",
        partnerNameEn: "",
        color: "#530A5D",
        icon: "sparkles"
      })
    } catch {
      toast.error(text.saveError)
    } finally {
      setCreating(false)
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground font-display text-3xl font-bold">{text.heading}</h1>
          <p className="text-muted-foreground mt-2">{text.subtitle}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {language === "en" ? "New Category" : "Neue Kategorie"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {categories?.length > 0 ? (
          categories
            .filter((category) => !isCategoryPartner || category.id === user?.categoryId)
            .map((category) => (
              <Card key={category.id} className="overflow-hidden">
                <div className="h-2" style={{ backgroundColor: getCategoryPresentation(category).color }} />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {(() => {
                        const presentation = getCategoryPresentationByLanguage(category, language)
                        const Icon = presentation.icon

                        return (
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-lg"
                            style={{
                              backgroundColor: hexToRgba(presentation.color, 0.14),
                              color: presentation.color
                            }}>
                            <Icon className="h-6 w-6" />
                          </div>
                        )
                      })()}
                      <div>
                        <CardTitle>{getCategoryPresentationByLanguage(category, language).title}</CardTitle>
                        <CardDescription>{category.slug}</CardDescription>
                      </div>
                    </div>
                    {(!isCategoryPartner || category.id === user?.categoryId) && (
                      <Dialog
                        open={editingId === category.id}
                        onOpenChange={(open) => {
                          if (open) {
                            const presentation = getCategoryPresentation(category)
                            setEditingId(category.id)
                            setEditForm({
                              name: category.name,
                              nameEn: category.name_en || "",
                              description: category.description || "",
                              descriptionEn: category.description_en || "",
                              partnerName: category.partner_name || "",
                              partnerNameEn: category.partner_name_en || "",
                              color: presentation.color,
                              icon: presentation.iconName,
                              challengeDescription: category.challenge_description || "",
                              challengeDescriptionEn: category.challenge_description_en || "",
                              showChallengeDescription: Boolean(category.show_challenge_description),
                              prize: category.prize || "",
                              targetGroup: category.target_group || "",
                              targetGroupEn: category.target_group_en || ""
                            })
                          } else {
                            setEditingId(null)
                          }
                        }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>{text.editTitle}</DialogTitle>
                            <DialogDescription>
                              {text.editDescription} &quot;
                              {getCategoryPresentationByLanguage(category, language).title}&quot;
                            </DialogDescription>
                          </DialogHeader>

                          {saved ? (
                            <div className="flex flex-col items-center justify-center py-8">
                              <Check className="mb-4 h-12 w-12 text-green-500" />
                              <p>{text.saved}</p>
                            </div>
                          ) : (
                            <div className="space-y-4 pr-1">
                              <div className="grid gap-4 lg:grid-cols-2">
                                <div className="space-y-4 rounded-lg border p-4">
                                  <p className="text-sm font-semibold">{text.germanSection}</p>
                                  <div>
                                    <Label htmlFor="name">{text.titleLabel}</Label>
                                    <Input
                                      id="name"
                                      value={editForm.name}
                                      onChange={(e) => updateEditForm("name", e.target.value)}
                                      placeholder="Name der Kategorie"
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="partnerName">{text.partnerLabel}</Label>
                                    <Input
                                      id="partnerName"
                                      value={editForm.partnerName}
                                      onChange={(e) => updateEditForm("partnerName", e.target.value)}
                                      placeholder="Partnername"
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="description">{text.descriptionLabel}</Label>
                                    <Textarea
                                      id="description"
                                      value={editForm.description}
                                      onChange={(e) => updateEditForm("description", e.target.value)}
                                      placeholder="Beschreibe diese Kategorie und ihre Herausforderungen..."
                                      rows={6}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-4 rounded-lg border p-4">
                                  <p className="text-sm font-semibold">{text.englishSection}</p>
                                  <div>
                                    <Label htmlFor="nameEn">Title</Label>
                                    <Input
                                      id="nameEn"
                                      value={editForm.nameEn}
                                      onChange={(e) => updateEditForm("nameEn", e.target.value)}
                                      placeholder="Category title"
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="partnerNameEn">Partner</Label>
                                    <Input
                                      id="partnerNameEn"
                                      value={editForm.partnerNameEn}
                                      onChange={(e) => updateEditForm("partnerNameEn", e.target.value)}
                                      placeholder="Partner name"
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="descriptionEn">Description</Label>
                                    <Textarea
                                      id="descriptionEn"
                                      value={editForm.descriptionEn}
                                      onChange={(e) => updateEditForm("descriptionEn", e.target.value)}
                                      placeholder="Describe this category and its challenge context..."
                                      rows={6}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
                                <div>
                                  <Label htmlFor="icon">{text.iconLabel}</Label>
                                  <Select
                                    value={editForm.icon}
                                    onValueChange={(value) => updateEditForm("icon", value)}>
                                    <SelectTrigger id="icon">
                                      <SelectValue placeholder={text.iconPlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {categoryIconOptions.map((option) => {
                                        const Icon = categoryIconMap[option.value]

                                        return (
                                          <SelectItem key={option.value} value={option.value}>
                                            <span className="flex items-center gap-2">
                                              <Icon className="h-4 w-4" />
                                              <span>{option.label}</span>
                                            </span>
                                          </SelectItem>
                                        )
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="color">{text.colorLabel}</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      id="color"
                                      type="color"
                                      value={normalizeHexColor(editForm.color)}
                                      onChange={(e) => updateEditForm("color", e.target.value)}
                                      className="h-10 w-14 p-1"
                                    />
                                    <Input
                                      value={editForm.color}
                                      onChange={(e) => updateEditForm("color", e.target.value)}
                                      placeholder="#530A5D"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4 rounded-lg border p-4">
                                <div className="flex items-center justify-between gap-4">
                                  <div>
                                    <Label htmlFor="showChallengeDescription">
                                      {text.challengeToggleLabel}
                                    </Label>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                      {text.challengeToggleHint}
                                    </p>
                                  </div>
                                  <Switch
                                    id="showChallengeDescription"
                                    checked={editForm.showChallengeDescription}
                                    onCheckedChange={(checked) =>
                                      setEditForm((current) => ({
                                        ...current,
                                        showChallengeDescription: Boolean(checked)
                                      }))
                                    }
                                  />
                                </div>

                                <div className="grid gap-4 lg:grid-cols-2">
                                  <div>
                                    <Label htmlFor="challengeDescription">
                                      {text.challengeDescriptionLabel} ({text.germanSection})
                                    </Label>
                                    <Textarea
                                      id="challengeDescription"
                                      value={editForm.challengeDescription}
                                      onChange={(e) => updateEditForm("challengeDescription", e.target.value)}
                                      placeholder="Konkrete Aufgabenstellung, Ziele und Rahmenbedingungen der Challenge..."
                                      rows={5}
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="challengeDescriptionEn">
                                      {text.challengeDescriptionLabel} ({text.englishSection})
                                    </Label>
                                    <Textarea
                                      id="challengeDescriptionEn"
                                      value={editForm.challengeDescriptionEn}
                                      onChange={(e) =>
                                        updateEditForm("challengeDescriptionEn", e.target.value)
                                      }
                                      placeholder="Concrete challenge statement, goals, and constraints..."
                                      rows={5}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <Label htmlFor="prize">{text.prizeLabel}</Label>
                                  <Input
                                    id="prize"
                                    value={editForm.prize}
                                    onChange={(e) => updateEditForm("prize", e.target.value)}
                                    placeholder={text.prizePlaceholder}
                                  />
                                  <p className="text-muted-foreground mt-1 text-xs">{text.prizeHint}</p>
                                </div>
                                <div />
                                <div>
                                  <Label htmlFor="targetGroup">
                                    {text.targetGroupLabel} ({text.germanSection})
                                  </Label>
                                  <Input
                                    id="targetGroup"
                                    value={editForm.targetGroup}
                                    onChange={(e) => updateEditForm("targetGroup", e.target.value)}
                                    placeholder={text.targetGroupPlaceholder}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="targetGroupEn">
                                    {text.targetGroupLabel} ({text.englishSection})
                                  </Label>
                                  <Input
                                    id="targetGroupEn"
                                    value={editForm.targetGroupEn}
                                    onChange={(e) => updateEditForm("targetGroupEn", e.target.value)}
                                    placeholder={text.targetGroupPlaceholderEn}
                                  />
                                </div>
                              </div>

                              <div
                                className="rounded-xl border p-4"
                                style={{
                                  backgroundColor: normalizeHexColor(editForm.color),
                                  color: getCategoryPresentationByLanguage(
                                    {
                                      slug: category.slug,
                                      name: editForm.name,
                                      name_en: editForm.nameEn,
                                      description: editForm.description,
                                      description_en: editForm.descriptionEn,
                                      partner_name: editForm.partnerName,
                                      partner_name_en: editForm.partnerNameEn,
                                      challenge_description: editForm.challengeDescription,
                                      challenge_description_en: editForm.challengeDescriptionEn,
                                      color: editForm.color,
                                      icon: editForm.icon,
                                      show_challenge_description: editForm.showChallengeDescription
                                    },
                                    language
                                  ).textColor
                                }}>
                                {(() => {
                                  const preview = getCategoryPresentationByLanguage(
                                    {
                                      slug: category.slug,
                                      name: editForm.name,
                                      name_en: editForm.nameEn,
                                      description: editForm.description,
                                      description_en: editForm.descriptionEn,
                                      partner_name: editForm.partnerName,
                                      partner_name_en: editForm.partnerNameEn,
                                      challenge_description: editForm.challengeDescription,
                                      challenge_description_en: editForm.challengeDescriptionEn,
                                      show_challenge_description: editForm.showChallengeDescription,
                                      color: editForm.color,
                                      icon: editForm.icon
                                    },
                                    language
                                  )
                                  const Icon = preview.icon

                                  return (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <Icon className="h-5 w-5" />
                                        <p className="font-semibold">{text.previewLabel}</p>
                                      </div>
                                      <p className="text-xs opacity-75">{text.previewHint}</p>
                                      <div>
                                        <p className="font-display text-xl font-bold">{preview.title}</p>
                                        <p className="mt-2 text-sm opacity-90">{preview.description}</p>
                                        {preview.showChallengeDescription && preview.challengeDescription ? (
                                          <p className="mt-2 text-sm opacity-85">
                                            {text.challengePreviewLabel}: {preview.challengeDescription}
                                          </p>
                                        ) : null}
                                        <p className="mt-3 text-xs opacity-75">
                                          {text.partnerPreviewLabel}: {preview.partnerName}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                })()}
                              </div>

                              <Button
                                onClick={() => handleSaveCategory(category.id)}
                                disabled={saving}
                                className="bg-violet hover:bg-violet/90 w-full">
                                {saving ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {text.saving}
                                  </>
                                ) : (
                                  text.save
                                )}
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-sm font-medium">
                    {text.partnerPreviewLabel}:{" "}
                    {getCategoryPresentationByLanguage(category, language).partnerName}
                  </p>
                  <p className="text-muted-foreground line-clamp-3 text-sm">
                    {getCategoryPresentationByLanguage(category, language).description}
                  </p>
                  {getCategoryPresentationByLanguage(category, language).showChallengeDescription &&
                  getCategoryPresentationByLanguage(category, language).challengeDescription ? (
                    <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">
                      {text.challengePreviewLabel}:{" "}
                      {getCategoryPresentationByLanguage(category, language).challengeDescription}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">{text.noCategories}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create category dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === "en" ? "New Category" : "Neue Kategorie"}</DialogTitle>
            <DialogDescription>
              {language === "en"
                ? "Create a new hackathon category. You can add more details after creation."
                : "Neue Hackathon-Kategorie erstellen. Weitere Details können nach der Erstellung ergänzt werden."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-semibold">{text.germanSection}</p>
                <div>
                  <Label>{text.titleLabel} *</Label>
                  <Input
                    value={createForm.name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder={language === "en" ? "Category name (DE)" : "Kategoriename (DE)"}
                  />
                </div>
                <div>
                  <Label>{text.partnerLabel}</Label>
                  <Input
                    value={createForm.partnerName}
                    onChange={(e) => setCreateForm((f) => ({ ...f, partnerName: e.target.value }))}
                    placeholder={language === "en" ? "Partner name (DE)" : "Partnername (DE)"}
                  />
                </div>
                <div>
                  <Label>{text.descriptionLabel}</Label>
                  <Textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder={language === "en" ? "Description (DE)" : "Beschreibung (DE)"}
                    rows={3}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold">{text.englishSection}</p>
                <div>
                  <Label>Title (EN)</Label>
                  <Input
                    value={createForm.nameEn}
                    onChange={(e) => setCreateForm((f) => ({ ...f, nameEn: e.target.value }))}
                    placeholder="Category name (EN)"
                  />
                </div>
                <div>
                  <Label>Partner (EN)</Label>
                  <Input
                    value={createForm.partnerNameEn}
                    onChange={(e) => setCreateForm((f) => ({ ...f, partnerNameEn: e.target.value }))}
                    placeholder="Partner name (EN)"
                  />
                </div>
                <div>
                  <Label>Description (EN)</Label>
                  <Textarea
                    value={createForm.descriptionEn}
                    onChange={(e) => setCreateForm((f) => ({ ...f, descriptionEn: e.target.value }))}
                    placeholder="Description (EN)"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
              <div>
                <Label>Slug *</Label>
                <Input
                  value={createForm.slug}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                    }))
                  }
                  placeholder="young-talents"
                />
              </div>
              <div>
                <Label>{text.iconLabel}</Label>
                <Select
                  value={createForm.icon}
                  onValueChange={(v) => setCreateForm((f) => ({ ...f, icon: v }))}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryIconOptions.map((option) => {
                      const Icon = categoryIconMap[option.value]
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{text.colorLabel}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={normalizeHexColor(createForm.color)}
                    onChange={(e) => setCreateForm((f) => ({ ...f, color: e.target.value }))}
                    className="h-10 w-14 p-1"
                  />
                  <Input
                    value={createForm.color}
                    onChange={(e) => setCreateForm((f) => ({ ...f, color: e.target.value }))}
                    placeholder="#530A5D"
                    className="w-28"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
                {text.saving === "Wird gespeichert..." ? "Abbrechen" : "Cancel"}
              </Button>
              <Button onClick={handleCreateCategory} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {language === "en" ? "Create" : "Erstellen"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
