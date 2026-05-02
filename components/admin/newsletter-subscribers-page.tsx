"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface Subscriber {
  email: string
  subscribed: boolean
  created_at: string
}

const copy = {
  de: {
    heading: "NEWSLETTER ABONNENTEN",
    subtitle: "Verwalte Weekly-Update Empfänger",
    activeRecipients: "aktive Empfänger",
    cardTitle: "Abonnenten",
    selected: "ausgewählt",
    all: "Alle",
    cardDesc: "Wähle Empfänger aus und exportiere sie oder melde sie nur von Weekly Updates ab",
    exportCsv: "CSV Exportieren",
    unsubscribeWeekly: "Weekly abmelden",
    selectAll: "Alle auswählen",
    subscribedOn: "Abonniert am",
    noSubscribers: "Keine Newsletter Abonnenten vorhanden",
    loadError: "Fehler beim Laden der Abonnenten",
    noEmailsExport: "Keine E-Mails zum Exportieren ausgewählt",
    exported: "E-Mails exportiert",
    noEmailsUnsubscribe: "Bitte wählen Sie E-Mails aus",
    unsubscribeConfirm: "Möchten Sie",
    unsubscribeConfirm2: "Abonnenten nur von Weekly Updates abmelden?",
    unsubscribeSuccess: "Von Weekly Updates abgemeldet",
    unsubscribeError: "Fehler beim Abmelden"
  },
  en: {
    heading: "NEWSLETTER SUBSCRIBERS",
    subtitle: "Manage weekly update recipients",
    activeRecipients: "active recipients",
    cardTitle: "Subscribers",
    selected: "selected",
    all: "All",
    cardDesc: "Select recipients to export them or unsubscribe them from weekly updates",
    exportCsv: "Export CSV",
    unsubscribeWeekly: "Unsubscribe from weekly",
    selectAll: "Select all",
    subscribedOn: "Subscribed on",
    noSubscribers: "No newsletter subscribers yet",
    loadError: "Failed to load subscribers",
    noEmailsExport: "No emails selected for export",
    exported: "emails exported",
    noEmailsUnsubscribe: "Please select emails first",
    unsubscribeConfirm: "Do you want to unsubscribe",
    unsubscribeConfirm2: "subscribers from weekly updates?",
    unsubscribeSuccess: "Unsubscribed from weekly updates",
    unsubscribeError: "Failed to unsubscribe"
  }
} as const

export function NewsletterSubscribersPage() {
  const { language } = useLanguage()
  const text = copy[language]
  const dateLocale = language === "en" ? "en-GB" : "de-CH"

  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())
  const [allSelected, setAllSelected] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [unsubscribing, setUnsubscribing] = useState(false)

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/admin/email-subscribers", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setSubscribers(data.data?.subscribers || [])
        }
      } catch (error) {
        console.error("Failed to fetch subscribers:", error)
        toast.error(text.loadError)
      } finally {
        setLoading(false)
      }
    }
    fetchSubscribers()
  }, [])

  const toggleEmail = (email: string) => {
    const newSelected = new Set(selectedEmails)
    if (newSelected.has(email)) {
      newSelected.delete(email)
    } else {
      newSelected.add(email)
    }
    setSelectedEmails(newSelected)
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedEmails(new Set())
      setAllSelected(false)
    } else {
      setSelectedEmails(new Set(subscribers.map((s) => s.email)))
      setAllSelected(true)
    }
  }

  const handleExport = () => {
    const emailsToExport =
      selectedEmails.size > 0 ? Array.from(selectedEmails) : subscribers.map((s) => s.email)
    if (emailsToExport.length === 0) {
      toast.error(text.noEmailsExport)
      return
    }
    const csvContent = ["email", ...emailsToExport].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`${emailsToExport.length} ${text.exported}`)
  }

  const handleBulkUnsubscribe = async () => {
    if (selectedEmails.size === 0) {
      toast.error(text.noEmailsUnsubscribe)
      return
    }
    setConfirmOpen(true)
  }

  const confirmUnsubscribe = async () => {
    try {
      setUnsubscribing(true)
      const res = await fetch("/api/admin/newsletter-unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emails: Array.from(selectedEmails) })
      })
      if (res.ok) {
        setSubscribers(subscribers.filter((s) => !selectedEmails.has(s.email)))
        setSelectedEmails(new Set())
        setAllSelected(false)
        toast.success(text.unsubscribeSuccess)
        setConfirmOpen(false)
      } else {
        toast.error(text.unsubscribeError)
      }
    } catch (error) {
      console.error("Unsubscribe error:", error)
      toast.error(text.unsubscribeError)
    } finally {
      setUnsubscribing(false)
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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-foreground text-3xl font-bold">{text.heading}</h1>
        <p className="text-muted-foreground mt-2">
          {text.subtitle} – {subscribers.length} {text.activeRecipients}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {text.cardTitle} (
                {selectedEmails.size > 0 ? `${selectedEmails.size} ${text.selected}` : text.all})
              </CardTitle>
              <CardDescription>{text.cardDesc}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                {text.exportCsv}
              </Button>
              {selectedEmails.size > 0 && (
                <Button variant="destructive" size="sm" onClick={handleBulkUnsubscribe}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {text.unsubscribeWeekly}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {subscribers.length > 0 ? (
            <div className="space-y-2">
              <div className="bg-muted flex items-center gap-3 rounded p-3">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                <span className="text-sm font-medium">
                  {text.selectAll} ({subscribers.length})
                </span>
              </div>
              <div className="max-h-96 space-y-1 overflow-y-auto">
                {subscribers.map((sub) => (
                  <div
                    key={sub.email}
                    className="border-border hover:bg-muted/50 flex items-center gap-3 rounded border p-3">
                    <Checkbox
                      checked={selectedEmails.has(sub.email)}
                      onCheckedChange={() => toggleEmail(sub.email)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{sub.email}</p>
                      <p className="text-muted-foreground text-xs">
                        {text.subscribedOn} {new Date(sub.created_at).toLocaleDateString(dateLocale)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center">{text.noSubscribers}</p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={language === "en" ? "Unsubscribe from weekly updates?" : "Von Weekly Updates abmelden?"}
        description={`${text.unsubscribeConfirm} ${selectedEmails.size} ${text.unsubscribeConfirm2}`}
        confirmLabel={language === "en" ? "Unsubscribe" : "Abmelden"}
        cancelLabel={language === "en" ? "Cancel" : "Abbrechen"}
        onConfirm={confirmUnsubscribe}
        loading={unsubscribing}
      />
    </div>
  )
}
