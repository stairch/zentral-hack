"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
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
  Upload,
  Globe,
  Building2,
  User,
  Mail,
  Tag,
  Phone,
  GlobeOff
} from "lucide-react"
import { toast } from "sonner"
import { isValidUrl, srcWithVersion } from "@/lib/helpers"
import { useLanguage } from "@/lib/language-context"
import {
  getSponsorPackageByLanguage,
  getSponsorPackagePriceLabel,
  type SponsorPackagePriceStatus
} from "@/lib/sponsorship-packages"
import Image from "next/image"
import LogoMarqueePreview from "./logo-marquee-preview"

type SponsorPackage = {
  id: string
  name: string
  name_en: string | null
  short_description: string | null
  short_description_en: string | null
  description: string | null
  description_en: string | null
  color: string | null
  benefits: string[] | null
  benefits_en: string[] | null
  price: number | null
  price_status: SponsorPackagePriceStatus
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
  logo_size: number | null
  tier: string | null
  logo_bg_color: string | null
  updated_at: number
}

interface EditForm {
  id?: string
  name: string
  nameEn: string
  shortDescription: string
  shortDescriptionEn: string
  displayOrder: string
  color: string
  description: string
  descriptionEn: string
  benefitsText: string
  benefitsEnText: string
  price: string
  priceStatus: SponsorPackagePriceStatus
}

const emptyForm: EditForm = {
  name: "",
  nameEn: "",
  shortDescription: "",
  shortDescriptionEn: "",
  displayOrder: "",
  color: "#530A5D",
  description: "",
  descriptionEn: "",
  benefitsText: "",
  benefitsEnText: "",
  price: "",
  priceStatus: "hidden"
}

const STATUS_ORDER = ["new", "contacted", "confirmed", "published", "rejected"]

