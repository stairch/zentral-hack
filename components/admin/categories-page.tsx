"use client"

import { useEffect, useRef, useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { ArrowDown, ArrowUp, Edit2, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import {
  categoryIconMap,
  categoryIconOptions,
  getCategoryPresentation,
  getCategoryPresentationByLanguage
} from "@/lib/category-config"
import { useLanguage } from "@/lib/language-context"
import { getContrastForegroundColor, normalizeHexColor } from "@/lib/helpers"
import { useAuth } from "@/lib/auth-context"
import ColorPicker from "../ui/color-picker"

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
  prize?: string | null
  prize_en?: string | null
  target_group?: string | null
  target_group_en?: string | null
  display_order?: number | null
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
  prize: string
  prizeEn: string
  targetGroup: string
  targetGroupEn: string
}

export function AdminCategoriesPage() {
  const { language, isReady } = useLanguage()
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
    prize: "",
    prizeEn: "",
    targetGroup: "",
    targetGroupEn: ""
  })
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [layout, setLayout] = useState<"standard" | "bento">("standard")
  const [layoutSaving, setLayoutSaving] = useState(false)
  const [reorderingId, setReorderingId] = useState<string | null>(null)
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
          prizeLabel: "Prize money (category-level) German",
          prizeLabelEn: "Prize money (category-level) English",
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
          noCategories: "No categories found",
          layoutSectionTitle: "Landing page layout",
          layoutSectionHint:
            "Choose how the category cards are arranged in the “Choose your category” section.",
          layoutStandardLabel: "Standard (uniform)",
          layoutBentoLabel: "Featured",
          layoutSaved: "Layout updated",
          layoutSaveError: "Failed to update layout",
          orderLabel: "Order",
          moveUp: "Move up",
          moveDown: "Move down",
          orderSaveError: "Failed to change order"
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
          prizeLabel: "Preisgeld (Kategorie-Ebene) Deutsch",
          prizeLabelEn: "Preisgeld (Kategorie-Ebene) Englisch",
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
          noCategories: "Keine Kategorien gefunden",
          layoutSectionTitle: "Layout der Landing Page",
          layoutSectionHint:
            "Bestimme, wie die Kategorie-Karten im Bereich «Wähle deine Kategorie» angeordnet werden.",
          layoutStandardLabel: "Standard (gleichmässig)",
          layoutBentoLabel: "Hervorgehoben",
          layoutSaved: "Layout aktualisiert",
          layoutSaveError: "Layout konnte nicht aktualisiert werden",
          orderLabel: "Reihenfolge",
          moveUp: "Nach oben",
          moveDown: "Nach unten",
          orderSaveError: "Reihenfolge konnte nicht geändert werden"
        }

  const hasDataFetched = useRef(false)

  // Fetch categories
  useEffect(() => {
    if (!isReady || hasDataFetched.current) return
    hasDataFetched.current = true
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

        const layoutRes = await fetch("/api/site-settings?key=categories_layout")
        if (layoutRes.ok) {
          const layoutData = await layoutRes.json()
          if (layoutData.data?.value === "bento" || layoutData.data?.value === "standard") {
            setLayout(layoutData.data.value)
          }
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error)
        toast.error(text.loadError)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [isReady])

  const updateEditForm = (field: keyof EditFormState, value: string) => {
    setEditForm((current) => ({ ...current, [field]: value }))
  }

  // Persist the landing page layout choice into the shared site_settings store.
  const handleLayoutChange = async (bento: boolean) => {
    const next: "standard" | "bento" = bento ? "bento" : "standard"
    const previous = layout
    setLayout(next)
    try {
      setLayoutSaving(true)
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key: "categories_layout", value: next })
      })
      if (!res.ok) throw new Error("failed")
      toast.success(text.layoutSaved)
    } catch {
      setLayout(previous)
      toast.error(text.layoutSaveError)
    } finally {
      setLayoutSaving(false)
    }
  }

  // Swap the display_order of a category with its neighbour (admin only).
  const handleMove = async (categoryId: string, direction: "up" | "down") => {
    const ordered = [...categories].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    const idx = ordered.findIndex((c) => c.id === categoryId)
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (idx === -1 || swapIdx < 0 || swapIdx >= ordered.length) return

    const current = ordered[idx]
    const sibling = ordered[swapIdx]
    const currentOrder = current.display_order ?? idx
    const siblingOrder = sibling.display_order ?? swapIdx

    // Optimistic reorder
    setCategories((prev) =>
      prev.map((c) =>
        c.id === current.id
          ? { ...c, display_order: siblingOrder }
          : c.id === sibling.id
            ? { ...c, display_order: currentOrder }
            : c
      )
    )

    try {
      setReorderingId(categoryId)
      const responses = await Promise.all([
        fetch("/api/admin/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: current.id, displayOrder: siblingOrder })
        }),
        fetch("/api/admin/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: sibling.id, displayOrder: currentOrder })
        })
      ])
      if (responses.some((r) => !r.ok)) throw new Error("failed")
    } catch {
      // Revert on failure
      setCategories((prev) =>
        prev.map((c) =>
          c.id === current.id
            ? { ...c, display_order: currentOrder }
            : c.id === sibling.id
              ? { ...c, display_order: siblingOrder }
              : c
        )
      )
      toast.error(text.orderSaveError)
    } finally {
      setReorderingId(null)
    }
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
          prize: editForm.prize || null,
          prizeEn: editForm.prizeEn || null,
          targetGroup: editForm.targetGroup || null,
          targetGroupEn: editForm.targetGroupEn || null
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Fehler beim Speichern")
      }

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
                prize: editForm.prize || null,
                prize_en: editForm.prizeEn || null,
                target_group: editForm.targetGroup || null,
                target_group_en: editForm.targetGroupEn || null
              }
            : category
        )
      )
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-foreground font-display text-3xl font-bold">{text.heading}</h1>
          <p className="text-muted-foreground mt-2">{text.subtitle}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full shrink-0 gap-2 sm:w-auto">
            <Plus className="h-4 w-4" />
            {language === "en" ? "New Category" : "Neue Kategorie"}
          </Button>
        )}
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{text.layoutSectionTitle}</CardTitle>
            <CardDescription>{text.layoutSectionHint}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm ${layout === "standard" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {text.layoutStandardLabel}
              </span>
              <Switch
                checked={layout === "bento"}
                disabled={layoutSaving}
                onCheckedChange={handleLayoutChange}
                aria-label={text.layoutSectionTitle}
              />
              <span
                className={`text-sm ${layout === "bento" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {text.layoutBentoLabel}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {categories?.length > 0 ? (
          [...categories]
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .filter((category) => !isCategoryPartner || category.id === user?.categoryId)
            .map((category, index, arr) => (
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
                              backgroundColor: presentation.color,
                              color: presentation.color
                            }}>
                            <Icon
                              className="h-6 w-6"
                              style={{ color: getContrastForegroundColor(presentation.color) }}
                            />
                          </div>
                        )
                      })()}
                      <div>
                        <CardTitle>{getCategoryPresentationByLanguage(category, language).title}</CardTitle>
                        <CardDescription>{category.slug}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={index === 0 || reorderingId === category.id}
                            aria-label={text.moveUp}
                            onClick={() => handleMove(category.id, "up")}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={index === arr.length - 1 || reorderingId === category.id}
                            aria-label={text.moveDown}
                            onClick={() => handleMove(category.id, "down")}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </>
                      )}
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
                                prize: category.prize || "",
                                prizeEn: category.prize_en || "",
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

                            <div className="space-y-6 pr-1">
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

                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <Label htmlFor="color">{text.colorLabel}</Label>
                                  <ColorPicker
                                    current={normalizeHexColor(editForm.color)}
                                    onChange={(color) => updateEditForm("color", color)}
                                    onPresetClick={(color) => updateEditForm("color", color)}
                                    withPresets
                                  />
                                </div>
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
                                <div>
                                  <Label htmlFor="prize">{text.prizeLabelEn}</Label>
                                  <Input
                                    id="prize"
                                    value={editForm.prizeEn}
                                    onChange={(e) => updateEditForm("prizeEn", e.target.value)}
                                    placeholder={text.prizePlaceholder}
                                  />
                                  <p className="text-muted-foreground mt-1 text-xs">{text.prizeHint}</p>
                                </div>
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
                              <Button
                                onClick={() => handleSaveCategory(category.id)}
                                disabled={saving}
                                className="bg-violet hover:bg-violet/90 mt-5 w-full">
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
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
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
