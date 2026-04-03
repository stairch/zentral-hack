"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  User as UserIcon,
  LogOut,
  Loader2,
  FileText,
  Users,
  Upload,
  Download,
  ExternalLink,
  Github,
  FolderOpen,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { TeamFilesComponent } from "@/components/team-files"

interface DashboardData {
  profile: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    role: string
    university: string | null
    study_program: string | null
    semester: number | null
    linkedin_url: string | null
  } | null
  registration: {
    id: string
    status: string
    dietary_restrictions: string | null
    allergies: string | null
    category: {
      id: string
      name: string
      slug: string
      description: string
    }
  } | null
  team: {
    id: string
    name: string
    description: string | null
    member_role: string
    category: { name: string }
  } | null
  teamFiles: Array<{
    id: string
    original_name: string
    file_size: number
    mime_type: string
    created_at: string
  }>
  teamRepos: Array<{
    id: string
    repository_url: string
    title: string
    description: string
    created_at: string
  }>
  categoryDocuments: Array<{
    id: string
    name: string
    description: string
    file_path: string
    created_at: string
  }>
  globalDocuments: Array<{
    id: string
    name: string
    description: string
    file_path: string
    created_at: string
  }>
}

export function DashboardContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const res = await fetch("/api/dashboard", { credentials: "include" })
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      router.push("/")
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#530A5D]" />
      </div>
    )
  }

  const profile = data?.profile
  const registration = data?.registration
  const team = data?.team
  const categoryDocuments = data?.categoryDocuments || []
  const globalDocuments = data?.globalDocuments || []

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl" style={{ fontFamily: "var(--font-display)" }}>
            <span className="text-[#530A5D]">ZENTRAL</span>{" "}
            <span className="text-[#E6FF17] bg-[#530A5D] px-2">HACK</span>
          </Link>
          <div className="flex items-center gap-3">
            {(user?.role === "admin" || user?.role === "category_partner") && (
              <Link href="/admin">
                <Button variant="outline" size="sm">Admin Panel</Button>
              </Link>
            )}
            <Button variant="outline" onClick={handleLogout} disabled={loggingOut} className="gap-2">
              {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Hallo, {profile?.first_name || user?.email}!
          </h1>
          <p className="text-muted-foreground">
            Willkommen in deinem Zentral Hack Dashboard
          </p>
        </motion.div>

        {/* Registration Status */}
        {registration ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="mb-8 border-2 border-[#530A5D]/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#530A5D]" />
                  {registration.category.name}
                </CardTitle>
                <CardDescription>{registration.category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant={registration.status === "confirmed" ? "default" : "outline"} className={registration.status === "confirmed" ? "bg-green-600" : ""}>
                  {registration.status === "confirmed" ? "✓ Anmeldung bestätigt" : "Ausstehend"}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="mb-8 bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <p className="text-amber-800">
                Du hast dich noch nicht für eine Kategorie angemeldet.{" "}
                <Link href="/anmeldung" className="underline font-medium">
                  Jetzt anmelden
                </Link>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="profile" className="gap-2">
              <UserIcon className="w-4 h-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="w-4 h-4" />
              Dokumente
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="w-4 h-4" />
              Team
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Dein Profil</CardTitle>
                <CardDescription>Deine Registrierungsdaten für den Zentral Hack</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">E-Mail</Label>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Name</Label>
                    <p className="font-medium">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                  </div>
                  {profile?.university && (
                    <div>
                      <Label className="text-muted-foreground text-sm">Hochschule</Label>
                      <p className="font-medium">{profile.university}</p>
                    </div>
                  )}
                  {profile?.study_program && (
                    <div>
                      <Label className="text-muted-foreground text-sm">Studiengang</Label>
                      <p className="font-medium">{profile.study_program}</p>
                    </div>
                  )}
                  {profile?.semester && (
                    <div>
                      <Label className="text-muted-foreground text-sm">Semester</Label>
                      <p className="font-medium">{profile.semester}. Semester</p>
                    </div>
                  )}
                  {profile?.linkedin_url && (
                    <div>
                      <Label className="text-muted-foreground text-sm">LinkedIn</Label>
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#530A5D] hover:underline flex items-center gap-1"
                      >
                        Profil ansehen
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="space-y-6">
              {/* Global Documents */}
              {globalDocuments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-[#530A5D]" />
                      Allgemeine Dokumente
                    </CardTitle>
                    <CardDescription>Dokumente und Ressourcen für alle Teilnehmer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {globalDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-[#530A5D]" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              {doc.description && <p className="text-sm text-muted-foreground">{doc.description}</p>}
                            </div>
                          </div>
                          <a href={`/api/download-file?fileId=${doc.id}`} className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <Download className="w-5 h-5 text-muted-foreground" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Category Documents */}
              <Card>
                <CardHeader>
                  <CardTitle>Kategorie-Dokumente</CardTitle>
                  <CardDescription>
                    Dokumente und Ressourcen für {registration?.category?.name || "deine Kategorie"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryDocuments.length > 0 ? (
                    <div className="space-y-3">
                      {categoryDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-[#530A5D]" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              {doc.description && <p className="text-sm text-muted-foreground">{doc.description}</p>}
                            </div>
                          </div>
                          <a href={`/api/download-file?fileId=${doc.id}`} className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <Download className="w-5 h-5 text-muted-foreground" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      {registration ? "Noch keine Dokumente verfügbar" : "Melde dich für eine Kategorie an, um Dokumente zu sehen"}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Team Documents */}
              {team && <TeamFilesComponent teamId={team.id} />}
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Dein Team</CardTitle>
                <CardDescription>Informationen zu deinem Hackathon-Team</CardDescription>
              </CardHeader>
              <CardContent>
                {team ? (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-muted-foreground text-sm">Team-Name</Label>
                      <p className="font-medium text-lg">{team.name}</p>
                    </div>
                    {team.description && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Beschreibung</Label>
                        <p>{team.description}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground text-sm">Kategorie</Label>
                      <p className="font-medium">{team.category.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Deine Rolle</Label>
                      <Badge variant="outline">
                        {team.member_role === "leader" ? "Team-Leader" : "Mitglied"}
                      </Badge>
                    </div>

                    {/* Team files & repos are shown in the documents tab */}
                    <p className="text-sm text-muted-foreground">
                      Team-Dokumente und GitHub-Repos findest du im Tab &quot;Dokumente&quot;
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">
                      Du bist noch keinem Team zugewiesen
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Teams werden während des Hackathons von den Admins erstellt
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
