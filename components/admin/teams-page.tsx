"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  Plus,
  Loader2,
  ArrowLeft,
  UserPlus,
  Trash2,
  Crown,
  Pencil,
  Upload,
  Download,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface Team {
  id: string
  name: string
  description?: string
  category_id: string
  category_name?: string
  member_count?: number
  created_at: string
}

interface TeamMember {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  member_role: string
  created_at: string
}

interface Category {
  id: string
  name: string
}

interface TeamFile {
  id: string
  original_name: string
  file_size: number
  created_at: string
}

const copy = {
  de: {
    heading: "TEAMS",
    subtitle: "Verwalte alle Teams und deren Mitglieder",
    newTeam: "Neues Team",
    newTeamDialog: "Neues Team erstellen",
    newTeamDesc: "Erstelle ein neues Team für eine Kategorie",
    teamName: "Team-Name",
    teamNamePlaceholder: "z.B. Team Alpha",
    category: "Kategorie",
    categoryPlaceholder: "Wähle eine Kategorie",
    description: "Beschreibung (optional)",
    descPlaceholder: "Teambeschreibung...",
    createTeam: "Team erstellen",
    noTeams: 'Noch keine Teams erstellt. Klicke auf "Neues Team", um zu starten.',
    back: "Zurück",
    members: "Mitglieder",
    addMember: "Mitglied hinzufügen",
    addMemberDialog: "Mitglied hinzufügen",
    addMemberDesc: "Wähle einen registrierten Teilnehmer dieser Kategorie aus",
    participant: "Teilnehmer",
    participantPlaceholder: "Teilnehmer wählen...",
    searchPlaceholder: "Name oder E-Mail suchen...",
    searchNoResults: "Keine Teilnehmer gefunden.",
    loadingParticipants: "Lade Teilnehmer...",
    noParticipants: "Keine verfügbaren Teilnehmer für diese Kategorie.",
    role: "Rolle",
    roleMember: "Mitglied",
    roleLeader: "Team Leader",
    add: "Hinzufügen",
    teamMembers: "Teammitglieder",
    noMembersYet: 'Noch keine Mitglieder. Klicke auf "Mitglied hinzufügen", um zu starten.',
    colName: "Name",
    colEmail: "E-Mail",
    colRole: "Rolle",
    colActions: "Aktionen",
    manage: "Team verwalten",
    created: "Erstellt:",
    loadError: "Fehler beim Laden der Daten",
    validationError: "Team-Name und Kategorie erforderlich",
    createSuccess: "Team erstellt",
    createError: "Fehler beim Erstellen",
    deleteConfirm: "Team wirklich löschen? Alle Mitglieder werden entfernt.",
    deleteSuccess: "Team gelöscht",
    deleteError: "Fehler beim Löschen",
    membersLoadError: "Fehler beim Laden der Mitglieder",
    availableLoadError: "Fehler beim Laden der verfügbaren Benutzer",
    addMemberSuccess: "Mitglied hinzugefügt",
    addMemberError: "Fehler beim Hinzufügen",
    removeMemberConfirm: "Mitglied wirklich entfernen?",
    removeMemberSuccess: "Mitglied entfernt",
    removeMemberError: "Fehler beim Entfernen",
    makeLeader: "Zum Teamchef machen",
    makeMember: "Teamchef entfernen",
    roleChangeError: "Fehler beim Ändern der Rolle",
    editTeam: "Team bearbeiten",
    editTeamDialog: "Team bearbeiten",
    saveChanges: "Speichern",
    editTeamSuccess: "Team aktualisiert",
    editTeamError: "Fehler beim Speichern",
    filesTitle: "Dateien",
    filesEmpty: "Noch keine Dateien hochgeladen.",
    uploadFile: "Datei hochladen",
    fileLoadError: "Fehler beim Laden der Dateien",
    fileUploadSuccess: "Datei hochgeladen",
    fileUploadError: "Fehler beim Hochladen",
    deleteFileConfirm: "Datei wirklich löschen?",
    fileDeleteSuccess: "Datei gelöscht",
    fileDeleteError: "Fehler beim Löschen"
  },
  en: {
    heading: "TEAMS",
    subtitle: "Manage all teams and their members",
    newTeam: "New Team",
    newTeamDialog: "Create new team",
    newTeamDesc: "Create a new team for a category",
    teamName: "Team name",
    teamNamePlaceholder: "e.g. Team Alpha",
    category: "Category",
    categoryPlaceholder: "Select a category",
    description: "Description (optional)",
    descPlaceholder: "Team description...",
    createTeam: "Create team",
    noTeams: 'No teams created yet. Click "New Team" to get started.',
    back: "Back",
    members: "members",
    addMember: "Add Member",
    addMemberDialog: "Add member",
    addMemberDesc: "Select a registered participant from this category",
    participant: "Participant",
    participantPlaceholder: "Select participant...",
    searchPlaceholder: "Search name or email...",
    searchNoResults: "No participants found.",
    loadingParticipants: "Loading participants...",
    noParticipants: "No available participants for this category.",
    role: "Role",
    roleMember: "Member",
    roleLeader: "Team Leader",
    add: "Add",
    teamMembers: "Team members",
    noMembersYet: 'No members yet. Click "Add Member" to get started.',
    colName: "Name",
    colEmail: "Email",
    colRole: "Role",
    colActions: "Actions",
    manage: "Manage team",
    created: "Created:",
    loadError: "Failed to load data",
    validationError: "Team name and category are required",
    createSuccess: "Team created",
    createError: "Failed to create",
    deleteConfirm: "Really delete team? All members will be removed.",
    deleteSuccess: "Team deleted",
    deleteError: "Failed to delete",
    membersLoadError: "Failed to load members",
    availableLoadError: "Failed to load available users",
    addMemberSuccess: "Member added",
    addMemberError: "Failed to add",
    removeMemberConfirm: "Really remove member?",
    removeMemberSuccess: "Member removed",
    removeMemberError: "Failed to remove",
    makeLeader: "Make team leader",
    makeMember: "Remove as leader",
    roleChangeError: "Failed to change role",
    editTeam: "Edit team",
    editTeamDialog: "Edit team",
    saveChanges: "Save",
    editTeamSuccess: "Team updated",
    editTeamError: "Failed to save",
    filesTitle: "Files",
    filesEmpty: "No files uploaded yet.",
    uploadFile: "Upload file",
    fileLoadError: "Failed to load files",
    fileUploadSuccess: "File uploaded",
    fileUploadError: "Failed to upload",
    deleteFileConfirm: "Really delete this file?",
    fileDeleteSuccess: "File deleted",
    fileDeleteError: "Failed to delete"
  }
} as const

