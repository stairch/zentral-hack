"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  User as UserIcon,
  LogOut,
  Loader2,
  FileText,
  Users,
  Download,
  ExternalLink,
  FolderOpen
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { TeamFilesComponent } from "@/components/team-files"
import { BrandMark } from "@/components/brand-mark"
import { SponsorChallengeEditor } from "@/components/dashboard/sponsor-challenge-editor"
import { type SponsorChallengeRecord } from "@/lib/sponsor-challenge"

interface DashboardData {
  profile: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    role: string
    category_id: string | null
    category_slug: string | null
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
  sponsorChallenge: SponsorChallengeRecord | null
}

interface CategoryOption {
  id: string
  name: string
  slug: string
}

export function DashboardContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [challengeCategories, setChallengeCategories] = useState<CategoryOption[]>([])
  const [selectedChallengeCategoryId, setSelectedChallengeCategoryId] = useState("")
  const [adminChallenge, setAdminChallenge] = useState<SponsorChallengeRecord | null>(null)
  const [loadingAdminChallenge, setLoadingAdminChallenge] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (user?.role === "admin") {
      void initializeAdminChallengeEditor()
    }
  }, [user?.role, data?.profile?.category_id])

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

  async function initializeAdminChallengeEditor() {
    try {
      const res = await fetch("/api/categories", { credentials: "include" })
      if (!res.ok) return

      const json = await res.json()
      const categories = (json.data?.categories || []).map((category: { id: string; name: string; slug: string }) => ({
        id: category.id,
        name: category.name,
        slug: category.slug
      })) as CategoryOption[]

      setChallengeCategories(categories)
      if (categories.length === 0) {
        setSelectedChallengeCategoryId("")
        setAdminChallenge(null)
        return
      }

      const preferredCategoryId =
        (data?.profile?.category_id && categories.some((category) => category.id === data.profile?.category_id)
          ? data.profile.category_id
          : categories[0]?.id) || ""

      setSelectedChallengeCategoryId(preferredCategoryId)
      if (preferredCategoryId) {
        void fetchAdminChallenge(preferredCategoryId)
      }
    } catch (error) {
      console.error("Failed to initialize admin challenge editor:", error)
    }
  }

  async function fetchAdminChallenge(categoryId: string) {
    setLoadingAdminChallenge(true)
    try {
      const res = await fetch(`/api/sponsor/challenge?categoryId=${encodeURIComponent(categoryId)}`, {
        credentials: "include"
      })

      if (!res.ok) {
        setAdminChallenge(null)
        return
      }

      const json = await res.json()
      setAdminChallenge((json.data?.challenge as SponsorChallengeRecord | null) || null)
    } catch (error) {
      console.error("Failed to fetch admin challenge:", error)
      setAdminChallenge(null)
    } finally {
      setLoadingAdminChallenge(false)
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#530A5D]" />
      </div>
    )
  }

  const profile = data?.profile
  const registration = data?.registration
  const team = data?.team
  const categoryDocuments = data?.categoryDocuments || []
  const globalDocuments = data?.globalDocuments || []
  const sponsorChallenge = data?.sponsorChallenge || null
  const isAdmin = user?.role === "admin"
  const isSponsor = user?.role === "sponsor"
  const isChallengeManager = isSponsor || isAdmin
  const showChallengeTab = isChallengeManager
  const showTeamTab = !isChallengeManager
  const sponsorCategoryName = registration?.category?.name || profile?.category_slug?.replace(/-/g, " ") || "Deine Kategorie"
  const selectedChallengeCategory = challengeCategories.find((category) => category.id === selectedChallengeCategoryId)
  const challengeCategoryName = isAdmin ? selectedChallengeCategory?.name || "Kategorie" : sponsorCategoryName
  const challengeCategorySlug = isAdmin
    ? selectedChallengeCategory?.slug || "regional-impact"
    : registration?.category?.slug || profile?.category_slug || "regional-impact"
  const challengeCategoryId = isAdmin
    ? selectedChallengeCategoryId
    : registration?.category?.id || profile?.category_id || undefined

  return (
    <main className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border bg-card border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="inline-block" aria-label="Zentral Hack Startseite">
            <BrandMark className="w-32 sm:w-36" imageClassName="drop-shadow-sm" priority />
          </Link>
          <div className="flex items-center gap-3">
            {(user?.role === "admin" || user?.role === "category_partner") && (
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Admin Panel
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={handleLogout} disabled={loggingOut} className="gap-2">
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-foreground mb-2 text-3xl font-bold">
            Hallo, {profile?.first_name || user?.email}!
          </h1>
          <p className="text-muted-foreground">Willkommen in deinem Zentral Hack Dashboard</p>
        </motion.div>

        {/* Registration Status */}
        {showTeamTab && registration ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}>
            <Card className="mb-8 border-2 border-[#530A5D]/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#530A5D]" />
                  {registration.category.name}
                </CardTitle>
                <CardDescription>{registration.category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={registration.status === "confirmed" ? "default" : "outline"}
                  className={registration.status === "confirmed" ? "bg-green-600" : ""}>
                  {registration.status === "confirmed" ? "✓ Anmeldung bestätigt" : "Ausstehend"}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        ) : showTeamTab ? (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <p className="text-amber-800">
                Du hast dich noch nicht für eine Kategorie registriert.{" "}
                <Link href="/anmeldung" className="font-medium underline">
                  Jetzt registrieren
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Main Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className={`grid w-full ${(showTeamTab || showChallengeTab) ? "grid-cols-3" : "grid-cols-2"} lg:inline-grid lg:w-auto`}>
            <TabsTrigger value="profile" className="gap-2">
              <UserIcon className="h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Dokumente
            </TabsTrigger>
            {showChallengeTab && (
              <TabsTrigger value="challenge" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Challenges
              </TabsTrigger>
            )}
            {showTeamTab && (
              <TabsTrigger value="team" className="gap-2">
                <Users className="h-4 w-4" />
                Team
              </TabsTrigger>
            )}
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
                        className="flex items-center gap-1 font-medium text-[#530A5D] hover:underline">
                        Profil ansehen
                        <ExternalLink className="h-3 w-3" />
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
                      <FolderOpen className="h-5 w-5 text-[#530A5D]" />
                      Allgemeine Dokumente
                    </CardTitle>
                    <CardDescription>Dokumente und Ressourcen für alle Teilnehmer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {globalDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="border-border hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-[#530A5D]" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              {doc.description && (
                                <p className="text-muted-foreground text-sm">{doc.description}</p>
                              )}
                            </div>
                          </div>
                          <a
                            href={`/api/download-file?fileId=${doc.id}`}
                            className="hover:bg-muted rounded-lg p-2 transition-colors">
                            <Download className="text-muted-foreground h-5 w-5" />
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
                        <div
                          key={doc.id}
                          className="border-border hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-[#530A5D]" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              {doc.description && (
                                <p className="text-muted-foreground text-sm">{doc.description}</p>
                              )}
                            </div>
                          </div>
                          <a
                            href={`/api/download-file?fileId=${doc.id}`}
                            className="hover:bg-muted rounded-lg p-2 transition-colors">
                            <Download className="text-muted-foreground h-5 w-5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-8 text-center">
                      {registration
                        ? "Noch keine Dokumente verfügbar"
                        : "Melde dich für eine Kategorie an, um Dokumente zu sehen"}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Team Documents */}
              {team && <TeamFilesComponent teamId={team.id} />}
            </div>
          </TabsContent>

          {/* Team Tab */}
          {showTeamTab && (
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
                      <p className="text-lg font-medium">{team.name}</p>
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
                    <p className="text-muted-foreground text-sm">
                      Team-Dokumente und GitHub-Repos findest du im Tab &quot;Dokumente&quot;
                    </p>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                    <p className="text-muted-foreground mb-2">Du bist noch keinem Team zugewiesen</p>
                    <p className="text-muted-foreground text-sm">
                      Teams werden während des Hackathons von den Admins erstellt
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            </TabsContent>
          )}

          {/* Challenge Tab */}
          {showChallengeTab && (
            <TabsContent value="challenge">
              <div className="space-y-4">
                {isAdmin && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Challenge verwalten</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="challenge-category-select">Kategorie</Label>
                        <Select
                          value={selectedChallengeCategoryId}
                          onValueChange={(value) => {
                            setSelectedChallengeCategoryId(value)
                            void fetchAdminChallenge(value)
                          }}>
                          <SelectTrigger id="challenge-category-select">
                            <SelectValue placeholder="Kategorie wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {challengeCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {isAdmin && !selectedChallengeCategoryId ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground">Keine Kategorie verfügbar oder ausgewählt.</p>
                    </CardContent>
                  </Card>
                ) : loadingAdminChallenge ? (
                  <div className="flex min-h-[160px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#530A5D]" />
                  </div>
                ) : (
                  <SponsorChallengeEditor
                    categoryName={challengeCategoryName}
                    categorySlug={challengeCategorySlug}
                    categoryId={challengeCategoryId}
                    initialChallenge={isAdmin ? adminChallenge : sponsorChallenge}
                    onSaved={(challenge) => {
                      if (isAdmin) {
                        setAdminChallenge(challenge)
                      }
                    }}
                  />
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </main>
  )
}
