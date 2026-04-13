"use client"

import { useEffect, useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { MessageSquare, Building2, User, Tag, Mail, Phone, Globe, Loader2 } from "lucide-react"
// import { toast } from "sonner"

interface SponsorContact {
  id: string
  companyName: string
  contactName: string
  email: string
  phone?: string
  interestedIn?: string
  message?: string
  status: string
  created_at: string
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  new: { label: "Neu", className: "bg-blue-100 text-blue-800" },
  contacted: { label: "Kontaktiert", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Bestätigt", className: "bg-green-100 text-green-800" },
  rejected: { label: "Abgelehnt", className: "bg-red-100 text-red-800" }
}

// TODO: von DB
const TIER_OPTIONS = ["Platin", "Gold", "Silber", "Bronze"] as const
const LOGO_SIZE_OPTIONS = ["small", "medium", "large"] as const

interface PublishFormData {
  logoUrl: string
  websiteUrl: string
  backgroundColor: string
  logoSize: "small" | "medium" | "large"
  tier: "Platin" | "Gold" | "Silber" | "Bronze"
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
  const [form, setForm] = useState<PublishFormData>({
    logoUrl: "",
    websiteUrl: "",
    backgroundColor: "transparent",
    logoSize: "medium",
    tier: (contact.interestedIn as PublishFormData["tier"]) ?? "Gold"
  })

  const handlePublish = async () => {
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
        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
          <Globe className="h-3 w-3" />
          Veröffentlichen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sponsor veröffentlichen</DialogTitle>
          <DialogDescription>{contact.companyName} auf der Landing Page publizieren</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Logo URL */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              placeholder="https://example.com/logo.png"
              value={form.logoUrl}
              onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
            />
          </div>

          {/* Website */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="websiteUrl">Website</Label>
            <Input
              id="websiteUrl"
              placeholder="https://example.com"
              value={form.websiteUrl}
              onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
            />
          </div>

          {/* Background Color */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bgColor">Hintergrundfarbe</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="bgColor"
                value={form.backgroundColor === "transparent" ? "#ffffff" : form.backgroundColor}
                onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))}
                className="border-input h-9 w-10 cursor-pointer rounded border p-0.5"
              />
              <Input
                value={form.backgroundColor}
                onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))}
                placeholder="transparent"
                className="font-mono text-sm"
              />
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => setForm((f) => ({ ...f, backgroundColor: "transparent" }))}>
                Reset
              </Button>
            </div>
          </div>

          {/* Logo Size + Tier in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Logo-Grösse</Label>
              <Select
                value={form.logoSize}
                onValueChange={(v) => setForm((f) => ({ ...f, logoSize: v as PublishFormData["logoSize"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOGO_SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Tier</Label>
              <Select
                value={form.tier}
                onValueChange={(v) => setForm((f) => ({ ...f, tier: v as PublishFormData["tier"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Logo preview */}
          {form.logoUrl && (
            <div
              className="flex items-center justify-center rounded-lg border border-dashed p-4"
              style={{
                backgroundColor: form.backgroundColor === "transparent" ? undefined : form.backgroundColor
              }}>
              <img
                src={form.logoUrl}
                alt="Logo-Vorschau"
                className={form.logoSize === "small" ? "h-8" : form.logoSize === "medium" ? "h-12" : "h-16"}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handlePublish}
            disabled={loading || !form.logoUrl || !form.websiteUrl}
            className="gap-1.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            Publizieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminSponsorsPage() {
  const [contacts, setContacts] = useState<SponsorContact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/sponsors", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setContacts(data.data?.contacts || [])
      }
    } catch {
      // TODO: toast.error(...)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    // TODO
    try {
      const res = await fetch(``, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
      }
    } catch {
      // TODO: toast.error(...)
    }
  }

  const handlePublish = async (id: string, data: PublishFormData) => {
    // TODO
    const res = await fetch(``, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
    if (res.ok) {
      setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status: "published" } : c)))
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
      <div>
        <h1 className="text-foreground text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          SPONSOR-ANFRAGEN
        </h1>
        <p className="text-muted-foreground mt-2">
          Anfragen von potenziellen Sponsoren und Partnern verwalten
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#530A5D]" />
            Alle Anfragen
          </CardTitle>
          <CardDescription>{contacts.length} Anfragen insgesamt</CardDescription>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">Noch keine Sponsor-Anfragen</p>
          ) : (
            <div className="flex flex-col gap-3">
              {contacts.map((contact) => {
                const status = STATUS_MAP[contact.status] ?? {
                  label: contact.status,
                  className: "bg-gray-100 text-gray-700"
                }
                return (
                  <div
                    key={contact.id}
                    className="border-border hover:bg-muted/50 flex flex-col gap-3 rounded-lg border p-4 transition-colors">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Building2 className="h-4 w-4 shrink-0 text-[#530A5D]" />
                        <span className="truncate text-sm font-semibold">{contact.companyName}</span>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Contact details */}
                    <div className="text-muted-foreground flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 shrink-0" />
                        <span>{contact.contactName}</span>
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
                      {contact.interestedIn && (
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3 w-3 shrink-0" />
                          <span>{contact.interestedIn}</span>
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
                        <Select
                          value={contact.status}
                          onValueChange={(v) => handleStatusUpdate(contact.id, v)}>
                          <SelectTrigger className="h-7 w-auto gap-1 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_MAP).map(([value, { label }]) => (
                              <SelectItem key={value} value={value} className="text-xs">
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Publish */}
                        <PublishDialog contact={contact} onPublish={handlePublish} />
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
  )
}
