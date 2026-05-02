"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
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
  FolderOpen,
  Lock
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { TeamFilesComponent } from "@/components/team-files"
import { BrandMark } from "@/components/brand-mark"
import { SponsorChallengeEditor } from "@/components/dashboard/sponsor-challenge-editor"
import { AccountSettings } from "@/components/dashboard/account-settings"
import { type SponsorChallengeRecord } from "@/lib/sponsor-challenge"
import ComingSoon from "../ui/coming-soon"

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

interface DashboardContentProps {
  showChallenges: boolean
}

export function DashboardContent({ showChallenges }: DashboardContentProps) {
  const { user, logout, isLoading: isAuthLoading } = useAuth()
  const { language, setLanguage } = useLanguage()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [challengeCategories, setChallengeCategories] = useState<CategoryOption[]>([])
  const [selectedChallengeCategoryId, setSelectedChallengeCategoryId] = useState("")
  const [adminChallenge, setAdminChallenge] = useState<SponsorChallengeRecord | null>(null)
  const [loadingAdminChallenge, setLoadingAdminChallenge] = useState(false)

  useEffect(() => {
    if (isAuthLoading) return
    if (!user) {
      console.log("[Dashboard] No user found, redirecting to login")
      router.push("/auth/login")
    } else {
      fetchDashboardData()
    }
  }, [user, isAuthLoading, router])

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "category_partner") {
      void initializeAdminChallengeEditor()
    }
  }, [user?.role, data?.profile?.category_id])

  const t = {
    de: {
      adminPanel: "Admin Panel",
      logout: "Abmelden",
      greeting: (name: string) => `Hallo, ${name}!`,
      welcomeSubtitle: "Willkommen in deinem Zentral Hack Dashboard",
      registrationConfirmed: "✓ Anmeldung bestätigt",
      registrationPending: "Ausstehend",
      notRegistered: "Du hast dich noch nicht für eine Kategorie registriert.",
      registerNow: "Jetzt registrieren",
      tabProfile: "Profil",
      tabDocuments: "Dokumente",
      tabChallenges: "Challenges",
      tabTeam: "Team",
      profileTitle: "Dein Profil",
      profileSubtitle: "Deine Registrierungsdaten für den Zentral Hack",
      labelEmail: "E-Mail",
      labelName: "Name",
      labelUniversity: "Hochschule",
      labelStudyProgram: "Studiengang",
      labelSemester: "Semester",
      labelLinkedIn: "LinkedIn",
      viewProfile: "Profil ansehen",
      semesterSuffix: ". Semester",
      globalDocsTitle: "Allgemeine Dokumente",
      globalDocsSubtitle: "Dokumente und Ressourcen für alle Teilnehmer",
      categoryDocsTitle: "Kategorie-Dokumente",
      categoryDocsSubtitle: (name: string) => `Dokumente und Ressourcen für ${name}`,
      noDocsAvailable: "Noch keine Dokumente verfügbar",
      registerForDocs: "Melde dich für eine Kategorie an, um Dokumente zu sehen",
      teamTitle: "Dein Team",
      teamSubtitle: "Informationen zu deinem Hackathon-Team",
      teamName: "Team-Name",
      teamDescription: "Beschreibung",
      teamCategory: "Kategorie",
      teamRole: "Deine Rolle",
      teamRoleLeader: "Team-Leader",
      teamRoleMember: "Mitglied",
      teamDocsHint: 'Team-Dokumente und GitHub-Repos findest du im Tab "Dokumente"',
      noTeam: "Du bist noch keinem Team zugewiesen",
      noTeamNote: "Teams werden während des Hackathons von den Admins erstellt",
      manageChallenge: "Challenge verwalten",
      selectCategory: "Kategorie",
      selectCategoryPlaceholder: "Kategorie wählen",
      noCategorySelected: "Keine Kategorie verfügbar oder ausgewählt.",
      yourCategory: "Deine Kategorie",
      category: "Kategorie",
      homeAriaLabel: "Zentral Hack Startseite"
    },
    en: {
      adminPanel: "Admin Panel",
      logout: "Sign out",
      greeting: (name: string) => `Hello, ${name}!`,
      welcomeSubtitle: "Welcome to your Zentral Hack dashboard",
      registrationConfirmed: "✓ Registration confirmed",
      registrationPending: "Pending",
      notRegistered: "You haven't registered for a category yet.",
      registerNow: "Register now",
      tabProfile: "Profile",
      tabDocuments: "Documents",
      tabChallenges: "Challenges",
      tabTeam: "Team",
      profileTitle: "Your Profile",
      profileSubtitle: "Your registration details for Zentral Hack",
      labelEmail: "Email",
      labelName: "Name",
      labelUniversity: "University",
      labelStudyProgram: "Study program",
      labelSemester: "Semester",
      labelLinkedIn: "LinkedIn",
      viewProfile: "View profile",
      semesterSuffix: ". semester",
      globalDocsTitle: "General Documents",
      globalDocsSubtitle: "Documents and resources for all participants",
      categoryDocsTitle: "Category Documents",
      categoryDocsSubtitle: (name: string) => `Documents and resources for ${name}`,
      noDocsAvailable: "No documents available yet",
      registerForDocs: "Register for a category to see documents",
      teamTitle: "Your Team",
      teamSubtitle: "Information about your hackathon team",
      teamName: "Team name",
      teamDescription: "Description",
      teamCategory: "Category",
      teamRole: "Your role",
      teamRoleLeader: "Team leader",
      teamRoleMember: "Member",
      teamDocsHint: 'Team documents and GitHub repos can be found in the "Documents" tab',
      noTeam: "You haven't been assigned to a team yet",
      noTeamNote: "Teams are created by admins during the hackathon",
      manageChallenge: "Manage challenge",
      selectCategory: "Category",
      selectCategoryPlaceholder: "Select category",
      noCategorySelected: "No category available or selected.",
      yourCategory: "Your Category",
      category: "Category",
      homeAriaLabel: "Zentral Hack Home"
    }
  }[language]

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
      const categories = (json.data?.categories || []).map(
        (category: { id: string; name: string; slug: string }) => ({
          id: category.id,
          name: category.name,
          slug: category.slug
        })
      ) as CategoryOption[]

      // Category partner: auto-select their own category, no picker shown
      if (user?.role === "category_partner") {
        const myCategoryId = data?.profile?.category_id || user?.categoryId
        const myCategory = categories.find((c) => c.id === myCategoryId)
        if (myCategory) {
          setChallengeCategories([myCategory])
          setSelectedChallengeCategoryId(myCategory.id)
          void fetchAdminChallenge(myCategory.id)
        }
        return
      }

      // Admin: full category list with picker
      setChallengeCategories(categories)
      if (categories.length === 0) {
        setSelectedChallengeCategoryId("")
        setAdminChallenge(null)
        return
      }

      const preferredCategoryId =
        (data?.profile?.category_id &&
        categories.some((category) => category.id === data.profile?.category_id)
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
  const isCategoryPartner = user?.role === "category_partner"
  const isChallengeManager = isSponsor || isAdmin || isCategoryPartner
  const showChallengeTab = isChallengeManager
  const showTeamTab = !isChallengeManager
  const sponsorCategoryName =
    registration?.category?.name || profile?.category_slug?.replace(/-/g, " ") || t.yourCategory
  const selectedChallengeCategory = challengeCategories.find(
    (category) => category.id === selectedChallengeCategoryId
  )
  const challengeCategoryName =
    isAdmin || isCategoryPartner ? selectedChallengeCategory?.name || t.category : sponsorCategoryName
  const challengeCategorySlug =
    isAdmin || isCategoryPartner
      ? selectedChallengeCategory?.slug || "regional-impact"
      : registration?.category?.slug || profile?.category_slug || "regional-impact"
  const challengeCategoryId =
    isAdmin || isCategoryPartner
      ? selectedChallengeCategoryId || undefined
      : registration?.category?.id || profile?.category_id || undefined
  const dashboardCategoryId = registration?.category?.id || profile?.category_id || null
  const dashboardCategoryName =
    registration?.category?.name || profile?.category_slug?.replace(/-/g, " ") || null

  return (
    <main className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border bg-card border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="inline-block" aria-label={t.homeAriaLabel}>
            <BrandMark className="w-32 sm:w-36" imageClassName="drop-shadow-sm" priority />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {(user?.role === "admin" || user?.role === "category_partner") && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.adminPanel}</span>
                </Button>
              </Link>
            )}
            <Select value={language} onValueChange={(v) => setLanguage(v as "de" | "en")}>
              <SelectTrigger className="w-20 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="de">DE</SelectItem>
                <SelectItem value="en">EN</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleLogout} disabled={loggingOut} className="gap-2">
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              <span className="hidden sm:inline">{t.logout}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-foreground mb-2 text-2xl font-bold sm:text-3xl">
            {t.greeting(profile?.first_name || user?.email || "")}
          </h1>
          <p className="text-muted-foreground">{t.welcomeSubtitle}</p>
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
                  {registration.status === "confirmed" ? t.registrationConfirmed : t.registrationPending}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        ) : showTeamTab ? (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <p className="text-amber-800">
                {t.notRegistered}{" "}
                <Link href="/anmeldung" className="font-medium underline">
                  {t.registerNow}
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Main Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList
            className={`grid w-full ${showTeamTab || showChallengeTab ? "grid-cols-3" : "grid-cols-2"} sm:inline-grid sm:w-auto`}>
            <TabsTrigger value="profile" className="gap-2">
              <UserIcon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t.tabProfile}</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t.tabDocuments}</span>
            </TabsTrigger>
            {showChallengeTab && (
              <TabsTrigger value="challenge" className="gap-1.5">
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{t.tabChallenges}</span>
                {!showChallenges && (
                  <div className="text-muted-foreground flex items-center gap-1 rounded-sm border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-xs">
                    <Lock className="h-3 w-3" />
                  </div>
                )}
              </TabsTrigger>
            )}
            {showTeamTab && (
              <TabsTrigger value="team" className="gap-2">
                <Users className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{t.tabTeam}</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.profileTitle}</CardTitle>
                  <CardDescription>{t.profileSubtitle}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground text-sm">{t.labelEmail}</Label>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">{t.labelName}</Label>
                      <p className="font-medium">
                        {profile?.first_name} {profile?.last_name}
                      </p>
                    </div>
                    {profile?.university && (
                      <div>
                        <Label className="text-muted-foreground text-sm">{t.labelUniversity}</Label>
                        <p className="font-medium">{profile.university}</p>
                      </div>
                    )}
                    {profile?.study_program && (
                      <div>
                        <Label className="text-muted-foreground text-sm">{t.labelStudyProgram}</Label>
                        <p className="font-medium">{profile.study_program}</p>
                      </div>
                    )}
                    {profile?.semester && (
                      <div>
                        <Label className="text-muted-foreground text-sm">{t.labelSemester}</Label>
                        <p className="font-medium">
                          {profile.semester}
                          {t.semesterSuffix}
                        </p>
                      </div>
                    )}
                    {profile?.linkedin_url && (
                      <div>
                        <Label className="text-muted-foreground text-sm">{t.labelLinkedIn}</Label>
                        <a
                          href={profile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-medium text-[#530A5D] hover:underline">
                          {t.viewProfile}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <AccountSettings
                currentCategoryId={dashboardCategoryId}
                currentCategoryName={dashboardCategoryName}
                onUpdated={fetchDashboardData}
              />
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="space-y-6">
              {globalDocuments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-[#530A5D]" />
                      {t.globalDocsTitle}
                    </CardTitle>
                    <CardDescription>{t.globalDocsSubtitle}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {globalDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="border-border hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors">
                          <div className="flex min-w-0 items-center gap-3">
                            <FileText className="h-5 w-5 shrink-0 text-[#530A5D]" />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{doc.name}</p>
                              {doc.description && (
                                <p className="text-muted-foreground truncate text-sm">{doc.description}</p>
                              )}
                            </div>
                          </div>
                          <a
                            href={`/api/download-file?fileId=${doc.id}&type=document`}
                            className="hover:bg-muted rounded-lg p-2 transition-colors">
                            <Download className="text-muted-foreground h-5 w-5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>{t.categoryDocsTitle}</CardTitle>
                  <CardDescription>
                    {t.categoryDocsSubtitle(registration?.category?.name || t.yourCategory)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryDocuments.length > 0 ? (
                    <div className="space-y-3">
                      {categoryDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="border-border hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors">
                          <div className="flex min-w-0 items-center gap-3">
                            <FileText className="h-5 w-5 shrink-0 text-[#530A5D]" />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{doc.name}</p>
                              {doc.description && (
                                <p className="text-muted-foreground truncate text-sm">{doc.description}</p>
                              )}
                            </div>
                          </div>
                          <a
                            href={`/api/download-file?fileId=${doc.id}&type=document`}
                            className="hover:bg-muted rounded-lg p-2 transition-colors">
                            <Download className="text-muted-foreground h-5 w-5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-8 text-center">
                      {registration ? t.noDocsAvailable : t.registerForDocs}
                    </p>
                  )}
                </CardContent>
              </Card>

              {team && <TeamFilesComponent teamId={team.id} />}
            </div>
          </TabsContent>

          {/* Team Tab */}
          {showTeamTab && (
            <TabsContent value="team">
              <Card>
                <CardHeader>
                  <CardTitle>{t.teamTitle}</CardTitle>
                  <CardDescription>{t.teamSubtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  {team ? (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-muted-foreground text-sm">{t.teamName}</Label>
                        <p className="text-lg font-medium">{team.name}</p>
                      </div>
                      {team.description && (
                        <div>
                          <Label className="text-muted-foreground text-sm">{t.teamDescription}</Label>
                          <p>{team.description}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-muted-foreground text-sm">{t.teamCategory}</Label>
                        <p className="font-medium">{team.category.name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">{t.teamRole}</Label>
                        <Badge variant="outline">
                          {team.member_role === "leader" ? t.teamRoleLeader : t.teamRoleMember}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">{t.teamDocsHint}</p>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                      <p className="text-muted-foreground mb-2">{t.noTeam}</p>
                      <p className="text-muted-foreground text-sm">{t.noTeamNote}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Challenge Tab */}
          {showChallengeTab && (
            <TabsContent value="challenge">
              {showChallenges ? (
                <div className="space-y-4">
                  {isAdmin && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t.manageChallenge}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label htmlFor="challenge-category-select">{t.selectCategory}</Label>
                          <Select
                            value={selectedChallengeCategoryId}
                            onValueChange={(value) => {
                              setSelectedChallengeCategoryId(value)
                              void fetchAdminChallenge(value)
                            }}>
                            <SelectTrigger id="challenge-category-select">
                              <SelectValue placeholder={t.selectCategoryPlaceholder} />
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
                        <p className="text-muted-foreground">{t.noCategorySelected}</p>
                      </CardContent>
                    </Card>
                  ) : loadingAdminChallenge || (isCategoryPartner && !selectedChallengeCategoryId) ? (
                    <div className="flex min-h-[160px] items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#530A5D]" />
                    </div>
                  ) : (
                    <SponsorChallengeEditor
                      categoryName={challengeCategoryName}
                      categorySlug={challengeCategorySlug}
                      categoryId={challengeCategoryId}
                      initialChallenge={isAdmin || isCategoryPartner ? adminChallenge : sponsorChallenge}
                      onSaved={(challenge) => {
                        if (isAdmin || isCategoryPartner) setAdminChallenge(challenge)
                      }}
                    />
                  )}
                </div>
              ) : (
                <ComingSoon />
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </main>
  )
}
