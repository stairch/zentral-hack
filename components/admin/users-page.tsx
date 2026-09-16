"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Search,
  UserCog,
  Shield,
  Users,
  Loader2,
  Trash2,
  AlertTriangle,
  UserPlus,
  Eye,
  Download,
  MoreVertical
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"

interface Registration {
  id: string
  category_id: string
  category_name: string
  status: string
  university: string | null
  study_program: string | null
  semester: string | null
  allergies: string | null
  dietary_restrictions: string | null
  intolerances: string | null
  created_at: string
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: "user" | "category_partner" | "sponsor" | "admin"
  is_active: boolean
  category_name: string | null
  admin_role_id: string | null
  admin_role_name: string | null
  email_verified: boolean
  registrations: Registration[] | null
  created_at: string
}

interface Category {
  id: string
  name: string
}

interface AdminRole {
  id: string
  name: string
  category_id: string | null
  category_name: string | null
}

const copy = {
  de: {
    heading: "Benutzerverwaltung",
    subtitleAdmin: "Alle registrierten Benutzer verwalten und Rollen zuweisen",
    subtitlePartner: "Teilnehmer deiner Kategorie",
    total: "Gesamt",
    superAdmins: "Super Admins",
    categoryAdmins: "Kategorien-Admins",
    sponsors: "Sponsoren",
    participants: "Teilnehmer",
    searchPlaceholder: "Nach Name oder E-Mail suchen...",
    filterAllRoles: "Alle Rollen",
    filterAllCategories: "Alle Kategorien",
    exportCsv: "CSV Export",
    exportEmpty: "Keine Daten zum Exportieren",
    exportSuccess: "Benutzer exportiert",
    viewRegistrations: "Anmeldedaten ansehen",
    registrationDetails: "Anmeldedaten",
    registrationDetailsDesc: "Anmeldungen von",
    noRegistrations: "Keine Anmeldungen vorhanden",
    university: "Hochschule",
    studyProgram: "Studiengang",
    semester: "Semester",
    allergies: "Allergien",
    dietaryRestrictions: "Diätetische Einschränkungen",
    intolerances: "Unverträglichkeiten",
    registeredOn: "Angemeldet am",
    statusConfirmed: "Bestätigt",
    statusPending: "Ausstehend",
    statusCancelled: "Storniert",
    close: "Schließen",
    roleSuperAdmin: "Super Admin",
    roleCategoryAdmin: "Kategorien-Admin",
    roleSponsor: "Sponsor",
    roleUser: "Teilnehmer",
    colName: "Name",
    colEmail: "E-Mail",
    colRole: "Rolle",
    colCategory: "Kategorie",
    colStatus: "Status",
    colRegistered: "Registriert am",
    colActions: "Aktionen",
    noUsers: "Keine Benutzer gefunden",
    self: "(Du)",
    active: "Aktiv",
    deactivated: "Deaktiviert",
    changeRole: "Rolle ändern",
    changeRoleDesc: "Wähle die neue Rolle für",
    newRole: "Neue Rolle",
    warningAdminTitle: "Achtung: Super Admin Rolle",
    warningAdminText:
      "Super Admins haben vollen Zugriff auf alle Bereiche des Admin-Panels, inklusive aller Benutzerdaten, Rollen und Einstellungen.",
    warningElevatedText:
      "Diese Rolle erhält Zugriff auf die Anmelde- und Teilnehmerdaten der gewählten Kategorie.",
    category: "Kategorie",
    categoryPlaceholder: "Kategorie wählen...",
    cancel: "Abbrechen",
    assign: "Zuweisen",
    deleteUser: "Benutzer löschen",
    deleteConfirm1: "Bist du sicher, dass du",
    deleteConfirm2: "löschen möchtest?",
    deleteWarning:
      "Diese Aktion kann nicht rückgängig gemacht werden. Alle Anmeldedaten des Benutzers werden gelöscht. Hochgeladene Dokumente bleiben erhalten.",
    deleteButton: "Löschen",
    finalDeleteButton: "Endgültig löschen",
    categoryRequired: "Bitte wähle eine Kategorie aus",
    roleUpdated: "Rolle aktualisiert",
    roleUpdateError: "Fehler beim Aktualisieren",
    deleteSuccess: "wurde gelöscht",
    deleteError: "Fehler beim Löschen",
    createUser: "Benutzer erstellen",
    createUserDesc: "Neuen Benutzer-Account anlegen und Rolle zuweisen.",
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail",
    password: "Passwort",
    passwordHint: "Mindestens 8 Zeichen. Der Benutzer sollte das Passwort nach dem ersten Login ändern.",
    role: "Rolle",
    create: "Erstellen",
    createSuccess: "Benutzer wurde erstellt",
    createError: "Fehler beim Erstellen"
  },
  en: {
    heading: "User Management",
    subtitleAdmin: "Manage all registered users and assign roles",
    subtitlePartner: "Participants in your category",
    total: "Total",
    superAdmins: "Super Admins",
    categoryAdmins: "Category Admins",
    sponsors: "Sponsors",
    participants: "Participants",
    searchPlaceholder: "Search by name or email...",
    filterAllRoles: "All Roles",
    filterAllCategories: "All Categories",
    exportCsv: "Export as CSV",
    exportEmpty: "No data to export",
    exportSuccess: "Users exported",
    viewRegistrations: "View registration data",
    registrationDetails: "Registration data",
    registrationDetailsDesc: "Registrations for",
    noRegistrations: "No registrations available",
    university: "University",
    studyProgram: "Study program",
    semester: "Semester",
    allergies: "Allergies",
    dietaryRestrictions: "Dietary restrictions",
    intolerances: "Intolerances",
    registeredOn: "Registered on",
    statusConfirmed: "Confirmed",
    statusPending: "Pending",
    statusCancelled: "Cancelled",
    close: "Close",
    roleSuperAdmin: "Super Admin",
    roleCategoryAdmin: "Category Admin",
    roleSponsor: "Sponsor",
    roleUser: "Participant",
    colName: "Name",
    colEmail: "Email",
    colRole: "Role",
    colCategory: "Category",
    colStatus: "Status",
    colRegistered: "Registered on",
    colActions: "Actions",
    noUsers: "No users found",
    self: "(You)",
    active: "Active",
    deactivated: "Deactivated",
    changeRole: "Change Role",
    changeRoleDesc: "Select the new role for",
    newRole: "New role",
    warningAdminTitle: "Warning: Super Admin role",
    warningAdminText:
      "Super Admins have full access to all areas of the admin panel, including all user data, roles, and settings.",
    warningElevatedText:
      "This role grants access to the registration and participant data of the chosen category.",
    category: "Category",
    categoryPlaceholder: "Select category...",
    cancel: "Cancel",
    assign: "Assign",
    deleteUser: "Delete User",
    deleteConfirm1: "Are you sure you want to delete",
    deleteConfirm2: "?",
    deleteWarning:
      "This action cannot be undone. All registration data for this user will be deleted. Uploaded documents remain available.",
    deleteButton: "Delete",
    finalDeleteButton: "Delete permanently",
    categoryRequired: "Please select a category",
    roleUpdated: "Role updated",
    roleUpdateError: "Failed to update",
    deleteSuccess: "was deleted",
    deleteError: "Failed to delete",
    createUser: "Create User",
    createUserDesc: "Create a new user account and assign a role.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    password: "Password",
    passwordHint: "At least 8 characters. The user should change the password after their first login.",
    role: "Role",
    create: "Create",
    createSuccess: "User created",
    createError: "Failed to create user"
  }
} as const