interface PublishFormData {
  logoUrl: string
  websiteUrl: string
  logoBgColor: string | null
  logoSize: number
  tier: string
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
    packageCardPriceLabel: "Preis",
    packageCardPriceHidden: "Ausgeblendet",
    packageCardPriceOnRequest: "Preis auf Anfrage",
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
      nameEnLabel: "Name EN",
      namePlaceholder: "z.B. Gold",
      shortDescriptionLabel: "Kurzbeschreibung",
      shortDescriptionEnLabel: "Kurzbeschreibung EN",
      displayOrderLabel: "Display-Order",
      colorLabel: "Farbe (Hex)",
      descriptionLabel: "Beschreibung",
      descriptionEnLabel: "Beschreibung EN",
      benefitsLabel: "Benefits (eine Zeile pro Benefit)",
      benefitsEnLabel: "Benefits EN (eine Zeile pro Benefit)",
      priceLabel: "Preis",
      priceStatusLabel: "Preisstatus",
      pricePlaceholder: "z.B. 2500",
      priceStatusOptions: {
        hidden: "Ausgeblendet",
        show: "Anzeigen",
        on_request: "Preis auf Anfrage"
      },
      cancelButton: "Abbrechen",
      saveButton: "Speichern",
      saveButtonLoading: "Speichern"
    },
    publishDialog: {
      title: "Sponsor veröffentlichen",
      description: (companyName: string) => `${companyName} auf der Landing Page publizieren`,
      logoUrlLabel: "Logo *",
      logoUploadButton: "Logo hochladen",
      logoUploadLoading: "Lädt hoch...",
      logoUploadHint: "PNG, JPG oder WEBP (max. 5 MB)",
      websiteUrlLabel: "Website",
      backgroundColorLabel: "Hintergrundfarbe",
      resetButton: "Zurücksetzen",
      logoSizeLabel: "Logo-Grösse",
      packageLabel: "Sponsorpaket",
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
      packageSavePriceRequired: "Preis ist erforderlich, wenn der Status auf Anzeigen steht",
      packageSaveFailed: "Fehler beim Speichern",
      packageDeleteFailed: "Fehler beim Löschen",
      sponsorUpdateFailed: "Fehler beim Aktualisieren der Sponsor-Anfrage",
      sponsorPublishFailed: "Fehler beim Veröffentlichen des Sponsors",
      logoUploadFailed: "Logo-Upload fehlgeschlagen"
    },
    success: {
      packageSavedCreate: "Sponsorpaket erstellt",
      packageSavedUpdate: "Sponsorpaket aktualisiert",
      packageDeleted: "Sponsorpaket gelöscht",
      sponsorSavedUpdate: "Sponsor-Anfrage aktualisiert",
      sponsorPublish: "Sponsor veröffentlicht",
      logoUploadSuccess: "Logo hochgeladen"
    }
  },
  en: {
    pageTitle: "SPONSORS",
    pageDescription: "Manage sponsor packages and sponsor inquiries",
    packagesTitle: "Sponsor packages",
    packagesDescription: "All fields including color, order, and benefits are editable.",
    newPackageButton: "New package",
    packageCardColorLabel: "Color",
    packageCardPriceLabel: "Price",
    packageCardPriceHidden: "Hidden",
    packageCardPriceOnRequest: "Price on request",
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
      nameEnLabel: "Name EN",
      namePlaceholder: "e.g. Gold",
      shortDescriptionLabel: "Short description",
      shortDescriptionEnLabel: "Short description EN",
      displayOrderLabel: "Display order",
      colorLabel: "Color (hex)",
      descriptionLabel: "Description",
      descriptionEnLabel: "Description EN",
      benefitsLabel: "Benefits (one line per benefit)",
      benefitsEnLabel: "Benefits EN (one line per benefit)",
      priceLabel: "Price",
      priceStatusLabel: "Price status",
      pricePlaceholder: "e.g. 2500",
      priceStatusOptions: {
        hidden: "Hidden",
        show: "Show",
        on_request: "Price on request"
      },
      cancelButton: "Cancel",
      saveButton: "Save",
      saveButtonLoading: "Save"
    },
    publishDialog: {
      title: "Publish sponsor",
      description: (companyName: string) => `Publish ${companyName} on the landing page`,
      logoUrlLabel: "Logo *",
      logoUploadButton: "Upload logo",
      logoUploadLoading: "Uploading...",
      logoUploadHint: "PNG, JPG, or WEBP (max. 5 MB)",
      websiteUrlLabel: "Website",
      backgroundColorLabel: "Background color",
      resetButton: "Reset",
      logoSizeLabel: "Logo size",
      packageLabel: "Sponsor package",
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
      packageSavePriceRequired: "Price is required when the status is set to show",
      packageSaveFailed: "Error while saving",
      packageDeleteFailed: "Error while deleting",
      sponsorUpdateFailed: "Error while updating sponsor inquiry",
      sponsorPublishFailed: "Error while publishing sponsor",
      logoUploadFailed: "Logo upload failed"
    },
    success: {
      packageSavedCreate: "Sponsor package created",
      packageSavedUpdate: "Sponsor package updated",
      packageDeleted: "Sponsor package deleted",
      sponsorSavedUpdate: "Sponsor contact updated",
      sponsorPublish: "Sponsor contact published",
      logoUploadSuccess: "Logo uploaded"
    }
  }
}

