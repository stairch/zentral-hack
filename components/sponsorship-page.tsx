"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Loader2, Mail } from "lucide-react"
import { toast } from "sonner"

interface SponsorPackage {
  id: string
  name: string
  description: string
  color: string
  benefits: string[]
  display_order: number
}

export function SponsorshipPage() {
  const [packages, setPackages] = useState<SponsorPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<string>("")
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    interestedIn: "",
    message: ""
  })

  // Fetch packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/sponsor-contact")
        if (res.ok) {
          const data = await res.json()
          setPackages(data.data?.packages || [])
        }
      } catch (error) {
        console.error("Failed to fetch packages:", error)
        toast.error("Fehler beim Laden der Pakete")
      } finally {
        setLoading(false)
      }
    }

    fetchPackages()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.companyName || !formData.contactName || !formData.email || !selectedPackage) {
      toast.error("Bitte füllen Sie alle erforderlichen Felder aus")
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch("/api/sponsor-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          interestedIn: selectedPackage
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Fehler beim Versenden")
      }

      setSubmitted(true)
      toast.success("Anfrage versendet! Wir melden uns bald bei Ihnen.")

      setTimeout(() => {
        setSubmitted(false)
        setFormData({ companyName: "", contactName: "", email: "", phone: "", interestedIn: "", message: "" })
        setSelectedPackage("")
      }, 3000)
    } catch (error) {
      console.error("Submit error:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Versenden")
    } finally {
      setSubmitting(false)
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
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Header */}
        <div className="space-y-4 text-center">
          <h1 className="text-5xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            SPONSORSHIP PACKAGES
          </h1>
          <p className="text-muted-foreground text-xl">
            Werde ein Teil des Zentral Hack 2026 und unterstütze Innovation
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`cursor-pointer overflow-hidden transition-all ${
                selectedPackage === pkg.name ? "ring-violet ring-2 ring-offset-2" : ""
              }`}
              onClick={() => setSelectedPackage(pkg.name.toLowerCase())}>
              <div className="h-1" style={{ backgroundColor: pkg.color }} />
              <CardHeader>
                <CardTitle className="text-2xl" style={{ color: pkg.color }}>
                  {pkg.name}
                </CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {pkg.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span className="text-muted-foreground text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={selectedPackage === pkg.name.toLowerCase() ? "default" : "outline"}
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedPackage(pkg.name.toLowerCase())
                  }}>
                  {selectedPackage === pkg.name.toLowerCase() ? "Ausgewählt" : "Auswählen"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Form */}
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Kontaktiere uns
            </CardTitle>
            <CardDescription>Füllen Sie das Formular aus und wir melden uns bald bei Ihnen</CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Check className="mb-4 h-12 w-12 text-green-500" />
                <h3 className="mb-2 text-lg font-semibold">Anfrage erfolgreich versendet!</h3>
                <p className="text-muted-foreground text-center">
                  Vielen Dank für Ihr Interesse. Wir werden Sie in Kürze kontaktieren.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="companyName">Firmenname *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="z.B. Tech Startup AG"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactName">Kontaktperson *</Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="Ihr Name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="email">E-Mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ihre@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+41 44 123 45 67"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="package">Interessiert in *</Label>
                  <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen Sie ein Paket" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.name.toLowerCase()}>
                          {pkg.name} - {pkg.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Nachricht</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Schreiben Sie uns Ihre Anfrage oder Fragen..."
                    rows={5}
                  />
                </div>

                <Button type="submit" disabled={submitting} className="bg-violet hover:bg-violet/90 w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird versendet...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Anfrage versendet
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="from-violet/10 bg-gradient-to-r to-purple-400/10">
          <CardHeader>
            <CardTitle>Warum Zentral Hack sponsern?</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3 text-sm">
            <p>
              Der Zentral Hack ist ein großes Hackathon-Event, das Innovatoren, Entwickler und Unternehmer
              zusammenbringt. Als Sponsor erhalten Sie:
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>Sichtbarkeit bei einer hochmotivierten Zielgruppe</li>
              <li>Networking mit Tech-Talenten und Studierenden</li>
              <li>Markenexposition durch verschiedene Kanäle</li>
              <li>Möglichkeit zur Präsentation Ihrer Produkte oder Services</li>
            </ul>
            <p className="pt-2">
              Kontaktieren Sie uns für ein personalisiertes Sponsorship-Paket, das Ihren Anforderungen
              entspricht!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
