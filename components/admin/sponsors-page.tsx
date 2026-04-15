"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Edit2, Loader2, MessageSquare, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

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

export function AdminSponsorsPage() {
  const [packages, setPackages] = useState<SponsorPackage[]>([])
  const [contacts, setContacts] = useState<SponsorContact[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<EditForm>(emptyForm)

  const sortedPackages = useMemo(
    () => [...packages].sort((a, b) => a.display_order - b.display_order),
    [packages]
  )

  async function fetchData() {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/sponsors", { credentials: "include" })
      if (!res.ok) throw new Error("Fehler beim Laden")
      const json = await res.json()
      setPackages(json.data?.packages || [])
      setContacts(json.data?.contacts || [])
    } catch (error) {
      console.error(error)
      toast.error("Fehler beim Laden der Sponsor-Verwaltung")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [])

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
      toast.error("Name ist erforderlich")
      return
    }

    if (!Number.isFinite(displayOrder)) {
      toast.error("Display-Order ist erforderlich")
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
        throw new Error(error.error || "Fehler beim Speichern")
      }

      const json = await res.json()
      const nextPackage = json.data?.package as SponsorPackage

      setPackages((prev) => {
        const without = prev.filter((pkg) => pkg.id !== nextPackage.id)
        return [...without, nextPackage]
      })

      setOpen(false)
      toast.success(form.id ? "Sponsorpaket aktualisiert" : "Sponsorpaket erstellt")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern")
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
        throw new Error(error.error || "Fehler beim Löschen")
      }

      setPackages((prev) => prev.filter((pkg) => pkg.id !== id))
      toast.success("Sponsorpaket gelöscht")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Löschen")
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
          <h1 className="text-foreground text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            SPONSOREN
          </h1>
          <p className="text-muted-foreground mt-2">Sponsorpakete und Sponsoranfragen verwalten</p>
        </div>

        <Button className="bg-[#530A5D] text-white hover:bg-[#3f0847]" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Neues Paket
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sponsorpakete</CardTitle>
          <CardDescription>Alle Felder inklusive Farbe, Reihenfolge und Benefits sind editierbar.</CardDescription>
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
                  <CardDescription>{pkg.description || "Keine Beschreibung"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md border p-2 text-xs">Farbe: {pkg.color || "#530A5D"}</div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {(pkg.benefits || []).slice(0, 3).map((benefit, index) => (
                      <p key={`${pkg.id}-${index}`}>- {benefit}</p>
                    ))}
                    {(pkg.benefits || []).length > 3 && <p>+ {(pkg.benefits || []).length - 3} weitere</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(pkg)}>
                      <Edit2 className="mr-1 h-3 w-3" />
                      Bearbeiten
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#530A5D]" />
            Sponsor-Anfragen
          </CardTitle>
          <CardDescription>{contacts.length} Anfragen insgesamt</CardDescription>
        </CardHeader>
        <CardContent>
          {contacts.length > 0 ? (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div key={contact.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{contact.company_name}</p>
                      <p className="text-sm text-muted-foreground">{contact.contact_name} - {contact.email}</p>
                    </div>
                    <Badge variant="outline">{contact.status}</Badge>
                  </div>
                  {contact.interested_in ? (
                    <p className="mt-2 text-sm text-muted-foreground">Paket: {contact.interested_in}</p>
                  ) : null}
                  {contact.message ? <p className="mt-2 text-sm">{contact.message}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center">Noch keine Sponsor-Anfragen</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span className="hidden" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Sponsorpaket bearbeiten" : "Sponsorpaket erstellen"}</DialogTitle>
            <DialogDescription>Alle Inhalte werden direkt auf der Sponsoring-Seite übernommen.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pkg-name">Name</Label>
              <Input
                id="pkg-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Gold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-order">Display-Order</Label>
              <Input
                id="pkg-order"
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, displayOrder: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-color">Farbe (Hex)</Label>
              <Input
                id="pkg-color"
                value={form.color}
                onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                placeholder="#530A5D"
              />
            </div>
            <div className="space-y-2">
              <Label>Vorschau</Label>
              <div className="h-10 rounded-md border" style={{ backgroundColor: form.color || "#530A5D" }} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pkg-description">Beschreibung</Label>
              <Textarea
                id="pkg-description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pkg-benefits">Benefits (eine Zeile pro Benefit)</Label>
              <Textarea
                id="pkg-benefits"
                rows={8}
                value={form.benefitsText}
                onChange={(e) => setForm((prev) => ({ ...prev, benefitsText: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button onClick={() => void savePackage()} disabled={saving} className="bg-[#530A5D] text-white hover:bg-[#3f0847]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
