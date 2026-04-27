"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import ColorPicker from "../ui/color-picker"
import {
  Edit2,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  Globe,
  Building2,
  User,
  Mail,
  Tag,
  Phone,
  GlobeOff
} from "lucide-react"
import { toast } from "sonner"
import { isValidUrl } from "@/lib/helpers"
import { motion } from "framer-motion"
import { useLanguage } from "@/lib/language-context"

type SponsorPackage = {
  id: string
  name: string
  description: string | null
  color: string | null
  benefits: string[] | null
  display_order: number
  created_at: string
}

type SponsorContact = {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string | null
  interested_in: string | null
  message: string | null
  status: string
  created_at: string
  logo_url: string | null
  website_url: string | null
  logo_size: "small" | "medium" | "large" | null
  tier: "platin" | "gold" | "silber" | "bronze" | null
  logo_bg_color: string | null
}

interface EditForm {
  id?: string
  name: string
  displayOrder: string
  color: string
  description: string
  benefitsText: string
}

const emptyForm: EditForm = {
  name: "",
  displayOrder: "",
  color: "#530A5D",
  description: "",
  benefitsText: ""
}

const STATUS_ORDER = ["new", "contacted", "confirmed", "published", "rejected"]

interface PublishFormData {
  logoUrl: string
  websiteUrl: string
  logoBgColor: string | null
  logoSize: "small" | "medium" | "large"
  tier: "platin" | "gold" | "silber" | "bronze"
}

const STATUS_CLASSES = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  published: "bg-purple-100 text-purple-800"
}

