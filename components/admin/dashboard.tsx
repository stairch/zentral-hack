"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Mail, FolderOpen, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Stats {
  registrations: number
  newsletter: number
  teams: number
  documents: number
}

const statConfig = [
  { key: "registrations", label: "Anmeldungen", icon: Users, color: "#530A5D" },
  { key: "newsletter", label: "Newsletter", icon: Mail, color: "#D5C2F7" },
  { key: "teams", label: "Teams", icon: Users, color: "#E6FF17" },
  { key: "documents", label: "Dokumente", icon: FolderOpen, color: "#530A5D" }
]

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    registrations: 0,
    newsletter: 0,
    teams: 0,
    documents: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/admin/dashboard-stats", {
          credentials: "include"
        })

        if (res.ok) {
          const data = await res.json()
          setStats(data.data?.stats || stats)
        } else {
          toast.error("Fehler beim Laden der Statistiken")
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
        toast.error("Fehler beim Laden der Statistiken")
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
        <h1 className="text-foreground text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          ADMIN DASHBOARD
        </h1>
        <p className="text-muted-foreground mt-2">Übersicht über alle Anmeldungen und Aktivitäten</p>
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
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{ backgroundColor: stat.color + "20" }}>
                  <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Willkommen im Admin Dashboard</CardTitle>
          <CardDescription>Verwalte alle Hackathon-Aktivitäten von hier aus</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Nutze die Seitenleiste um zu den verschiedenen Admin-Funktionen zu navigieren:
          </p>
          <ul className="text-muted-foreground mt-4 list-inside list-disc space-y-2">
            <li>
              <strong>Anmeldungen</strong> - Verwalte alle registrierten Teilnehmer
            </li>
            <li>
              <strong>Teams</strong> - Erstelle und verwalte Teams für den Hackathon
            </li>
            <li>
              <strong>Kategorien</strong> - Passe Kategorie-Beschreibungen an
            </li>
            <li>
              <strong>Dokumente</strong> - Lade Materialien für Kategorien hoch
            </li>
            <li>
              <strong>E-Mails</strong> - Sende Newsletter und Kampagnen
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
