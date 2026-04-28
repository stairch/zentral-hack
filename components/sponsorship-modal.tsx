"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, CheckCircle2, Loader2, Check } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import {
  getSponsorPackageByLanguage,
  getSponsorPackagePriceLabel,
  type SponsorPackage
} from "@/lib/sponsorship-packages"

interface FormData {
  companyName: string
  contactName: string
  email: string
  phone: string
  interestedIn: string
  message: string
}

interface SponsorshipModalProps {
  isOpen: boolean
  onClose: () => void
  allPackages: SponsorPackage[]
  selectedPackage?: SponsorPackage | null
}

const copy = {
  de: {
    title: "Sponsoring anfragen",
    description: "Du siehst die Details des gewählten Pakets und kannst uns direkt eine Anfrage schicken.",
    successTitle: "Danke für deine Anfrage!",
    successDescription: "Wir werden dich bald kontaktieren, um die Details zu besprechen.",
    packageSwitchLabel: "Paket wechseln",
    interestedLabel: "Interessiert an",
    companyNameLabel: "Firmenname *",
    companyNamePlaceholder: "Dein Unternehmen",
    contactNameLabel: "Kontaktperson *",
    contactNamePlaceholder: "Dein Name",
    emailLabel: "E-Mail *",
    emailPlaceholder: "deine@email.ch",
    phoneLabel: "Telefon",
    phonePlaceholder: "+41 XX XXX XX XX",
    messageLabel: "Nachricht",
    messagePlaceholder: "Weitere Informationen...",
    submitButton: "Anfrage senden",
    submitLoading: "Wird gesendet...",
    packageNotSelected: "Kein Paket gewählt",
    packagePriceOnRequest: "Preis auf Anfrage",
    loadingError: "Fehler beim Versenden"
  },
  en: {
    title: "Request sponsorship",
    description: "You can see the details of the selected package and send us a request directly.",
    successTitle: "Thanks for your request!",
    successDescription: "We will contact you soon to discuss the details.",
    packageSwitchLabel: "Switch package",
    interestedLabel: "Interested in",
    companyNameLabel: "Company name *",
    companyNamePlaceholder: "Your company",
    contactNameLabel: "Contact person *",
    contactNamePlaceholder: "Your name",
    emailLabel: "E-mail *",
    emailPlaceholder: "you@example.com",
    phoneLabel: "Phone",
    phonePlaceholder: "+41 XX XXX XX XX",
    messageLabel: "Message",
    messagePlaceholder: "Additional information...",
    submitButton: "Send request",
    submitLoading: "Sending...",
    packageNotSelected: "No package selected",
    packagePriceOnRequest: "Price on request",
    loadingError: "Error while sending"
  }
} as const