export function UsersAdminPage() {
  const { user: currentUser } = useAuth()
  const { language } = useLanguage()
  const text = copy[language]

  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)

  const [detailsUser, setDetailsUser] = useState<User | null>(null)

  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    userId: string
    currentRole: string
    newRole: string
    userName: string
  } | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [selectedAdminRoleId, setSelectedAdminRoleId] = useState("")

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; email: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "user",
    categoryId: "",
    adminRoleId: ""
  })

  const isAdmin = currentUser?.role === "admin"

  const roleBadgeMap: Record<string, { label: string; className: string }> = {
    admin: { label: text.roleSuperAdmin, className: "bg-red-600 text-white" },
    category_partner: { label: text.roleCategoryAdmin, className: "bg-violet-600 text-white" },
    sponsor: { label: text.roleSponsor, className: "bg-[#530A5D] text-white" },
    user: { label: text.roleUser, className: "bg-gray-500 text-white" }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [usersRes, catsRes, rolesRes] = await Promise.all([
        fetch("/api/admin/users", { credentials: "include" }),
        fetch("/api/categories", { credentials: "include" }),
        fetch("/api/admin/roles", { credentials: "include" })
      ])
      if (usersRes.ok) {
        const json = await usersRes.json()
        setUsers(json.data?.users || [])
      }
      if (catsRes.ok) {
        const json = await catsRes.json()
        setCategories(json.data?.categories || [])
      }
      if (rolesRes.ok) {
        const json = await rolesRes.json()
        setAdminRoles(json.data?.roles || [])
      }
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }

  function openRoleChangeModal(user: User) {
    setPendingRoleChange({
      userId: user.id,
      currentRole: user.role,
      newRole: user.role,
      userName: `${user.first_name} ${user.last_name}`
    })
    setSelectedCategoryId("")
    setSelectedAdminRoleId("")
    setRoleDialogOpen(true)
  }

  function selectNewRole(role: string) {
    setPendingRoleChange((prev) => (prev ? { ...prev, newRole: role } : prev))
    setSelectedCategoryId("")
    setSelectedAdminRoleId("")
  }

  async function confirmRoleChange() {
    if (!pendingRoleChange) return
    const { userId, newRole } = pendingRoleChange
    const needsAssignment = newRole === "category_partner" || newRole === "sponsor"

    if (needsAssignment) {
      const isCategoryPartner = newRole === "category_partner"
      if (isCategoryPartner && selectedAdminRoleId) {
        // Assign via custom role — category resolved server-side
        await updateRole(userId, newRole, null, selectedAdminRoleId)
      } else if (selectedCategoryId) {
        await updateRole(userId, newRole, selectedCategoryId, null)
      } else {
        toast.error(text.categoryRequired)
        return
      }
    } else {
      await updateRole(userId, newRole, null, null)
    }
    setRoleDialogOpen(false)
    setPendingRoleChange(null)
  }

  async function updateRole(
    userId: string,
    newRole: string,
    categoryId: string | null,
    adminRoleId: string | null
  ) {
    setUpdatingUser(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, role: newRole, categoryId, adminRoleId })
      })
      if (res.ok) {
        const role = adminRoleId ? adminRoles.find((r) => r.id === adminRoleId) : null
        const catName =
          role?.category_name ||
          (categoryId ? categories.find((c) => c.id === categoryId)?.name || null : null)
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  role: newRole as User["role"],
                  category_name: catName,
                  admin_role_id: adminRoleId,
                  admin_role_name: role?.name || null
                }
              : u
          )
        )
        toast.success(text.roleUpdated)
      } else {
        const err = await res.json()
        toast.error(err.error || text.roleUpdateError)
      }
    } catch (err) {
      console.error("Failed to update role:", err)
      toast.error(text.roleUpdateError)
    } finally {
      setUpdatingUser(null)
    }
  }

  function openDeleteDialog(user: User) {
    setPendingDelete({
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`.trim() || user.email
    })
    setDeleteDialogOpen(true)
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users?id=${pendingDelete.id}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== pendingDelete.id))
        toast.success(`${pendingDelete.name} ${text.deleteSuccess}`)
        setDeleteDialogOpen(false)
        setPendingDelete(null)
      } else {
        const err = await res.json()
        toast.error(err.error || text.deleteError)
      }
    } catch (err) {
      console.error("Failed to delete user:", err)
      toast.error(text.deleteError)
    } finally {
      setDeleting(false)
    }
  }

  async function createUser() {
    if (!createForm.email || !createForm.password || !createForm.firstName || !createForm.lastName) {
      toast.error(text.categoryRequired)
      return
    }
    const needsAssignment = createForm.role === "category_partner" || createForm.role === "sponsor"
    const hasAssignment = createForm.adminRoleId || createForm.categoryId
    if (needsAssignment && !hasAssignment) {
      toast.error(text.categoryRequired)
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: createForm.email,
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          password: createForm.password,
          role: createForm.role,
          categoryId: createForm.categoryId || null,
          adminRoleId: createForm.adminRoleId || null
        })
      })
      if (res.ok) {
        const json = await res.json()
        setUsers((prev) => [json.data.user, ...prev])
        toast.success(text.createSuccess)
        setCreateDialogOpen(false)
        setCreateForm({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          role: "user",
          categoryId: "",
          adminRoleId: ""
        })
      } else {
        const err = await res.json()
        toast.error(err.error || text.createError)
      }
    } catch {
      toast.error(text.createError)
    } finally {
      setCreating(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    const matchesCategory =
      categoryFilter === "all" ||
      (u.registrations?.some((r) => r.category_id === categoryFilter) ?? false) ||
      categories.find((c) => c.id === categoryFilter)?.name === u.category_name
    return matchesSearch && matchesRole && matchesCategory
  })

  function statusLabel(status: string) {
    if (status === "confirmed") return text.statusConfirmed
    if (status === "pending") return text.statusPending
    if (status === "cancelled") return text.statusCancelled
    return status
  }

  function handleExport() {
    if (filteredUsers.length === 0) {
      toast.error(text.exportEmpty)
      return
    }

    const headers = [
      text.colName,
      text.colEmail,
      text.colRole,
      text.category,
      "Status",
      text.university,
      text.studyProgram,
      text.semester,
      text.allergies,
      text.dietaryRestrictions,
      text.intolerances,
      text.colRegistered
    ]

    const rows = filteredUsers.flatMap((u) => {
      const name = `${u.first_name} ${u.last_name}`.trim()
      const roleLabel = (roleBadgeMap[u.role] || roleBadgeMap.user).label
      if (u.registrations && u.registrations.length > 0) {
        return u.registrations.map((r) => [
          name,
          u.email,
          roleLabel,
          r.category_name,
          statusLabel(r.status),
          r.university || "-",
          r.study_program || "-",
          r.semester || "-",
          r.allergies || "-",
          r.dietary_restrictions || "-",
          r.intolerances || "-",
          new Date(r.created_at).toLocaleDateString(dateLocale)
        ])
      }
      return [
        [
          name,
          u.email,
          roleLabel,
          u.admin_role_name || u.category_name || "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          new Date(u.created_at).toLocaleDateString(dateLocale)
        ]
      ]
    })

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `benutzer-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success(text.exportSuccess)
  }

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    categoryPartners: users.filter((u) => u.role === "category_partner").length,
    sponsors: users.filter((u) => u.role === "sponsor").length,
    participants: users.filter((u) => u.role === "user").length
  }

  const dateLocale = language === "en" ? "en-GB" : "de-DE"

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{text.heading}</h1>
          <p className="text-muted-foreground">{isAdmin ? text.subtitleAdmin : text.subtitlePartner}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full shrink-0 gap-2 sm:w-auto">
            <UserPlus className="h-4 w-4" />
            {text.createUser}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{text.total}</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        {isAdmin && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{text.superAdmins}</CardTitle>
                <Shield className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.admins}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{text.categoryAdmins}</CardTitle>
                <UserCog className="h-4 w-4 text-violet-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.categoryPartners}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{text.sponsors}</CardTitle>
                <UserCog className="h-4 w-4 text-[#530A5D]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.sponsors}</div>
              </CardContent>
            </Card>
          </>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{text.participants}</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.participants}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={text.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {isAdmin && (
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{text.filterAllRoles}</SelectItem>
              <SelectItem value="admin">{text.roleSuperAdmin}</SelectItem>
              <SelectItem value="category_partner">{text.roleCategoryAdmin}</SelectItem>
              <SelectItem value="sponsor">{text.roleSponsor}</SelectItem>
              <SelectItem value="user">{text.roleUser}</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{text.filterAllCategories}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {text.exportCsv}
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{text.colName}</TableHead>
                <TableHead>{text.colEmail}</TableHead>
                <TableHead>{text.colRole}</TableHead>
                <TableHead>{text.colCategory}</TableHead>
                <TableHead>{text.colStatus}</TableHead>
                <TableHead>{text.colRegistered}</TableHead>
                <TableHead>{text.colActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                    {text.noUsers}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const badge = roleBadgeMap[user.role] || roleBadgeMap.user
                  const isSelf = currentUser?.id === user.id
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                        {isSelf && <span className="text-muted-foreground ml-2 text-xs">{text.self}</span>}
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={badge.className}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.admin_role_name ? (
                          <span className="font-medium text-violet-700">{user.admin_role_name}</span>
                        ) : user.category_name ? (
                          user.category_name
                        ) : user.registrations && user.registrations.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.registrations.map((r) => (
                              <Badge key={r.id} variant="outline">
                                {r.category_name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge variant="outline" className="bg-green-100 text-green-700">
                            {text.active}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-400">
                            {text.deactivated}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.created_at).toLocaleDateString(dateLocale)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={updatingUser === user.id}>
                              {updatingUser === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.registrations && user.registrations.length > 0 && (
                              <DropdownMenuItem onClick={() => setDetailsUser(user)}>
                                <Eye className="h-4 w-4" />
                                {text.viewRegistrations}
                              </DropdownMenuItem>
                            )}
                            {isAdmin && !isSelf && (
                              <>
                                {user.registrations && user.registrations.length > 0 && (
                                  <DropdownMenuSeparator />
                                )}
                                <DropdownMenuItem onClick={() => openRoleChangeModal(user)}>
                                  <UserCog className="h-4 w-4" />
                                  {text.changeRole}
                                </DropdownMenuItem>
                                {user.role !== "admin" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() => openDeleteDialog(user)}>
                                      <Trash2 className="h-4 w-4" />
                                      {text.deleteButton}
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create user dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{text.createUser}</DialogTitle>
            <DialogDescription>{text.createUserDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{text.firstName}</Label>
                <Input
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="Max"
                />
              </div>
              <div>
                <Label>{text.lastName}</Label>
                <Input
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="Mustermann"
                />
              </div>
            </div>
            <div>
              <Label>{text.email}</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="max@example.com"
              />
            </div>
            <div>
              <Label>{text.password}</Label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
              />
              <p className="text-muted-foreground mt-1 text-xs">{text.passwordHint}</p>
            </div>
            <div>
              <Label>{text.role}</Label>
              <Select
                value={createForm.role}
                onValueChange={(val) =>
                  setCreateForm((f) => ({ ...f, role: val, categoryId: "", adminRoleId: "" }))
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{text.roleUser}</SelectItem>
                  <SelectItem value="category_partner">{text.roleCategoryAdmin}</SelectItem>
                  <SelectItem value="sponsor">{text.roleSponsor}</SelectItem>
                  <SelectItem value="admin">{text.roleSuperAdmin}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createForm.role === "category_partner" && adminRoles.length > 0 && (
              <div>
                <Label>{language === "de" ? "Admin-Rolle" : "Admin role"}</Label>
                <Select
                  value={createForm.adminRoleId || "__none__"}
                  onValueChange={(val) =>
                    setCreateForm((f) => ({
                      ...f,
                      adminRoleId: val === "__none__" ? "" : val,
                      categoryId: ""
                    }))
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "de" ? "Rolle wählen..." : "Select role..."} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{language === "de" ? "Keine Rolle" : "No role"}</SelectItem>
                    {adminRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                        {r.category_name ? ` (${r.category_name})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(createForm.role === "sponsor" ||
              (createForm.role === "category_partner" && !createForm.adminRoleId)) && (
              <div>
                <Label>{text.category}</Label>
                <Select
                  value={createForm.categoryId}
                  onValueChange={(val) => setCreateForm((f) => ({ ...f, categoryId: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={text.categoryPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
                {text.cancel}
              </Button>
              <Button onClick={createUser} disabled={creating}>
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                {text.create}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role change dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmRoleChange()
          }}>
          <DialogHeader>
            <DialogTitle>{text.changeRole}</DialogTitle>
            <DialogDescription>
              {text.changeRoleDesc} <strong>{pendingRoleChange?.userName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{text.newRole}</Label>
              <Select value={pendingRoleChange?.newRole} onValueChange={selectNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{text.roleUser}</SelectItem>
                  <SelectItem value="category_partner">{text.roleCategoryAdmin}</SelectItem>
                  <SelectItem value="sponsor">{text.roleSponsor}</SelectItem>
                  <SelectItem value="admin">{text.roleSuperAdmin}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {pendingRoleChange?.newRole === "admin" && (
              <div className="border-destructive/50 bg-destructive/10 flex gap-2 rounded-md border p-3 text-sm">
                <AlertTriangle className="text-destructive h-4 w-4 shrink-0" />
                <div>
                  <p className="text-destructive font-medium">{text.warningAdminTitle}</p>
                  <p className="text-destructive/90">{text.warningAdminText}</p>
                </div>
              </div>
            )}
            {(pendingRoleChange?.newRole === "category_partner" ||
              pendingRoleChange?.newRole === "sponsor") && (
              <div className="flex gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-amber-700">{text.warningElevatedText}</p>
              </div>
            )}
            {pendingRoleChange?.newRole === "category_partner" && adminRoles.length > 0 && (
              <div>
                <Label>{language === "de" ? "Admin-Rolle (empfohlen)" : "Admin role (recommended)"}</Label>
                <Select
                  value={selectedAdminRoleId || "__none__"}
                  onValueChange={(v) => {
                    setSelectedAdminRoleId(v === "__none__" ? "" : v)
                    if (v !== "__none__") setSelectedCategoryId("")
                  }}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "de" ? "Rolle wählen..." : "Select role..."} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{language === "de" ? "Keine Rolle" : "No role"}</SelectItem>
                    {adminRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                        {r.category_name ? ` (${r.category_name})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(pendingRoleChange?.newRole === "category_partner" ||
              pendingRoleChange?.newRole === "sponsor") &&
              !selectedAdminRoleId && (
                <div>
                  <Label>{text.category}</Label>
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder={text.categoryPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                {text.cancel}
              </Button>
              <Button
                onClick={confirmRoleChange}
                disabled={
                  !pendingRoleChange ||
                  pendingRoleChange.newRole === pendingRoleChange.currentRole ||
                  ((pendingRoleChange.newRole === "category_partner" ||
                    pendingRoleChange.newRole === "sponsor") &&
                    !selectedCategoryId &&
                    !selectedAdminRoleId) ||
                  updatingUser !== null
                }
                className={
                  pendingRoleChange?.newRole === "admin"
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-primary hover:bg-primary/90"
                }>
                {updatingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : text.assign}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          onKeyDown={(e) => {
            if (e.key === "Enter" && !deleting) confirmDelete()
            if (e.key === "Escape") setDeleteDialogOpen(false)
          }}>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {text.deleteUser}
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <span className="block">
                {text.deleteConfirm1} <strong>{pendingDelete?.name}</strong> ({pendingDelete?.email}){" "}
                {text.deleteConfirm2}
              </span>
              <span className="text-destructive block text-sm font-medium">{text.deleteWarning}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              {text.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {text.finalDeleteButton}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registration details dialog */}
      <Dialog open={detailsUser !== null} onOpenChange={(open) => !open && setDetailsUser(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{text.registrationDetails}</DialogTitle>
            <DialogDescription>
              {text.registrationDetailsDesc} {detailsUser?.first_name} {detailsUser?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto">
            {detailsUser?.registrations && detailsUser.registrations.length > 0 ? (
              detailsUser.registrations.map((r) => (
                <div key={r.id} className="space-y-2 rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{r.category_name}</Badge>
                    <Badge
                      variant={r.status === "confirmed" ? "default" : "outline"}
                      className={r.status === "confirmed" ? "bg-green-600" : ""}>
                      {statusLabel(r.status)}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <dt className="text-muted-foreground">{text.university}</dt>
                    <dd>{r.university || "-"}</dd>
                    <dt className="text-muted-foreground">{text.studyProgram}</dt>
                    <dd>{r.study_program || "-"}</dd>
                    <dt className="text-muted-foreground">{text.semester}</dt>
                    <dd>{r.semester || "-"}</dd>
                    <dt className="text-muted-foreground">{text.allergies}</dt>
                    <dd>{r.allergies || "-"}</dd>
                    <dt className="text-muted-foreground">{text.dietaryRestrictions}</dt>
                    <dd>{r.dietary_restrictions || "-"}</dd>
                    <dt className="text-muted-foreground">{text.intolerances}</dt>
                    <dd>{r.intolerances || "-"}</dd>
                    <dt className="text-muted-foreground">{text.registeredOn}</dt>
                    <dd>{new Date(r.created_at).toLocaleDateString(dateLocale)}</dd>
                  </dl>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground py-8 text-center">{text.noRegistrations}</p>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setDetailsUser(null)}>
              {text.close}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
