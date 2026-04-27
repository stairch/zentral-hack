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
import { type SponsorPackageLocale } from "@/lib/sponsorship-packages"

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
  allPackages: SponsorPackageLocale[]
  selectedPackage?: SponsorPackageLocale | null
}

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
  const [activePackage, setActivePackage] = useState<SponsorPackageLocale | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { language } = useLanguage()

  useEffect(() => {
    if (!isOpen) return
    const pkg = initialPackage ?? allPackages[0] ?? null
    setActivePackage(pkg)
    setFormData((current) => ({
      ...current,
      interestedIn: pkg?.id ?? current.interestedIn
    }))
  }, [isOpen, initialPackage])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectPackage = (pkg: SponsorPackageLocale) => {
    setActivePackage(pkg)
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
        throw new Error(error.error || "Fehler beim Versenden")
      }

      setSubmitted(true)
      toast.success("Anfrage versendet! Wir melden uns bald.")
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
      toast.error(error instanceof Error ? error.message : "Fehler beim Versenden")
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
                <CardTitle className="text-2xl">Sponsoring anfragen</CardTitle>
                <CardDescription>
                  Du siehst die Details des gewählten Pakets und kannst uns direkt eine Anfrage schicken.
                </CardDescription>
              </CardHeader>

              {/* Content */}
              <CardContent className="pt-6">
                {submitted ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
                    <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
                    <h3 className="mb-2 text-xl font-semibold">Danke für deine Anfrage!</h3>
                    <p className="text-muted-foreground">
                      Wir werden dich bald kontaktieren, um die Details zu besprechen.
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                      <div
                        className="rounded-xl border p-5"
                        style={{
                          backgroundColor: `${activePackage?.color}12`,
                          borderColor: `${activePackage?.color}66`
                        }}>
                        <p
                          className="mb-3 text-xs font-semibold tracking-[0.2em] uppercase"
                          style={{ color: activePackage?.color }}>
                          {activePackage?.name}
                        </p>
                        <h3 className="mb-2 text-xl font-semibold hyphens-auto" lang={language}>
                          HIER SHORT DESCRIPTION (TO REMOVE)
                        </h3>
                        <p className="text-muted-foreground mb-5 text-sm leading-relaxed">
                          {activePackage?.description}
                        </p>
                        <div className="space-y-2">
                          {activePackage?.benefits.map((benefit) => (
                            <div key={benefit} className="flex items-start gap-2 text-sm">
                              <Check
                                className="mt-0.5 h-4 w-4 flex-shrink-0"
                                style={{ color: activePackage?.color }}
                              />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm">Paket wechseln</Label>
                        <div className="grid gap-2">
                          {allPackages.map((pkg) => (
                            <button
                              key={pkg.id}
                              type="button"
                              onClick={() => handleSelectPackage(pkg)}
                              className="cursor-pointer rounded-lg border px-4 py-3 text-left transition-all"
                              style={{
                                borderColor: activePackage?.id === pkg.id ? pkg.color : "#e5e7eb",
                                backgroundColor:
                                  activePackage?.id === pkg.id ? `${pkg.color}12` : "transparent"
                              }}>
                              <p className="font-semibold" style={{ color: pkg.color }}>
                                {pkg.name}
                              </p>
                              <p className="text-muted-foreground mt-1 text-xs">
                                HIER SHORT DESCRIPTION (TO REMOVE)
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Contact Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="companyName" className="text-sm">
                            Firmenname *
                          </Label>
                          <Input
                            id="companyName"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            required
                            placeholder="Dein Unternehmen"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactName" className="text-sm">
                            Kontaktperson *
                          </Label>
                          <Input
                            id="contactName"
                            name="contactName"
                            value={formData.contactName}
                            onChange={handleChange}
                            required
                            placeholder="Dein Name"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm">
                            E-Mail *
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="deine@email.ch"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm">
                            Telefon
                          </Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+41 XX XXX XX XX"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Interessiert an</Label>
                        <Input value={activePackage?.name ?? ""} readOnly />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm">
                          Nachricht
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Weitere Informationen..."
                          rows={3}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading || !formData.interestedIn}
                        className="h-10 w-full bg-[#530A5D] text-white hover:bg-[#530A5D]/90">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Anfrage senden"}
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
