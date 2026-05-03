"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Plus, Trash2, Edit2, Upload, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import Image from "next/image"

interface PartnerLogo {
  id: string
  name: string
  logo_url: string
  website_url: string | null
  logo_size: "small" | "medium" | "large"
  sort_order: number
  is_active: boolean
}

const SIZE_LABELS_DE = { small: "Klein (w-20)", medium: "Mittel (w-28)", large: "Gross (w-36)" }
const SIZE_LABELS_EN = { small: "Small (w-20)", medium: "Medium (w-28)", large: "Large (w-36)" }

const copy = {
  de: {
    heading: "PARTNER-LOGOS",
    subtitle: "Co-Organisatoren und Partner verwalten",
    newLogo: "Neues Logo",
    noLogos: "Keine Logos vorhanden.",
    noLink: "Kein Link",
    hide: "Ausblenden",
    show: "Einblenden",
    editDialog: "Logo bearbeiten",
    newDialog: "Neues Logo",
    name: "Name",
    namePlaceholder: "HSLU",
    logo: "Logo",
    preview: "Vorschau",
    logoPlaceholder: "/partners/logo.png oder https://...",
    logoHint: "Datei hochladen (PNG, JPG, max. 5 MB)",
    websiteLabel: "Website-Link",
    websitePlaceholder: "https://example.com",
    sizeLabel: "Grösse",
    cancel: "Abbrechen",
    save: "Speichern",
    deleteTitle: "Logo löschen?",
    deleteWarning: "Diese Aktion kann nicht rückgängig gemacht werden.",
    delete: "Löschen",
    loadError: "Fehler beim Laden",
    uploadSuccess: "Bild hochgeladen",
    uploadError: "Upload fehlgeschlagen",
    validationError: "Name und Logo-URL sind erforderlich",
    updated: "Aktualisiert",
    added: "Hinzugefügt",
    saveError: "Fehler beim Speichern",
    toggleError: "Fehler",
    deleted: "Gelöscht",
    deleteError: "Fehler beim Löschen",
    upload: "Bild hochladen"
  },
  en: {
    heading: "PARTNER LOGOS",
    subtitle: "Manage co-organizers and partners",
    newLogo: "New Logo",
    noLogos: "No logos available.",
    noLink: "No link",
    hide: "Hide",
    show: "Show",
    editDialog: "Edit logo",
    newDialog: "New logo",
    name: "Name",
    namePlaceholder: "HSLU",
    logo: "Logo",
    preview: "Preview",
    logoPlaceholder: "/partners/logo.png or https://...",
    logoHint: "Upload file (PNG, JPG, max. 5 MB)",
    websiteLabel: "Website link",
    websitePlaceholder: "https://example.com",
    sizeLabel: "Size",
    cancel: "Cancel",
    save: "Save",
    deleteTitle: "Delete logo?",
    deleteWarning: "This action cannot be undone.",
    delete: "Delete",
    loadError: "Failed to load",
    uploadSuccess: "Image uploaded",
    uploadError: "Upload failed",
    validationError: "Name and logo URL are required",
    updated: "Updated",
    added: "Added",
    saveError: "Failed to save",
    toggleError: "Error",
    deleted: "Deleted",
    deleteError: "Failed to delete",
    upload: "Upload image"
  }
} as const

