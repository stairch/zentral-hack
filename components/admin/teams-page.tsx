"use client"

import { useEffect, useState } from "react"
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
import { Users, Plus, Loader2, ArrowLeft, UserPlus, Trash2, Crown } from "lucide-react"
import { toast } from "sonner"

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

export function TeamsAdminPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTeam, setNewTeam] = useState({ name: "", description: "", categoryId: "" })

  // Team detail view
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
      toast.error("Fehler beim Laden der Daten")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeam.name || !newTeam.categoryId) {
      toast.error("Team-Name und Kategorie erforderlich")
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
        throw new Error(error.error || "Fehler beim Erstellen des Teams")
      }

      const data = await res.json()
      setTeams([data.data.team, ...teams])
      setNewTeam({ name: "", description: "", categoryId: "" })
      setDialogOpen(false)
      toast.success("Team erstellt")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Erstellen")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Team wirklich löschen? Alle Mitglieder werden entfernt.")) return

    try {
      const res = await fetch(`/api/admin/teams?id=${teamId}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (res.ok) {
        setTeams(teams.filter((t) => t.id !== teamId))
        if (selectedTeam?.id === teamId) setSelectedTeam(null)
        toast.success("Team gelöscht")
      }
    } catch {
      toast.error("Fehler beim Löschen")
    }
  }

  const openTeamDetail = async (team: Team) => {
    setSelectedTeam(team)
    setLoadingMembers(true)
    try {
      const res = await fetch(`/api/admin/teams/members?teamId=${team.id}`, {
        credentials: "include"
      })
      if (res.ok) {
        const data = await res.json()
        setMembers(data.data?.members || [])
      }
    } catch {
      toast.error("Fehler beim Laden der Mitglieder")
    } finally {
      setLoadingMembers(false)
    }
  }

  const fetchAvailableUsers = async (categoryId: string) => {
    setLoadingAvailable(true)
    try {
      const res = await fetch(`/api/admin/teams/members?availableForCategory=${categoryId}`, {
        credentials: "include"
      })
      if (res.ok) {
        const data = await res.json()
        setAvailableUsers(data.data?.users || [])
      }
    } catch {
      toast.error("Fehler beim Laden der verfügbaren Benutzer")
    } finally {
      setLoadingAvailable(false)
    }
  }

  const openAddMemberDialog = () => {
    setSelectedUserId("")
    setNewMemberRole("member")
    setAddMemberOpen(true)
    if (selectedTeam) {
      fetchAvailableUsers(selectedTeam.category_id)
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
        body: JSON.stringify({
          teamId: selectedTeam.id,
          userId: selectedUserId,
          role: newMemberRole
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Hinzufügen")
      }

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
      toast.success("Mitglied hinzugefügt")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Hinzufügen")
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTeam || !confirm("Mitglied wirklich entfernen?")) return

    try {
      const res = await fetch(`/api/admin/teams/members?memberId=${memberId}&teamId=${selectedTeam.id}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (res.ok) {
        setMembers(members.filter((m) => m.id !== memberId))
        setTeams(
          teams.map((t) =>
            t.id === selectedTeam.id
              ? { ...t, member_count: Math.max(0, (Number(t.member_count) || 0) - 1) }
              : t
          )
        )
        toast.success("Mitglied entfernt")
      }
    } catch {
      toast.error("Fehler beim Entfernen")
    }
  }

  // === Team Detail View ===
  if (selectedTeam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedTeam(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
          </Button>
          <div className="flex-1">
            <h1 className="text-foreground text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              {selectedTeam.name}
            </h1>
            <p className="text-muted-foreground">
              {selectedTeam.category_name} • {members.length} Mitglieder
            </p>
          </div>
          <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
            <DialogTrigger asChild>
              <Button className="bg-violet hover:bg-violet/90 gap-2" onClick={openAddMemberDialog}>
                <UserPlus className="h-4 w-4" /> Mitglied hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mitglied hinzufügen</DialogTitle>
                <DialogDescription>
                  Wähle einen registrierten Teilnehmer dieser Kategorie aus
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Teilnehmer</Label>
                  {loadingAvailable ? (
                    <div className="text-muted-foreground flex items-center gap-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Lade Teilnehmer...
                    </div>
                  ) : availableUsers.length > 0 ? (
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Teilnehmer wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.first_name} {u.last_name} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-muted-foreground py-2 text-sm">
                      Keine verfügbaren Teilnehmer für diese Kategorie.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="member-role">Rolle</Label>
                  <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Mitglied</SelectItem>
                      <SelectItem value="leader">Team Leader</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddMember}
                  disabled={addingMember || !selectedUserId}
                  className="bg-violet hover:bg-violet/90 w-full">
                  {addingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hinzufügen"}
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
            <CardTitle>Teammitglieder</CardTitle>
            <CardDescription>{members.length} Mitglieder</CardDescription>
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
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
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
                          <Badge variant="outline">Mitglied</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground py-8 text-center">
                Noch keine Mitglieder. Klicke auf &quot;Mitglied hinzufügen&quot;, um zu starten.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // === Teams List View ===
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            TEAMS
          </h1>
          <p className="text-muted-foreground mt-2">Verwalte alle Teams und deren Mitglieder</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet hover:bg-violet/90 gap-2">
              <Plus className="h-4 w-4" />
              Neues Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Team erstellen</DialogTitle>
              <DialogDescription>Erstelle ein neues Team für eine Kategorie</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name">Team-Name</Label>
                <Input
                  id="team-name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="z.B. Team Alpha"
                />
              </div>
              <div>
                <Label htmlFor="category">Kategorie</Label>
                <Select
                  value={newTeam.categoryId}
                  onValueChange={(val) => setNewTeam({ ...newTeam, categoryId: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle eine Kategorie" />
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
              <div>
                <Label htmlFor="description">Beschreibung (optional)</Label>
                <Textarea
                  id="description"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  placeholder="Teambeschreibung..."
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreateTeam}
                disabled={isCreating}
                className="bg-violet hover:bg-violet/90 w-full">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Team erstellen"}
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
                  <Badge variant="outline">{team.member_count || 0} Mitglieder</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {team.description && <p className="text-muted-foreground text-sm">{team.description}</p>}
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  Erstellt: {new Date(team.created_at).toLocaleDateString("de-CH")}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => openTeamDetail(team)}>
                    Team verwalten
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteTeam(team.id)}>
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
            <p className="text-muted-foreground text-center">
              Noch keine Teams erstellt. Klicke auf &quot;Neues Team&quot;, um zu starten.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
