"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Mail, FolderOpen, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"

interface Stats {
  registrations: number
  newsletter: number
  teams: number
  documents: number
}

const copy = {
  de: {
    heading: "ADMIN DASHBOARD",
    subtitle: "Übersicht über alle Anmeldungen und Aktivitäten",
    registrations: "Anmeldungen",
    newsletter: "Newsletter",
    teams: "Teams",
    documents: "Dokumente",
    loadError: "Fehler beim Laden der Statistiken",
    welcome: "Willkommen im Admin Dashboard",
    welcomeDesc: "Verwalte alle Hackathon-Aktivitäten von hier aus",
    navHint: "Nutze die Seitenleiste um zu den verschiedenen Admin-Funktionen zu navigieren:",
    navRegistrations: "Anmeldungen",
    navRegistrationsDesc: "Verwalte alle registrierten Teilnehmer",
    navTeams: "Teams",
    navTeamsDesc: "Erstelle und verwalte Teams für den Hackathon",
    navCategories: "Kategorien",
    navCategoriesDesc: "Passe Kategorie-Beschreibungen an",
    navDocuments: "Dokumente",
    navDocumentsDesc: "Lade Materialien für Kategorien hoch",
    navEmails: "E-Mails",
    navEmailsDesc: "Sende Newsletter und Kampagnen"
  },
  en: {
    heading: "ADMIN DASHBOARD",
    subtitle: "Overview of all registrations and activities",
    registrations: "Registrations",
    newsletter: "Newsletter",
    teams: "Teams",
    documents: "Documents",
    loadError: "Failed to load statistics",
    welcome: "Welcome to the Admin Dashboard",
    welcomeDesc: "Manage all hackathon activities from here",
    navHint: "Use the sidebar to navigate to the various admin functions:",
    navRegistrations: "Registrations",
    navRegistrationsDesc: "Manage all registered participants",
    navTeams: "Teams",
    navTeamsDesc: "Create and manage teams for the hackathon",
    navCategories: "Categories",
    navCategoriesDesc: "Customize category descriptions",
    navDocuments: "Documents",
    navDocumentsDesc: "Upload materials for categories",
    navEmails: "Emails",
    navEmailsDesc: "Send newsletters and campaigns"
  }
} as const

export function AdminDashboard() {
  const { language } = useLanguage()
  const text = copy[language]

  const [stats, setStats] = useState<Stats>({
    registrations: 0,
    newsletter: 0,
    teams: 0,
    documents: 0
  })
  const [loading, setLoading] = useState(true)

  const statConfig = [
    { key: "registrations", label: text.registrations, icon: Users },
    { key: "newsletter", label: text.newsletter, icon: Mail },
    { key: "teams", label: text.teams, icon: Users },
    { key: "documents", label: text.documents, icon: FolderOpen }
  ]

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/admin/dashboard-stats", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setStats(data.data?.stats || stats)
        } else {
          toast.error(text.loadError)
        }
      } catch {
        toast.error(text.loadError)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

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
        <h1 className="font-display text-foreground text-3xl font-bold">{text.heading}</h1>
        <p className="text-muted-foreground mt-2">{text.subtitle}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statConfig.map((stat) => (
          <Card key={stat.key}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold">{stats[stat.key as keyof Stats]}</p>
                </div>
                <div className="bg-secondary flex h-12 w-12 items-center justify-center rounded-lg">
                  <stat.icon className="text-primary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{text.welcome}</CardTitle>
          <CardDescription>{text.welcomeDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{text.navHint}</p>
          <ul className="text-muted-foreground mt-4 list-inside list-disc space-y-2">
            <li>
              <strong>{text.navRegistrations}</strong> – {text.navRegistrationsDesc}
            </li>
            <li>
              <strong>{text.navTeams}</strong> – {text.navTeamsDesc}
            </li>
            <li>
              <strong>{text.navCategories}</strong> – {text.navCategoriesDesc}
            </li>
            <li>
              <strong>{text.navDocuments}</strong> – {text.navDocumentsDesc}
            </li>
            <li>
              <strong>{text.navEmails}</strong> – {text.navEmailsDesc}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
