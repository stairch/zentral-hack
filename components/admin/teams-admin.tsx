"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Loader2 } from "lucide-react"

interface Category {
  id: string
  name: string
  color: string
}

interface TeamMember {
  id: string
  role: string
  user: {
    first_name: string | null
    last_name: string | null
    email: string
  } | null
}

interface Team {
  id: string
  name: string
  description: string | null
  github_url: string | null
  category: Category | null
  members: TeamMember[]
  created_at: string
}

interface Registration {
  user_id: string | null
  first_name: string
  last_name: string
  email: string
  category: { id: string; name: string } | null
}

interface TeamsAdminProps {
  initialTeams: Team[]
  categories: Category[]
  registrations: Registration[]
}

export function TeamsAdmin({ initialTeams, categories, registrations }: TeamsAdminProps) {
  const router = useRouter()
  const [teams, setTeams] = useState(initialTeams)
  const [isCreating, setIsCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    categoryId: "",
    githubUrl: "",
  })

  const handleCreateTeam = async () => {
    if (!newTeam.name || !newTeam.categoryId) return

    setIsCreating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from("teams")
        .insert({
          name: newTeam.name,
          description: newTeam.description || null,
          category_id: newTeam.categoryId,
          github_url: newTeam.githubUrl || null,
          created_by: user?.id,
        })
        .select("*, category:categories(name, color)")
        .single()

      if (error) throw error

      setTeams([{ ...data, members: [] }, ...teams])
      setNewTeam({ name: "", description: "", categoryId: "", githubUrl: "" })
      setDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating team:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            TEAMS
          </h1>
          <p className="text-muted-foreground mt-2">
            Teams erstellen und verwalten
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#530A5D] hover:bg-[#530A5D]/90">
              <Plus className="w-4 h-4" />
              Neues Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Team erstellen</DialogTitle>
              <DialogDescription>
                Erstelle ein neues Team für den Hackathon
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team-Name *</Label>
                <Input
                  id="name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="z.B. Code Wizards"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie *</Label>
                <Select
                  value={newTeam.categoryId}
                  onValueChange={(value) => setNewTeam({ ...newTeam, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie wählen" />
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
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  placeholder="Kurze Beschreibung des Teams..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github">GitHub Repository</Label>
                <Input
                  id="github"
                  value={newTeam.githubUrl}
                  onChange={(e) => setNewTeam({ ...newTeam, githubUrl: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>
              <Button
                onClick={handleCreateTeam}
                disabled={isCreating || !newTeam.name || !newTeam.categoryId}
                className="w-full bg-[#530A5D] hover:bg-[#530A5D]/90"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Team erstellen"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.length > 0 ? (
          teams.map((team) => (
            <Card key={team.id}>
              <div 
                className="h-2 rounded-t-lg" 
                style={{ backgroundColor: team.category?.color || "#530A5D" }}
              />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {team.name}
                </CardTitle>
                <CardDescription>
                  {team.category?.name || "Keine Kategorie"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {team.description && (
                  <p className="text-sm text-muted-foreground mb-4">{team.description}</p>
                )}
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Mitglieder ({team.members?.length || 0})
                  </p>
                  {team.members && team.members.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {team.members.map((member) => (
                        <Badge key={member.id} variant="secondary">
                          {member.user?.first_name} {member.user?.last_name}
                          {member.role === "leader" && " (Leader)"}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Keine Mitglieder</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Noch keine Teams erstellt</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
