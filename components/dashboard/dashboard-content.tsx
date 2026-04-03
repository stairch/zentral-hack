"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  User as UserIcon,
  LogOut,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"

export function DashboardContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
      router.push("/")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          WILLKOMMEN ZURÜCK
        </h1>
        <p className="text-muted-foreground mt-2">
          Schön, dich wiederzusehen, {user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Mein Profil
            </CardTitle>
            <CardDescription>Verwalte deine Kontodaten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Email: <span className="font-medium text-foreground">{user?.email}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Rolle: <span className="font-medium text-foreground capitalize">{user?.role}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Abmelden</CardTitle>
            <CardDescription>Beende deine aktuelle Sitzung</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLogout}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Abmelden
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface DashboardContentProps {
  user: User
  profile: {
    first_name: string | null
    last_name: string | null
    email: string
    university: string | null
    study_program: string | null
    semester: number | null
    linkedin_url: string | null
  } | null
  registration: {
    id: string
    category: {
      id: string
      name: string
      slug: string
      description: string
      color: string
    }
    dietary_restrictions: string | null
    allergies: string | null
  } | null
  team: {
    id: string
    name: string
    github_url: string | null
    description: string | null
    category: {
      name: string
    }
  } | null
  categoryDocuments: Array<{
    id: string
    name: string
    description: string | null
    file_url: string
    file_type: string | null
    created_at: string
  }> | null
  teamDocuments: Array<{
    id: string
    name: string
    description: string | null
    file_url: string
    file_type: string | null
    created_at: string
  }> | null
}

export function DashboardContent({
  user,
  profile,
  registration,
  team,
  categoryDocuments,
  teamDocuments,
}: DashboardContentProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !team) return

    setUploading(true)
    try {
      const file = e.target.files[0]
      const formData = new FormData()
      formData.append("file", file)
      formData.append("teamId", team.id)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload fehlgeschlagen")

      router.refresh()
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl" style={{ fontFamily: "var(--font-display)" }}>
            <span className="text-[#530A5D]">ZENTRAL</span>{" "}
            <span className="text-[#E6FF17] bg-[#530A5D] px-2">HACK</span>
          </Link>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Abmelden
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Hallo, {profile?.first_name || user.email}!
          </h1>
          <p className="text-muted-foreground">
            Willkommen in deinem Zentral Hack Dashboard
          </p>
        </motion.div>

        {/* Registration Status */}
        {registration ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-8 border-2" style={{ borderColor: registration.category.color }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: registration.category.color }}
                  />
                  {registration.category.name}
                </CardTitle>
                <CardDescription>{registration.category.description}</CardDescription>
              </CardHeader>
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

        {/* Main content */}
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
                    <p className="font-medium">{user.email}</p>
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
              {/* Category Documents */}
              <Card>
                <CardHeader>
                  <CardTitle>Kategorie-Dokumente</CardTitle>
                  <CardDescription>
                    Dokumente und Ressourcen für {registration?.category?.name || "deine Kategorie"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryDocuments && categoryDocuments.length > 0 ? (
                    <div className="space-y-3">
                      {categoryDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-[#530A5D]" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              {doc.description && (
                                <p className="text-sm text-muted-foreground">{doc.description}</p>
                              )}
                            </div>
                          </div>
                          <a
                            href={doc.file_url}
                            download
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                          >
                            <Download className="w-5 h-5 text-muted-foreground" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Noch keine Dokumente verfügbar
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Team Documents */}
              {team && (
                <Card>
                  <CardHeader>
                    <CardTitle>Team-Dokumente</CardTitle>
                    <CardDescription>
                      Dokumente und Dateien von deinem Team
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {teamDocuments && teamDocuments.length > 0 ? (
                      <div className="space-y-3">
                        {teamDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-[#530A5D]" />
                              <div>
                                <p className="font-medium">{doc.name}</p>
                                {doc.description && (
                                  <p className="text-sm text-muted-foreground">{doc.description}</p>
                                )}
                              </div>
                            </div>
                            <a
                              href={doc.file_url}
                              download
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                              <Download className="w-5 h-5 text-muted-foreground" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Noch keine Team-Dokumente
                      </p>
                    )}

                    {/* Upload */}
                    <div className="mt-6 pt-6 border-t border-border">
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-[#530A5D] hover:bg-muted/50 transition-colors">
                          {uploading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-muted-foreground" />
                              <span className="text-muted-foreground">Datei hochladen</span>
                            </>
                          )}
                        </div>
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Dein Team</CardTitle>
                <CardDescription>
                  Informationen zu deinem Hackathon-Team
                </CardDescription>
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
                    {team.github_url && (
                      <div>
                        <Label className="text-muted-foreground text-sm">GitHub Repository</Label>
                        <a
                          href={team.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#530A5D] hover:underline"
                        >
                          <Github className="w-4 h-4" />
                          Repository ansehen
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
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