const copy = {
  de: {
    pageTitle: "SPONSOREN",
    pageDescription: "Sponsorpakete und Sponsoranfragen verwalten",
    packagesTitle: "Sponsorpakete",
    packagesDescription: "Alle Felder inklusive Farbe, Reihenfolge und Benefits sind editierbar.",
    newPackageButton: "Neues Paket",
    packageCardColorLabel: "Farbe",
    packageCardNoDescription: "Keine Beschreibung",
    packageCardMoreBenefits: (count: number) => `+ ${count} weitere`,
    packageCardEditButton: "Bearbeiten",
    requestsTitle: "Alle Anfragen",
    requestsCount: (count: number) => `${count} Anfragen insgesamt`,
    noRequests: "Noch keine Sponsor-Anfragen",
    requestStatusLabels: {
      new: "Neu",
      contacted: "Kontaktiert",
      confirmed: "Bestätigt",
      rejected: "Abgelehnt",
      published: "Veröffentlicht"
    },
    requestStatusOptions: {
      new: "Neu",
      contacted: "Kontaktiert",
      confirmed: "Bestätigt",
      rejected: "Abgelehnt"
    },
    requestActions: {
      revertButton: "Zurückziehen",
      publishButton: "Veröffentlichen"
    },
    requestLabels: {
      contactPerson: "Ansprechperson",
      interestedIn: "Interessiert an"
    },
    packageDialog: {
      createTitle: "Sponsorpaket erstellen",
      editTitle: "Sponsorpaket bearbeiten",
      description: "Alle Inhalte werden direkt auf der Sponsoring-Seite übernommen.",
      nameLabel: "Name",
      namePlaceholder: "z.B. Gold",
      displayOrderLabel: "Display-Order",
      colorLabel: "Farbe (Hex)",
      descriptionLabel: "Beschreibung",
      benefitsLabel: "Benefits (eine Zeile pro Benefit)",
      cancelButton: "Abbrechen",
      saveButton: "Speichern",
      saveButtonLoading: "Speichern"
    },
    publishDialog: {
      title: "Sponsor veröffentlichen",
      description: (companyName: string) => `${companyName} auf der Landing Page publizieren`,
      logoUrlLabel: "Logo URL *",
      websiteUrlLabel: "Website",
      backgroundColorLabel: "Hintergrundfarbe",
      resetButton: "Zurücksetzen",
      logoSizeLabel: "Logo-Grösse",
      tierLabel: "Tier",
      previewLabel: "Vorschau",
      cancelButton: "Abbrechen",
      publishButton: "Veröffentlichen",
      publishButtonLoading: "Veröffentlichen",
      previewLogoAlt: "Logo-Vorschau"
    },
    validation: {
      logoUrlRequired: "Logo URL ist erforderlich",
      invalidUrl: "Ungültige URL"
    },
    errors: {
      fetchGeneral: "Fehler beim Laden",
      fetchPackages: "Fehler beim Laden der Sponsor-Pakete",
      fetchContacts: "Fehler beim Laden der Sponsor-Anfragen",
      packageSaveNameRequired: "Name ist erforderlich",
      packageSaveDisplayOrderRequired: "Display-Order ist erforderlich",
      packageSaveFailed: "Fehler beim Speichern",
      packageDeleteFailed: "Fehler beim Löschen",
      sponsorUpdateFailed: "Fehler beim Aktualisieren der Sponsor-Anfrage",
      sponsorPublishFailed: "Fehler beim Veröffentlichen des Sponsors"
    },
    success: {
      packageSavedCreate: "Sponsorpaket erstellt",
      packageSavedUpdate: "Sponsorpaket aktualisiert",
      packageDeleted: "Sponsorpaket gelöscht",
      sponsorSavedUpdate: "Sponsor-Anfrage aktualisiert",
      sponsorPublish: "Sponsor veröffentlicht"
    },
    publishLabels: {
      logoSize: {
        small: "Klein",
        medium: "Mittel",
        large: "Gross"
      },
      tier: {
        platin: "Platin",
        gold: "Gold",
        silber: "Silber",
        bronze: "Bronze"
      }
    }
  },
  en: {
    pageTitle: "SPONSORS",
    pageDescription: "Manage sponsor packages and sponsor inquiries",
    packagesTitle: "Sponsor packages",
    packagesDescription: "All fields including color, order, and benefits are editable.",
    newPackageButton: "New package",
    packageCardColorLabel: "Color",
    packageCardNoDescription: "No description",
    packageCardMoreBenefits: (count: number) => `+ ${count} more`,
    packageCardEditButton: "Edit",
    requestsTitle: "All inquiries",
    requestsCount: (count: number) => `${count} inquiries total`,
    noRequests: "No sponsor inquiries yet",
    requestStatusLabels: {
      new: "New",
      contacted: "Contacted",
      confirmed: "Confirmed",
      rejected: "Rejected",
      published: "Published"
    },
    requestStatusOptions: {
      new: "New",
      contacted: "Contacted",
      confirmed: "Confirmed",
      rejected: "Rejected"
    },
    requestActions: {
      revertButton: "Unpublish",
      publishButton: "Publish"
    },
    requestLabels: {
      contactPerson: "Contact person",
      interestedIn: "Interested in"
    },
    packageDialog: {
      createTitle: "Create sponsor package",
      editTitle: "Edit sponsor package",
      description: "All content is applied directly to the sponsorship page.",
      nameLabel: "Name",
      namePlaceholder: "e.g. Gold",
      displayOrderLabel: "Display order",
      colorLabel: "Color (hex)",
      descriptionLabel: "Description",
      benefitsLabel: "Benefits (one line per benefit)",
      cancelButton: "Cancel",
      saveButton: "Save",
      saveButtonLoading: "Save"
    },
    publishDialog: {
      title: "Publish sponsor",
      description: (companyName: string) => `Publish ${companyName} on the landing page`,
      logoUrlLabel: "Logo URL *",
      websiteUrlLabel: "Website",
      backgroundColorLabel: "Background color",
      resetButton: "Reset",
      logoSizeLabel: "Logo size",
      tierLabel: "Tier",
      previewLabel: "Preview",
      cancelButton: "Cancel",
      publishButton: "Publish",
      publishButtonLoading: "Publish",
      previewLogoAlt: "Logo preview"
    },
    validation: {
      logoUrlRequired: "Logo URL is required",
      invalidUrl: "Invalid URL"
    },
    errors: {
      fetchGeneral: "Error while loading",
      fetchPackages: "Error while loading sponsor packages",
      fetchContacts: "Error while loading sponsor inquiries",
      packageSaveNameRequired: "Name is required",
      packageSaveDisplayOrderRequired: "Display order is required",
      packageSaveFailed: "Error while saving",
      packageDeleteFailed: "Error while deleting",
      sponsorUpdateFailed: "Error while updating sponsor inquiry",
      sponsorPublishFailed: "Error while publishing sponsor"
    },
    success: {
      packageSavedCreate: "Sponsor package created",
      packageSavedUpdate: "Sponsor package updated",
      packageDeleted: "Sponsor package deleted",
      sponsorSavedUpdate: "Sponsor contact updated",
      sponsorPublish: "Sponsor contact published"
    },
    publishLabels: {
      logoSize: {
        small: "Small",
        medium: "Medium",
        large: "Large"
      },
      tier: {
        platin: "Platinum",
        gold: "Gold",
        silber: "Silver",
        bronze: "Bronze"
      }
    }
  }
}