function PublishDialog({
  contact,
  packages,
  onPublish
}: {
  contact: SponsorContact
  packages: SponsorPackage[]
  onPublish: (id: string, data: PublishFormData) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof PublishFormData, string>>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUnsavedLogo, setIsUnsavedLogo] = useState<boolean>(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [form, setForm] = useState<PublishFormData>({
    logoUrl: "",
    websiteUrl: "",
    logoBgColor: null,
    logoSize: 50,
    tier: contact.interested_in || ""
  })
  const { language } = useLanguage()
  const text = copy[language]
  const localizedPackages = useMemo(
    () =>
      packages.map((pkg) => ({
        raw: pkg,
        localized: getSponsorPackageByLanguage(pkg, language),
        priceLabel: getSponsorPackagePriceLabel(getSponsorPackageByLanguage(pkg, language), language)
      })),
    [language, packages]
  )

  useEffect(() => {
    if (open) {
      setForm({
        logoUrl: contact.logo_url || "",
        websiteUrl: contact.website_url || "",
        logoBgColor: contact.logo_bg_color || null,
        logoSize: contact.logo_size ?? 50,
        tier: contact.tier || contact.interested_in || ""
      })
      setIsUnsavedLogo(false)
      if (contact.logo_url) {
        setPreviewUrl(srcWithVersion(`/api/sponsor-logo?id=${contact.id}`, contact.updated_at))
      }
    } else {
      setErrors({})
    }

    async function removeBlob() {
      const res = await fetch("/api/admin/logo-upload", {
        method: "DELETE",
        credentials: "include",
        body: JSON.stringify({ url: form.logoUrl })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
    }
    // if a new logo was uploaded, let's remove it again from blob to save storage when dialog closed
    if (!open && isUnsavedLogo) {
      removeBlob()
    }
  }, [open])

  const handleLogoUpload = async (file: File) => {
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    try {
      setUploadingLogo(true)
      const fd = new FormData()
      fd.append("file", file)

      const res = await fetch("/api/admin/logo-upload", {
        method: "POST",
        credentials: "include",
        body: fd
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || text.errors.logoUploadFailed)
      }

      const data = await res.json()
      setForm((prev) => ({ ...prev, logoUrl: data.url }))
      setIsUnsavedLogo(true)

      if (errors.logoUrl) {
        setErrors((prev) => ({ ...prev, logoUrl: undefined }))
      }
      toast.success(text.success.logoUploadSuccess)
    } catch (err) {
      setPreviewUrl(null)
      URL.revokeObjectURL(localPreview)
      toast.error(err instanceof Error ? err.message : text.errors.logoUploadFailed)
    } finally {
      setUploadingLogo(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

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
      setIsUnsavedLogo(false)
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
              {previewUrl && (
                <div className="flex h-16 w-full items-center justify-center rounded-lg border bg-white p-2">
                  <Image
                    src={previewUrl}
                    alt="Preview logo"
                    width={400}
                    height={50}
                    className="h-auto max-h-12 max-w-full object-contain"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      void handleLogoUpload(file)
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingLogo}
                  className="shrink-0"
                  onClick={() => fileInputRef.current?.click()}>
                  {uploadingLogo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">
                    {uploadingLogo
                      ? text.publishDialog.logoUploadLoading
                      : text.publishDialog.logoUploadButton}
                  </span>
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">{text.publishDialog.logoUploadHint}</p>
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

            {/* Logo Size + Package */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="flex items-center justify-between">
                  <span>{text.publishDialog.logoSizeLabel}</span>
                  <span className="text-muted-foreground font-normal">{form.logoSize * 2 + 20}px</span>
                </Label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={form.logoSize}
                  onChange={(e) => setForm((f) => ({ ...f, logoSize: Number(e.target.value) }))}
                  className="accent-primary w-full"
                />
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>5</span>
                  <span>100</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>{text.publishDialog.packageLabel}</Label>
                <Select value={form.tier} onValueChange={(v) => setForm((f) => ({ ...f, tier: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {localizedPackages.map(({ raw, localized }) => (
                      <SelectItem key={raw.id} value={raw.id}>
                        {localized.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Marquee Preview */}
            {previewUrl && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-muted-foreground text-xs">{text.publishDialog.previewLabel}</Label>
                <div className="rounded-lg border">
                  <LogoMarqueePreview
                    currentLogo={previewUrl}
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
            <Button onClick={handlePublish} disabled={loading || uploadingLogo} className="gap-1.5">
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
  const [deletePackageId, setDeletePackageId] = useState<string | null>(null)
  const [deletingPackage, setDeletingPackage] = useState(false)
  const { language, isReady } = useLanguage()
  const hasDataFetched = useRef(false)

  const sortedPackages = useMemo(
    () => [...packages].sort((a, b) => a.display_order - b.display_order),
    [packages]
  )
  const packageById = useMemo(() => new Map(sortedPackages.map((pkg) => [pkg.id, pkg])), [sortedPackages])

  useEffect(() => {
    if (!isReady || hasDataFetched.current) return
    hasDataFetched.current = true
    fetchData()
  }, [isReady])

  const text = copy[language]

  const getLocalizedPackageById = (packageId: string | null | undefined) => {
    if (!packageId) return null
    const pkg = packageById.get(packageId)
    return pkg ? getSponsorPackageByLanguage(pkg, language) : null
  }

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
      nameEn: pkg.name_en || "",
      shortDescription: pkg.short_description || "",
      shortDescriptionEn: pkg.short_description_en || "",
      displayOrder: String(pkg.display_order),
      color: pkg.color || "#530A5D",
      description: pkg.description || "",
      descriptionEn: pkg.description_en || "",
      benefitsText: (pkg.benefits || []).join("\n"),
      benefitsEnText: (pkg.benefits_en || []).join("\n"),
      price: pkg.price === null ? "" : String(pkg.price),
      priceStatus: pkg.price_status
    })
    setOpen(true)
  }

  async function savePackage() {
    const name = form.name.trim()
    const displayOrder = Number(form.displayOrder)
    const parsedPrice = form.price.trim() ? Number(form.price) : null

    if (!name) {
      toast.error(text.errors.packageSaveNameRequired)
      return
    }

    if (!Number.isFinite(displayOrder)) {
      toast.error(text.errors.packageSaveDisplayOrderRequired)
      return
    }

    if (form.priceStatus === "show" && parsedPrice === null) {
      toast.error(text.errors.packageSavePriceRequired)
      return
    }

    if (parsedPrice !== null && !Number.isFinite(parsedPrice)) {
      toast.error(text.errors.packageSavePriceRequired)
      return
    }

    try {
      setSaving(true)
      const payload = {
        id: form.id,
        name,
        nameEn: form.nameEn.trim(),
        shortDescription: form.shortDescription.trim(),
        shortDescriptionEn: form.shortDescriptionEn.trim(),
        displayOrder,
        color: form.color,
        description: form.description,
        descriptionEn: form.descriptionEn,
        benefits: form.benefitsText
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean),
        benefitsEn: form.benefitsEnText
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean),
        price: parsedPrice,
        priceStatus: form.priceStatus
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

  async function removePackage() {
    if (!deletePackageId) return
    try {
      setDeletingPackage(true)
      const res = await fetch("/api/admin/sponsors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: deletePackageId })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || text.errors.packageDeleteFailed)
      }

      setPackages((prev) => prev.filter((pkg) => pkg.id !== deletePackageId))
      toast.success(text.success.packageDeleted)
      setDeletePackageId(null)
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : text.errors.packageDeleteFailed)
    } finally {
      setDeletingPackage(false)
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

      {/* Sponsor packages */}
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
            {sortedPackages.map((pkg) => {
              const localizedPkg = getSponsorPackageByLanguage(pkg, language)
              return (
                <Card key={localizedPkg.id} className="overflow-hidden border">
                  <div className="h-2" style={{ backgroundColor: pkg.color || "#530A5D" }} />
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle>{localizedPkg.name}</CardTitle>
                      <Badge variant="outline">#{localizedPkg.display_order}</Badge>
                    </div>
                    {localizedPkg.short_description && (
                      <p className="text-muted-foreground text-xs">{localizedPkg.short_description}</p>
                    )}
                    <CardDescription>
                      {localizedPkg.description || text.packageCardNoDescription}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex h-full flex-col justify-between space-y-3">
                    <div className="space-y-3">
                      <div className="rounded-md border p-2 text-xs">
                        {text.packageCardColorLabel}: {localizedPkg.color || "#530A5D"}
                      </div>
                      <div className="rounded-md border p-2 text-xs">
                        {text.packageCardPriceLabel}:{" "}
                        {getSponsorPackagePriceLabel(localizedPkg, language) || text.packageCardPriceHidden}
                      </div>
                      <div className="text-muted-foreground space-y-1 text-xs">
                        {(localizedPkg.benefits || []).slice(0, 3).map((benefit, index) => (
                          <p key={`${localizedPkg.id}-${index}`}>- {benefit}</p>
                        ))}
                        {(localizedPkg.benefits || []).length > 3 && (
                          <p>{text.packageCardMoreBenefits((localizedPkg.benefits || []).length - 3)}</p>
                        )}
                      </div>
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
                      <Button variant="destructive" size="sm" onClick={() => setDeletePackageId(pkg.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sponsoring inquiries */}
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
                          {contact.status === "published" &&
                            (() => {
                              const localizedPublishedPackage = getLocalizedPackageById(contact.tier)
                              return (
                                <div
                                  className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                                  style={{
                                    background: `color-mix(in srgb, ${localizedPublishedPackage?.color || "#530A5D"} 50%, white)`,
                                    color: `color-mix(in srgb, ${localizedPublishedPackage?.color || "#530A5D"} 50%, black)`
                                  }}>
                                  {localizedPublishedPackage?.name || contact.tier}
                                </div>
                              )
                            })()}
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
                                {getLocalizedPackageById(contact.interested_in)?.name ||
                                  contact.interested_in}
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
                          {new Date(contact.created_at).toLocaleDateString(
                            language === "en" ? "en-CH" : "de-CH",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric"
                            }
                          )}
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
                            <PublishDialog
                              contact={contact}
                              packages={sortedPackages}
                              onPublish={handleContactPublish}
                            />
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

      {/* Package edit dialog */}
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

          <div className="grid gap-4 md:grid-cols-2">
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
              <Label htmlFor="pkg-name-en">{text.packageDialog.nameEnLabel}</Label>
              <Input
                id="pkg-name-en"
                value={form.nameEn}
                onChange={(e) => setForm((prev) => ({ ...prev, nameEn: e.target.value }))}
                placeholder="e.g. Gold"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pkg-short-description">{text.packageDialog.shortDescriptionLabel}</Label>
              <Input
                id="pkg-short-description"
                value={form.shortDescription}
                onChange={(e) => setForm((prev) => ({ ...prev, shortDescription: e.target.value }))}
                placeholder="Kurz und prägnant"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pkg-short-description-en">{text.packageDialog.shortDescriptionEnLabel}</Label>
              <Input
                id="pkg-short-description-en"
                value={form.shortDescriptionEn}
                onChange={(e) => setForm((prev) => ({ ...prev, shortDescriptionEn: e.target.value }))}
                placeholder="Short and concise"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-price">{text.packageDialog.priceLabel}</Label>
              <Input
                id="pkg-price"
                type="number"
                min="0"
                step="1"
                value={form.price}
                placeholder={text.packageDialog.pricePlaceholder}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-price-status">{text.packageDialog.priceStatusLabel}</Label>
              <Select
                value={form.priceStatus}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, priceStatus: v as SponsorPackagePriceStatus }))
                }>
                <SelectTrigger id="pkg-price-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(text.packageDialog.priceStatusOptions).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="pkg-description-en">{text.packageDialog.descriptionEnLabel}</Label>
              <Textarea
                id="pkg-description-en"
                rows={3}
                value={form.descriptionEn}
                onChange={(e) => setForm((prev) => ({ ...prev, descriptionEn: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pkg-benefits">{text.packageDialog.benefitsLabel}</Label>
              <Textarea
                id="pkg-benefits"
                rows={6}
                value={form.benefitsText}
                onChange={(e) => setForm((prev) => ({ ...prev, benefitsText: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pkg-benefits-en">{text.packageDialog.benefitsEnLabel}</Label>
              <Textarea
                id="pkg-benefits-en"
                rows={6}
                value={form.benefitsEnText}
                onChange={(e) => setForm((prev) => ({ ...prev, benefitsEnText: e.target.value }))}
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

      <ConfirmDialog
        open={!!deletePackageId}
        onOpenChange={(open) => !open && setDeletePackageId(null)}
        title={language === "en" ? "Delete package?" : "Paket löschen?"}
        description={
          language === "en"
            ? "This sponsor package will be permanently deleted."
            : "Dieses Sponsoren-Paket wird dauerhaft gelöscht."
        }
        confirmLabel={language === "en" ? "Delete" : "Löschen"}
        cancelLabel={language === "en" ? "Cancel" : "Abbrechen"}
        onConfirm={() => void removePackage()}
        loading={deletingPackage}
      />
    </div>
  )
}