export function TeamsAdminPage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const text = copy[language]
  const dateLocale = language === "en" ? "en-GB" : "de-CH"
  const isCategoryPartner = user?.role === "category_partner"

  const [teams, setTeams] = useState<Team[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTeam, setNewTeam] = useState({ name: "", description: "", categoryId: user?.categoryId || "" })

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [newMemberRole, setNewMemberRole] = useState("member")
  const [addingMember, setAddingMember] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<
    { id: string; email: string; first_name: string; last_name: string }[]
  >([])
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null)
  const [deletingTeam, setDeletingTeam] = useState(false)
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null)
  const [removingMember, setRemovingMember] = useState(false)
  const [memberSearch, setMemberSearch] = useState("")
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null)
  const [editTeamOpen, setEditTeamOpen] = useState(false)
  const [editTeamName, setEditTeamName] = useState("")
  const [editTeamDescription, setEditTeamDescription] = useState("")
  const [savingTeamEdit, setSavingTeamEdit] = useState(false)
  const [teamFiles, setTeamFiles] = useState<TeamFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null)
  const [deletingFile, setDeletingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [catRes, teamsRes] = await Promise.all([
        fetch("/api/categories", { credentials: "include" }),
        fetch("/api/admin/teams", { credentials: "include" })
      ])
      if (catRes.ok) {
        const catData = await catRes.json()
        setCategories(catData.data?.categories || [])
      }
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        setTeams(teamsData.data?.teams || [])
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast.error(text.loadError)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeam.name || !newTeam.categoryId) {
      toast.error(text.validationError)
      return
    }
    try {
      setIsCreating(true)
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newTeam.name,
          description: newTeam.description || null,
          categoryId: newTeam.categoryId
        })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || text.createError)
      }
      const data = await res.json()
      setTeams([data.data.team, ...teams])
      setNewTeam({ name: "", description: "", categoryId: "" })
      setDialogOpen(false)
      toast.success(text.createSuccess)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.createError)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!deleteTeamId) return
    try {
      setDeletingTeam(true)
      const res = await fetch(`/api/admin/teams?id=${deleteTeamId}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (res.ok) {
        setTeams(teams.filter((t) => t.id !== deleteTeamId))
        if (selectedTeam?.id === deleteTeamId) setSelectedTeam(null)
        toast.success(text.deleteSuccess)
        setDeleteTeamId(null)
      }
    } catch {
      toast.error(text.deleteError)
    } finally {
      setDeletingTeam(false)
    }
  }

  const openTeamDetail = async (team: Team) => {
    setSelectedTeam(team)
    setLoadingMembers(true)
    try {
      const res = await fetch(`/api/admin/teams/members?teamId=${team.id}`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setMembers(data.data?.members || [])
      }
    } catch {
      toast.error(text.membersLoadError)
    } finally {
      setLoadingMembers(false)
    }
    void fetchTeamFiles(team.id)
  }

  const fetchAvailableUsers = async (categoryId: string, q?: string) => {
    setLoadingAvailable(true)
    try {
      const params = new URLSearchParams({ availableForCategory: categoryId })
      if (q) params.set("q", q)
      const res = await fetch(`/api/admin/teams/members?${params}`, {
        credentials: "include"
      })
      if (res.ok) {
        const data = await res.json()
        setAvailableUsers(data.data?.users || [])
      }
    } catch {
      toast.error(text.availableLoadError)
    } finally {
      setLoadingAvailable(false)
    }
  }

  const openAddMemberDialog = () => {
    setSelectedUserId("")
    setNewMemberRole("member")
    setMemberSearch("")
    setAddMemberOpen(true)
    if (selectedTeam) fetchAvailableUsers(selectedTeam.category_id)
  }

  // Debounced search-as-you-type for the member picker.
  useEffect(() => {
    if (!addMemberOpen || !selectedTeam) return
    const timeout = setTimeout(() => {
      fetchAvailableUsers(selectedTeam.category_id, memberSearch)
    }, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberSearch, addMemberOpen])

  const handleToggleLeader = async (member: TeamMember) => {
    if (!selectedTeam) return
    const nextRole = member.member_role === "leader" ? "member" : "leader"
    setChangingRoleId(member.id)
    try {
      const res = await fetch("/api/admin/teams/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ teamId: selectedTeam.id, memberId: member.id, role: nextRole })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || text.roleChangeError)
      setMembers((prev) =>
        prev.map((m) => {
          if (m.id === member.id) return { ...m, member_role: nextRole }
          if (nextRole === "leader" && m.member_role === "leader") return { ...m, member_role: "member" }
          return m
        })
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.roleChangeError)
    } finally {
      setChangingRoleId(null)
    }
  }

  const openEditTeam = () => {
    if (!selectedTeam) return
    setEditTeamName(selectedTeam.name)
    setEditTeamDescription(selectedTeam.description || "")
    setEditTeamOpen(true)
  }

  const handleSaveTeamEdit = async () => {
    if (!selectedTeam || !editTeamName.trim()) return
    setSavingTeamEdit(true)
    try {
      const res = await fetch("/api/admin/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: selectedTeam.id,
          name: editTeamName.trim(),
          description: editTeamDescription.trim() || null
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || text.editTeamError)
      const updated = { ...selectedTeam, name: data.data.team.name, description: data.data.team.description }
      setSelectedTeam(updated)
      setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setEditTeamOpen(false)
      toast.success(text.editTeamSuccess)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.editTeamError)
    } finally {
      setSavingTeamEdit(false)
    }
  }

  const fetchTeamFiles = async (teamId: string) => {
    setLoadingFiles(true)
    try {
      const res = await fetch(`/api/teams-files?teamId=${teamId}`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setTeamFiles(data.data?.files || [])
      }
    } catch {
      toast.error(text.fileLoadError)
    } finally {
      setLoadingFiles(false)
    }
  }

  const handleUploadFile = async (file: File) => {
    if (!selectedTeam) return
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch(`/api/teams-files?teamId=${selectedTeam.id}`, {
        method: "POST",
        credentials: "include",
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || text.fileUploadError)
      setTeamFiles((prev) => [data.data.file, ...prev])
      toast.success(text.fileUploadSuccess)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.fileUploadError)
    } finally {
      setUploadingFile(false)
    }
  }

  const handleDeleteFile = async () => {
    if (!selectedTeam || !deleteFileId) return
    setDeletingFile(true)
    try {
      const res = await fetch(`/api/teams-files?teamId=${selectedTeam.id}&fileId=${deleteFileId}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (!res.ok) throw new Error(text.fileDeleteError)
      setTeamFiles((prev) => prev.filter((f) => f.id !== deleteFileId))
      toast.success(text.fileDeleteSuccess)
      setDeleteFileId(null)
    } catch {
      toast.error(text.fileDeleteError)
    } finally {
      setDeletingFile(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId || !selectedTeam) return
    setAddingMember(true)
    try {
      const res = await fetch("/api/admin/teams/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ teamId: selectedTeam.id, userId: selectedUserId, role: newMemberRole })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || text.addMemberError)
      setMembers([...members, data.data.member])
      setAvailableUsers(availableUsers.filter((u) => u.id !== selectedUserId))
      setTeams(
        teams.map((t) =>
          t.id === selectedTeam.id ? { ...t, member_count: (Number(t.member_count) || 0) + 1 } : t
        )
      )
      setSelectedUserId("")
      setNewMemberRole("member")
      setAddMemberOpen(false)
      toast.success(text.addMemberSuccess)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.addMemberError)
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!selectedTeam || !removeMemberId) return
    try {
      setRemovingMember(true)
      const res = await fetch(
        `/api/admin/teams/members?memberId=${removeMemberId}&teamId=${selectedTeam.id}`,
        {
          method: "DELETE",
          credentials: "include"
        }
      )
      if (res.ok) {
        setMembers(members.filter((m) => m.id !== removeMemberId))
        setTeams(
          teams.map((t) =>
            t.id === selectedTeam.id
              ? { ...t, member_count: Math.max(0, (Number(t.member_count) || 0) - 1) }
              : t
          )
        )
        toast.success(text.removeMemberSuccess)
        setRemoveMemberId(null)
      }
    } catch {
      toast.error(text.removeMemberError)
    } finally {
      setRemovingMember(false)
    }
  }

  // === Team Detail View ===
  if (selectedTeam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedTeam(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {text.back}
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-foreground text-3xl font-bold">{selectedTeam.name}</h1>
              <Button variant="ghost" size="icon" onClick={openEditTeam}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground">
              {selectedTeam.category_name} • {members.length} {text.members}
            </p>
          </div>
          <Dialog open={editTeamOpen} onOpenChange={setEditTeamOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{text.editTeamDialog}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-team-name">{text.teamName}</Label>
                  <Input
                    id="edit-team-name"
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-team-description">{text.description}</Label>
                  <Textarea
                    id="edit-team-description"
                    value={editTeamDescription}
                    onChange={(e) => setEditTeamDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleSaveTeamEdit}
                  disabled={savingTeamEdit || !editTeamName.trim()}
                  className="bg-violet hover:bg-violet/90 w-full">
                  {savingTeamEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : text.saveChanges}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
            <DialogTrigger asChild>
              <Button className="bg-violet hover:bg-violet/90 gap-2" onClick={openAddMemberDialog}>
                <UserPlus className="h-4 w-4" /> {text.addMember}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{text.addMemberDialog}</DialogTitle>
                <DialogDescription>{text.addMemberDesc}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{text.participant}</Label>
                  <Input
                    value={memberSearch}
                    onChange={(e) => {
                      setMemberSearch(e.target.value)
                      setSelectedUserId("")
                    }}
                    placeholder={text.searchPlaceholder}
                  />
                  {loadingAvailable ? (
                    <div className="text-muted-foreground flex items-center gap-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> {text.loadingParticipants}
                    </div>
                  ) : availableUsers.length > 0 ? (
                    <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-1">
                      {availableUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setSelectedUserId(u.id)}
                          className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                            selectedUserId === u.id ? "bg-violet/10" : "hover:bg-muted"
                          }`}>
                          {u.first_name} {u.last_name}{" "}
                          <span className="text-muted-foreground">({u.email})</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-2 text-sm">
                      {memberSearch ? text.searchNoResults : text.noParticipants}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="member-role">{text.role}</Label>
                  <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">{text.roleMember}</SelectItem>
                      <SelectItem value="leader">{text.roleLeader}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddMember}
                  disabled={addingMember || !selectedUserId}
                  className="bg-violet hover:bg-violet/90 w-full">
                  {addingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : text.add}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {selectedTeam.description && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">{selectedTeam.description}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{text.teamMembers}</CardTitle>
            <CardDescription>
              {members.length} {text.members}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMembers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : members.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{text.colName}</TableHead>
                    <TableHead>{text.colEmail}</TableHead>
                    <TableHead>{text.colRole}</TableHead>
                    <TableHead className="text-right">{text.colActions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.first_name} {member.last_name}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        {member.member_role === "leader" ? (
                          <Badge className="bg-yellow text-violet gap-1">
                            <Crown className="h-3 w-3" /> Leader
                          </Badge>
                        ) : (
                          <Badge variant="outline">{text.roleMember}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={changingRoleId === member.id}
                          onClick={() => handleToggleLeader(member)}
                          title={member.member_role === "leader" ? text.makeMember : text.makeLeader}>
                          {changingRoleId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Crown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemoveMemberId(member.id)}
                          className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground py-8 text-center">{text.noMembersYet}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{text.filesTitle}</CardTitle>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const picked = e.target.files?.[0]
                if (picked) void handleUploadFile(picked)
                if (fileInputRef.current) fileInputRef.current.value = ""
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={uploadingFile}
              onClick={() => fileInputRef.current?.click()}>
              {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {text.uploadFile}
            </Button>
          </CardHeader>
          <CardContent>
            {loadingFiles ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : teamFiles.length > 0 ? (
              <div className="space-y-2">
                {teamFiles.map((file) => (
                  <div
                    key={file.id}
                    className="border-border hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="text-primary h-4 w-4 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{file.original_name}</p>
                        <p className="text-muted-foreground text-xs">
                          {(file.file_size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <a
                        href={`/api/download-file?fileId=${file.id}`}
                        className="hover:bg-muted rounded-lg p-2 transition-colors">
                        <Download className="text-muted-foreground h-4 w-4" />
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteFileId(file.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center">{text.filesEmpty}</p>
            )}
          </CardContent>
        </Card>

        <ConfirmDialog
          open={!!deleteFileId}
          onOpenChange={(open) => !open && setDeleteFileId(null)}
          title={language === "en" ? "Delete file?" : "Datei löschen?"}
          description={text.deleteFileConfirm}
          confirmLabel={language === "en" ? "Delete" : "Löschen"}
          cancelLabel={language === "en" ? "Cancel" : "Abbrechen"}
          onConfirm={handleDeleteFile}
          loading={deletingFile}
        />
      </div>
    )
  }

  // === Teams List View ===
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-foreground text-3xl font-bold">{text.heading}</h1>
          <p className="text-muted-foreground mt-2">{text.subtitle}</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet hover:bg-violet/90 gap-2">
              <Plus className="h-4 w-4" />
              {text.newTeam}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{text.newTeamDialog}</DialogTitle>
              <DialogDescription>{text.newTeamDesc}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name">{text.teamName}</Label>
                <Input
                  id="team-name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder={text.teamNamePlaceholder}
                />
              </div>
              {!isCategoryPartner && (
                <div>
                  <Label htmlFor="category">{text.category}</Label>
                  <Select
                    value={newTeam.categoryId}
                    onValueChange={(val) => setNewTeam({ ...newTeam, categoryId: val })}>
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
              <div>
                <Label htmlFor="description">{text.description}</Label>
                <Textarea
                  id="description"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  placeholder={text.descPlaceholder}
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreateTeam}
                disabled={isCreating}
                className="bg-violet hover:bg-violet/90 w-full">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : text.createTeam}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="transition-shadow hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{team.name}</CardTitle>
                    <CardDescription>{team.category_name}</CardDescription>
                  </div>
                  <Badge variant="outline">
                    {team.member_count || 0} {text.members}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {team.description && <p className="text-muted-foreground text-sm">{team.description}</p>}
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  {text.created} {new Date(team.created_at).toLocaleDateString(dateLocale)}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => openTeamDetail(team)}>
                    {text.manage}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTeamId(team.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && teams.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground text-center">{text.noTeams}</p>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteTeamId}
        onOpenChange={(open) => !open && setDeleteTeamId(null)}
        title={language === "en" ? "Delete team?" : "Team löschen?"}
        description={text.deleteConfirm}
        confirmLabel={language === "en" ? "Delete" : "Löschen"}
        cancelLabel={language === "en" ? "Cancel" : "Abbrechen"}
        onConfirm={handleDeleteTeam}
        loading={deletingTeam}
      />
      <ConfirmDialog
        open={!!removeMemberId}
        onOpenChange={(open) => !open && setRemoveMemberId(null)}
        title={language === "en" ? "Remove member?" : "Mitglied entfernen?"}
        description={text.removeMemberConfirm}
        confirmLabel={language === "en" ? "Remove" : "Entfernen"}
        cancelLabel={language === "en" ? "Cancel" : "Abbrechen"}
        onConfirm={handleRemoveMember}
        loading={removingMember}
      />
    </div>
  )
}