export function SponsorshipModal({
  isOpen,
  onClose,
  allPackages,
  selectedPackage: initialPackage
}: SponsorshipModalProps) {
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    interestedIn: "",
    message: ""
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { language } = useLanguage()
  const text = copy[language]
  const [activePackageId, setActivePackageId] = useState<string | null>(null)

  const activePackage = activePackageId
    ? (allPackages.find((pkg) => pkg.id === activePackageId) ?? null)
    : null
  const localizedActivePackage = activePackage ? getSponsorPackageByLanguage(activePackage, language) : null
  const activePackagePrice = localizedActivePackage
    ? getSponsorPackagePriceLabel(localizedActivePackage, language)
    : null

  useEffect(() => {
    if (!isOpen) return
    const pkg = initialPackage ?? allPackages[0] ?? null
    setActivePackageId(pkg?.id ?? null)
    setFormData((current) => ({
      ...current,
      interestedIn: pkg?.id ?? current.interestedIn
    }))
  }, [isOpen, initialPackage, allPackages])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectPackage = (pkg: SponsorPackage) => {
    setActivePackageId(pkg.id)
    setFormData((current) => ({ ...current, interestedIn: pkg.id }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/sponsor-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || text.loadingError)
      }

      setSubmitted(true)
      toast.success(
        language === "en"
          ? "Request sent! We'll be in touch soon."
          : "Anfrage versendet! Wir melden uns bald."
      )
      setFormData({
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        interestedIn: "",
        message: ""
      })

      setTimeout(() => {
        setSubmitted(false)
        onClose()
      }, 3000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.loadingError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 z-50 m-auto max-h-[90vh] max-w-3xl overflow-y-auto">
            <Card className="rounded-xl shadow-2xl">
              {/* Header */}
              <CardHeader className="relative border-b pb-4">
                <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4">
                  <X className="h-5 w-5" />
                </Button>
                <CardTitle className="text-2xl">{text.title}</CardTitle>
                <CardDescription>{text.description}</CardDescription>
              </CardHeader>

              {/* Content */}
              <CardContent className="pt-6">
                {submitted ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
                    <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
                    <h3 className="mb-2 text-xl font-semibold">{text.successTitle}</h3>
                    <p className="text-muted-foreground">{text.successDescription}</p>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                      <div
                        className="rounded-xl border p-5"
                        style={{
                          backgroundColor: `${localizedActivePackage?.color}12`,
                          borderColor: `${localizedActivePackage?.color}66`
                        }}>
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          <p
                            className="text-xs font-semibold tracking-[0.2em] uppercase"
                            style={{ color: localizedActivePackage?.color }}>
                            {localizedActivePackage?.name}
                          </p>
                          {activePackagePrice && (
                            <span className="rounded-full border border-current/15 bg-white/70 px-2.5 py-0.5 text-xs font-medium">
                              {activePackagePrice === "Price on request" ||
                              activePackagePrice === "Preis auf Anfrage"
                                ? text.packagePriceOnRequest
                                : activePackagePrice}
                            </span>
                          )}
                        </div>
                        {localizedActivePackage?.short_description && (
                          <h3 className="mb-2 text-xl font-semibold hyphens-auto" lang={language}>
                            {localizedActivePackage.short_description}
                          </h3>
                        )}
                        <p className="text-muted-foreground mb-5 text-sm leading-relaxed">
                          {localizedActivePackage?.description}
                        </p>
                        <div className="space-y-2">
                          {localizedActivePackage?.benefits.map((benefit) => (
                            <div key={benefit} className="flex items-start gap-2 text-sm">
                              <Check
                                className="mt-0.5 h-4 w-4 shrink-0"
                                style={{ color: localizedActivePackage?.color }}
                              />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm">{text.packageSwitchLabel}</Label>
                        <div className="grid gap-2">
                          {allPackages.map((pkg) => {
                            const localizedPkg = getSponsorPackageByLanguage(pkg, language)
                            const packageColor = localizedPkg.color || "#530A5D"
                            const packagePriceLabel = getSponsorPackagePriceLabel(localizedPkg, language)

                            return (
                              <button
                                key={pkg.id}
                                type="button"
                                onClick={() => handleSelectPackage(pkg)}
                                className="text-muted-foreground cursor-pointer rounded-lg border px-4 py-3 text-left text-xs transition-all"
                                style={{
                                  borderColor: activePackageId === pkg.id ? packageColor : "#e5e7eb",
                                  backgroundColor:
                                    activePackageId === pkg.id ? `${packageColor}12` : "transparent"
                                }}>
                                <p className="font-semibold" style={{ color: packageColor }}>
                                  {localizedPkg.name}
                                </p>
                                {localizedPkg.short_description && (
                                  <p className="mt-1">{localizedPkg.short_description}</p>
                                )}
                                {packagePriceLabel && <p className="mt-1">{packagePriceLabel}</p>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Contact Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="companyName" className="text-sm">
                            {text.companyNameLabel}
                          </Label>
                          <Input
                            id="companyName"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            required
                            placeholder={text.companyNamePlaceholder}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactName" className="text-sm">
                            {text.contactNameLabel}
                          </Label>
                          <Input
                            id="contactName"
                            name="contactName"
                            value={formData.contactName}
                            onChange={handleChange}
                            required
                            placeholder={text.contactNamePlaceholder}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm">
                            {text.emailLabel}
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder={text.emailPlaceholder}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm">
                            {text.phoneLabel}
                          </Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder={text.phonePlaceholder}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">{text.interestedLabel}</Label>
                        <Input value={localizedActivePackage?.name ?? text.packageNotSelected} readOnly />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm">
                          {text.messageLabel}
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder={text.messagePlaceholder}
                          rows={3}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading || !formData.interestedIn}
                        className="h-10 w-full bg-[#530A5D] text-white hover:bg-[#530A5D]/90">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : text.submitButton}
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