export function AdminPartnerLogosPage() {
  const { language } = useLanguage()
  const text = copy[language]
  const SIZE_LABELS = language === "en" ? SIZE_LABELS_EN : SIZE_LABELS_DE

  const [logos, setLogos] = useState<PartnerLogo[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLogo, setEditingLogo] = useState<PartnerLogo | null>(null)
  const [form, setForm] = useState({
    name: "",
    logo_url: "",
    website_url: "",
    logo_size: "medium" as "small" | "medium" | "large",
    sort_order: 0,
    is_active: true
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isNewLogo, setIsNewLogo] = useState<boolean>(false)

  useEffect(() => {
    void load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/partner-logos", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setLogos(data.data?.logos || [])
    } catch {
      toast.error(text.loadError)
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => {
    const maxOrder = Math.max(0, ...logos.map((l) => l.sort_order))
    setEditingLogo(null)
    setPreviewUrl(null)
    setForm({
      name: "",
      logo_url: "",
      website_url: "",
      logo_size: "medium",
      sort_order: maxOrder + 10,
      is_active: true
    })
    setDialogOpen(true)
  }

  const openEdit = (logo: PartnerLogo) => {
    setEditingLogo(logo)
    setPreviewUrl(`/api/partner-logo?id=${logo.id}`)
    setIsNewLogo(false)
    setForm({
      name: logo.name,
      logo_url: logo.logo_url,
      website_url: logo.website_url || "",
      logo_size: logo.logo_size,
      sort_order: logo.sort_order,
      is_active: logo.is_active
    })
    setDialogOpen(true)
  }

  const handleUpload = async (file: File) => {
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    try {
      setUploading(true)

      const fd = new FormData()
      fd.append("file", file)

      const res = await fetch("/api/admin/logo-upload", { method: "POST", credentials: "include", body: fd })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || text.uploadError)
      }

      const data = await res.json()
      setForm((f) => ({ ...f, logo_url: data.url }))
      setIsNewLogo(true)

      toast.success(text.uploadSuccess)
    } catch (error) {
      setPreviewUrl(null)
      URL.revokeObjectURL(localPreview)
      toast.error(error instanceof Error ? error.message : text.uploadError)
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (!form.name || !form.logo_url) {
      toast.error(text.validationError)
      return
    }
    try {
      setSaving(true)
      const method = editingLogo ? "PUT" : "POST"
      const body = editingLogo
        ? { ...form, id: editingLogo.id, website_url: form.website_url || null }
        : { ...form, website_url: form.website_url || null }
      const res = await fetch("/api/admin/partner-logos", {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error()
      toast.success(editingLogo ? text.updated : text.added)
      setDialogOpen(false)
      await load()
    } catch {
      toast.error(text.saveError)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (logo: PartnerLogo) => {
    try {
      await fetch("/api/admin/partner-logos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: logo.id, is_active: !logo.is_active })
      })
      setLogos((prev) => prev.map((l) => (l.id === logo.id ? { ...l, is_active: !l.is_active } : l)))
    } catch {
      toast.error(text.toggleError)
    }
  }

  const remove = async () => {
    if (!deleteId) return
    try {
      await fetch(`/api/admin/partner-logos?id=${deleteId}`, { method: "DELETE", credentials: "include" })
      toast.success(text.deleted)
      setLogos((prev) => prev.filter((l) => l.id !== deleteId))
      setDeleteId(null)
    } catch {
      toast.error(text.deleteError)
    }
  }

  const move = async (logo: PartnerLogo, direction: "up" | "down") => {
    const sorted = [...logos].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex((l) => l.id === logo.id)
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const sibling = sorted[swapIdx]
    await Promise.all([
      fetch("/api/admin/partner-logos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: logo.id, sort_order: sibling.sort_order })
      }),
      fetch("/api/admin/partner-logos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: sibling.id, sort_order: logo.sort_order })
      })
    ])
    await load()
  }

  const handleCancel = async () => {
    setDialogOpen(false)

    // if a new logo was uploaded, let's remove it again from blob to save storage
    if (isNewLogo) {
      const res = await fetch("/api/admin/logo-upload", {
        method: "DELETE",
        credentials: "include",
        body: JSON.stringify({ url: form.logo_url })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
    }
  }

  const sortedLogos = [...logos].sort((a, b) => a.sort_order - b.sort_order)

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">{text.heading}</h1>
          <p className="text-muted-foreground mt-2">{text.subtitle}</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          {text.newLogo}
        </Button>
      </div>

      <div className="space-y-3">
        {sortedLogos.length === 0 && <p className="text-muted-foreground py-8 text-center">{text.noLogos}</p>}
        {sortedLogos.map((logo, index) => (
          <Card key={logo.id} className={logo.is_active ? "" : "opacity-50"}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => move(logo, "up")}
                  disabled={index === 0}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => move(logo, "down")}
                  disabled={index === sortedLogos.length - 1}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg border bg-white p-2">
                <Image
                  src={`/api/partner-logo?id=${logo.id}`}
                  alt={logo.name}
                  width={100}
                  height={60}
                  className="h-auto max-h-10 max-w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{logo.name}</p>
                <p className="text-muted-foreground text-xs">
                  {logo.website_url || text.noLink} · {SIZE_LABELS[logo.logo_size]}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleActive(logo)}
                  title={logo.is_active ? text.hide : text.show}>
                  {logo.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(logo)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => setDeleteId(logo.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLogo ? text.editDialog : text.newDialog}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{text.name}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={text.namePlaceholder}
              />
            </div>
            <div>
              <Label>{text.logo}</Label>
              <div className="space-y-2">
                {previewUrl && (
                  <div className="flex h-16 w-full items-center justify-center rounded-lg border bg-white p-2">
                    <Image
                      src={previewUrl}
                      alt={text.preview}
                      width={400}
                      height={50}
                      className="h-auto max-h-12 max-w-full object-contain"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}>
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{text.upload}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>{text.upload}</span>
                      </>
                    )}
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void handleUpload(f)
                    e.target.value = ""
                  }}
                />
                <p className="text-muted-foreground text-xs">{text.logoHint}</p>
              </div>
            </div>
            <div>
              <Label>{text.websiteLabel}</Label>
              <Input
                value={form.website_url}
                onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
                placeholder={text.websitePlaceholder}
              />
            </div>
            <div>
              <Label>{text.sizeLabel}</Label>
              <Select
                value={form.logo_size}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, logo_size: v as "small" | "medium" | "large" }))
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SIZE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              {text.cancel}
            </Button>
            <Button onClick={save} disabled={saving || uploading}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {text.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {text.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