const PLACEHOLDER_SPONSORS = [
  { name: "Sponsor A", logo: "https://placehold.co/130x20/e2e8f0/94a3b8?text=Sponsor A" },
  { name: "Sponsor B", logo: "https://placehold.co/110x35/e2e8f0/94a3b8?text=Sponsor B" }
]

function PreviewMarqueeRow({
  currentLogo,
  currentBgColor,
  currentLogoSize,
  currentWebsite
}: {
  currentLogo: string
  currentBgColor: string | null
  currentLogoSize: "small" | "medium" | "large"
  currentWebsite: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const logoSizeClass = currentLogoSize === "small" ? "w-20" : currentLogoSize === "medium" ? "w-28" : "w-36"

  const allItems = [
    ...PLACEHOLDER_SPONSORS,
    { name: "current", logo: currentLogo, isCurrent: true },
    ...PLACEHOLDER_SPONSORS,
    { name: "current2", logo: currentLogo, isCurrent: true }
  ]
  const duplicatedItems = [...allItems, ...allItems, ...allItems]

  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(() => {
      if (ref.current) {
        setContainerWidth(ref.current.scrollWidth / 2)
      }
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [currentLogo, currentLogoSize])

  return (
    <div className="relative overflow-hidden py-3">
      <motion.div
        ref={ref}
        className="flex gap-6"
        style={{ willChange: "transform" }}
        animate={containerWidth ? { x: [0, -containerWidth] } : {}}
        transition={{
          x: { duration: 18, repeat: Infinity, ease: "linear", repeatType: "loop" }
        }}>
        {duplicatedItems.map((item, index) => {
          const isCurrent = "isCurrent" in item && item.isCurrent
          return (
            <div
              key={`preview-${item.name}-${index}`}
              className="flex shrink-0 items-center rounded-lg px-6 py-3">
              {isCurrent ? (
                <a
                  href={currentWebsite || "#"}
                  className="rounded-xs"
                  style={{ backgroundColor: currentBgColor ?? undefined }}
                  onClick={(e) => e.preventDefault()}>
                  <img
                    src={currentLogo}
                    alt="Preview logo"
                    className={`h-auto ${logoSizeClass}`}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </a>
              ) : (
                <div className="bg-muted rounded-xs p-1">
                  <img src={item.logo} alt={item.name} className="h-auto w-20 opacity-40" />
                </div>
              )}
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}

function PublishDialog({
  contact,
  onPublish
}: {
  contact: SponsorContact
  onPublish: (id: string, data: PublishFormData) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof PublishFormData, string>>>({})
  const [form, setForm] = useState<PublishFormData>({
    logoUrl: "",
    websiteUrl: "",
    logoBgColor: null,
    logoSize: "medium",
    tier: contact.interested_in as PublishFormData["tier"]
  })
  const { language } = useLanguage()
  const text = copy[language]

  useEffect(() => {
    if (open) {
      setForm({
        logoUrl: contact.logo_url || "",
        websiteUrl: contact.website_url || "",
        logoBgColor: contact.logo_bg_color || null,
        logoSize: contact.logo_size || "medium",
        tier: contact.tier || (contact.interested_in as PublishFormData["tier"])
      })
    } else {
      setErrors({})
    }
  }, [open])

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PublishFormData, string>> = {}
    if (!form.logoUrl.trim()) {
      newErrors.logoUrl = text.validation.logoUrlRequired
    } else if (!isValidUrl(form.logoUrl)) {
      newErrors.logoUrl = text.validation.invalidUrl
    }
    if (form.websiteUrl && !isValidUrl(form.websiteUrl)) {
      newErrors.websiteUrl = text.validation.invalidUrl
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePublish = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await onPublish(contact.id, form)
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {contact.status !== "published" && (
          <Button
            disabled={contact.status !== "confirmed"}
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs">
            <Globe className="h-3 w-3" />
            {text.requestActions.publishButton}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex sm:max-w-lg">
        <div className="flex w-full flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{text.publishDialog.title}</DialogTitle>
            <DialogDescription>{text.publishDialog.description(contact.company_name)}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            {/* Logo URL */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="logoUrl">{text.publishDialog.logoUrlLabel}</Label>
              <Input
                id="logoUrl"
                placeholder="https://example.com/logo.png"
                value={form.logoUrl}
                className={errors.logoUrl ? "border-destructive" : ""}
                onChange={(e) => {
                  setForm((f) => ({ ...f, logoUrl: e.target.value }))
                  if (errors.logoUrl) setErrors((err) => ({ ...err, logoUrl: undefined }))
                }}
              />
              {errors.logoUrl && <p className="text-destructive text-xs">{errors.logoUrl}</p>}
            </div>

            {/* Website */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="websiteUrl">{text.publishDialog.websiteUrlLabel}</Label>
              <Input
                id="websiteUrl"
                placeholder="https://example.com"
                value={form.websiteUrl}
                className={errors.websiteUrl ? "border-destructive" : ""}
                onChange={(e) => {
                  setForm((f) => ({ ...f, websiteUrl: e.target.value }))
                  if (errors.websiteUrl) setErrors((err) => ({ ...err, websiteUrl: undefined }))
                }}
              />
              {errors.websiteUrl && <p className="text-destructive text-xs">{errors.websiteUrl}</p>}
            </div>

            {/* Background Color */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bgColor">{text.publishDialog.backgroundColorLabel}</Label>
              <div className="flex items-center gap-2">
                <ColorPicker
                  current={form.logoBgColor}
                  onChange={(color) => setForm((f) => ({ ...f, logoBgColor: color }))}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => setForm((f) => ({ ...f, logoBgColor: null }))}>
                  {text.publishDialog.resetButton}
                </Button>
              </div>
            </div>

            {/* Logo Size + Tier */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>{text.publishDialog.logoSizeLabel}</Label>
                <Select
                  value={form.logoSize}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, logoSize: v as PublishFormData["logoSize"] }))
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(text.publishLabels.logoSize).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>{text.publishDialog.tierLabel}</Label>
                <Select
                  value={form.tier}
                  onValueChange={(v) => setForm((f) => ({ ...f, tier: v as PublishFormData["tier"] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(text.publishLabels.tier).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Marquee Preview */}
            {form.logoUrl && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-muted-foreground text-xs">{text.publishDialog.previewLabel}</Label>
                <div className="rounded-lg border">
                  <PreviewMarqueeRow
                    currentLogo={form.logoUrl}
                    currentBgColor={form.logoBgColor}
                    currentLogoSize={form.logoSize}
                    currentWebsite={form.websiteUrl}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {text.publishDialog.cancelButton}
            </Button>
            <Button onClick={handlePublish} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              {loading ? text.publishDialog.publishButtonLoading : text.publishDialog.publishButton}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AdminSponsorsPage() {
  const [packages, setPackages] = useState<SponsorPackage[]>([])
  const [contacts, setContacts] = useState<SponsorContact[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<EditForm>(emptyForm)
  const { language, isReady } = useLanguage()
  const hasDataFetched = useRef(false)

  const sortedPackages = useMemo(
    () => [...packages].sort((a, b) => a.display_order - b.display_order),
    [packages]
  )

  useEffect(() => {
    if (!isReady || hasDataFetched.current) return
    hasDataFetched.current = true
    fetchData()
  }, [isReady])

  const text = copy[language]

  async function fetchData() {
    setLoading(true)
    await fetchSponsorPackages()
    await fetchContacts()
    setLoading(false)
  }

  async function fetchSponsorPackages() {
    try {
      const res = await fetch("/api/admin/sponsors", { credentials: "include" })
      if (!res.ok) throw new Error(text.errors.fetchGeneral)
      const json = await res.json()
      setPackages(json.data?.packages || [])
    } catch (error) {
      console.error(error)
      toast.error(text.errors.fetchPackages)
    }
  }

  async function fetchContacts() {
    try {
      const res = await fetch("/api/admin/sponsor-contacts", { credentials: "include" })
      if (!res.ok) throw new Error(text.errors.fetchGeneral)

      const data = await res.json()
      // Sort contacts after fetch (and not dynamically) to prevent throwing order
      if (data.data?.contacts) {
        setContacts(
          data.data?.contacts.sort(
            (a: SponsorContact, b: SponsorContact) =>
              STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
              b.created_at.localeCompare(a.created_at)
          )
        )
      }
    } catch (err) {
      console.error(err)
      toast.error(text.errors.fetchContacts)
    }
  }

  function openCreateDialog() {
    setForm({
      ...emptyForm,
      displayOrder: String((sortedPackages[sortedPackages.length - 1]?.display_order || 0) + 1)
    })
    setOpen(true)
  }

  function openEditDialog(pkg: SponsorPackage) {
    setForm({
      id: pkg.id,
      name: pkg.name,
      displayOrder: String(pkg.display_order),
      color: pkg.color || "#530A5D",
      description: pkg.description || "",
      benefitsText: (pkg.benefits || []).join("\n")
    })
    setOpen(true)
  }

  async function savePackage() {
    const name = form.name.trim()
    const displayOrder = Number(form.displayOrder)

    if (!name) {
      toast.error(text.errors.packageSaveNameRequired)
      return
    }

    if (!Number.isFinite(displayOrder)) {
      toast.error(text.errors.packageSaveDisplayOrderRequired)
      return
    }

    try {
      setSaving(true)
      const payload = {
        id: form.id,
        name,
        displayOrder,
        color: form.color,
        description: form.description,
        benefits: form.benefitsText
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean)
      }

      const res = await fetch("/api/admin/sponsors", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || text.errors.packageSaveFailed)
      }

      const json = await res.json()
      const nextPackage = json.data?.package as SponsorPackage

      setPackages((prev) => {
        const without = prev.filter((pkg) => pkg.id !== nextPackage.id)
        return [...without, nextPackage]
      })

      setOpen(false)
      toast.success(form.id ? text.success.packageSavedUpdate : text.success.packageSavedCreate)
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : text.errors.packageSaveFailed)
    } finally {
      setSaving(false)
    }
  }

  async function removePackage(id: string) {
    try {
      const res = await fetch("/api/admin/sponsors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || text.errors.packageDeleteFailed)
      }

      setPackages((prev) => prev.filter((pkg) => pkg.id !== id))
      toast.success(text.success.packageDeleted)
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : text.errors.packageDeleteFailed)
    }
  }

  const handleContactStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/sponsor-contacts`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || text.errors.sponsorUpdateFailed)
      }

      setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
      toast.success(text.success.sponsorSavedUpdate)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : text.errors.sponsorUpdateFailed)
    }
  }

  const handleContactPublish = async (id: string, data: PublishFormData) => {
    try {
      const res = await fetch(`/api/admin/sponsor-contacts/publish`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || text.errors.sponsorPublishFailed)
      }

      const resData = await res.json()
      setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...resData.data?.sponsor } : c)))
      toast.success(text.success.sponsorPublish)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : text.errors.sponsorPublishFailed)
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground font-display text-3xl font-bold">{text.pageTitle}</h1>
          <p className="text-muted-foreground mt-2">{text.pageDescription}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="grid gap-2">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-[#530A5D]" />
                {text.packagesTitle}
              </CardTitle>
              <CardDescription>{text.packagesDescription}</CardDescription>
            </div>
            <Button className="bg-[#530A5D] text-white hover:bg-[#3f0847]" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              {text.newPackageButton}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sortedPackages.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden border">
                <div className="h-2" style={{ backgroundColor: pkg.color || "#530A5D" }} />
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{pkg.name}</CardTitle>
                    <Badge variant="outline">#{pkg.display_order}</Badge>
                  </div>
                  <CardDescription>{pkg.description || text.packageCardNoDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md border p-2 text-xs">
                    {text.packageCardColorLabel}: {pkg.color || "#530A5D"}
                  </div>
                  <div className="text-muted-foreground space-y-1 text-xs">
                    {(pkg.benefits || []).slice(0, 3).map((benefit, index) => (
                      <p key={`${pkg.id}-${index}`}>- {benefit}</p>
                    ))}
                    {(pkg.benefits || []).length > 3 && (
                      <p>{text.packageCardMoreBenefits((pkg.benefits || []).length - 3)}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(pkg)}>
                      <Edit2 className="mr-1 h-3 w-3" />
                      {text.packageCardEditButton}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => void removePackage(pkg.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#530A5D]" />
              {text.requestsTitle}
            </CardTitle>
            <CardDescription>{text.requestsCount(contacts.length)}</CardDescription>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">{text.noRequests}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {contacts.map((contact) => {
                  const status = contact.status
                  const statusLabel =
                    text.requestStatusLabels[status as keyof typeof text.requestStatusLabels]
                  const statusClasses = STATUS_CLASSES[status as keyof typeof STATUS_CLASSES]

                  return (
                    <div
                      key={contact.id}
                      className="border-border hover:bg-muted/50 flex flex-col gap-3 rounded-lg border p-4 transition-colors">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <Building2 className="h-4 w-4 shrink-0 text-[#530A5D]" />
                          <span className="truncate text-sm font-semibold">{contact.company_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses}`}>
                            {statusLabel}
                          </div>
                          {contact.status === "published" && (
                            <div
                              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize`}
                              style={{
                                background: `color-mix(in srgb, ${sortedPackages.filter((e) => e.name.toLowerCase() === contact.tier)[0]?.color || ""} 50%, white)`,
                                color: `color-mix(in srgb, ${sortedPackages.filter((e) => e.name.toLowerCase() === contact.tier)[0]?.color || ""} 50%, black)`
                              }}>
                              {contact.tier ? text.publishLabels.tier[contact.tier] : contact.tier}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Contact details */}
                      <div className="text-muted-foreground flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="sr-only">{text.requestLabels.contactPerson}:</span>
                          <span>{contact.contact_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 shrink-0" />

                          <a
                            href={`mailto:${contact.email}`}
                            className="hover:text-foreground truncate underline-offset-2 hover:underline">
                            {contact.email}
                          </a>
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.interested_in && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <Tag className="h-3 w-3 shrink-0" />
                            <p>
                              {text.requestLabels.interestedIn}:{" "}
                              <span>
                                {contact.interested_in
                                  ? text.publishLabels.tier[
                                      contact.interested_in as keyof typeof text.publishLabels.tier
                                    ]
                                  : contact.interested_in}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Message */}
                      {contact.message && (
                        <p className="text-muted-foreground border-border line-clamp-2 border-t pt-2 text-xs italic">
                          "{contact.message}"
                        </p>
                      )}

                      {/* Footer: date + actions */}
                      <div className="border-border flex items-center justify-between border-t pt-2">
                        <span className="text-muted-foreground/60 text-xs">
                          {new Date(contact.created_at).toLocaleDateString("de-CH", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          {/* Status updaten */}
                          {contact.status != "published" && (
                            <Select
                              value={contact.status}
                              onValueChange={(v) => handleContactStatusUpdate(contact.id, v)}>
                              <SelectTrigger className="h-7 w-auto gap-1 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(text.requestStatusOptions).map(([k, v]) => (
                                  <SelectItem key={k} value={k} className="text-xs">
                                    {v}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {/* Publish related */}
                          {contact.status === "published" ? (
                            <Button
                              onClick={() => handleContactStatusUpdate(contact.id, "confirmed")}
                              size="sm"
                              variant="destructive"
                              className="gap-1.5 text-xs">
                              <GlobeOff className="h-3 w-3" />
                              {text.requestActions.revertButton}
                            </Button>
                          ) : (
                            <PublishDialog contact={contact} onPublish={handleContactPublish} />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span className="hidden" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {form.id ? text.packageDialog.editTitle : text.packageDialog.createTitle}
            </DialogTitle>
            <DialogDescription>{text.packageDialog.description}</DialogDescription>
          </DialogHeader>

          <div className="md:grid-cols- grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="pkg-name">{text.packageDialog.nameLabel}</Label>
              <Input
                id="pkg-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={text.packageDialog.namePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-order">{text.packageDialog.displayOrderLabel}</Label>
              <Input
                id="pkg-order"
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, displayOrder: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-color">{text.packageDialog.colorLabel}</Label>
              <ColorPicker
                withPresets
                onPresetClick={(color) => setForm((prev) => ({ ...prev, color }))}
                current={form.color}
                onChange={(color) => setForm((prev) => ({ ...prev, color }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pkg-description">{text.packageDialog.descriptionLabel}</Label>
              <Textarea
                id="pkg-description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pkg-benefits">{text.packageDialog.benefitsLabel}</Label>
              <Textarea
                id="pkg-benefits"
                rows={8}
                value={form.benefitsText}
                onChange={(e) => setForm((prev) => ({ ...prev, benefitsText: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {text.packageDialog.cancelButton}
            </Button>
            <Button
              onClick={() => void savePackage()}
              disabled={saving}
              className="bg-[#530A5D] text-white hover:bg-[#3f0847]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? text.packageDialog.saveButtonLoading : text.packageDialog.saveButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
