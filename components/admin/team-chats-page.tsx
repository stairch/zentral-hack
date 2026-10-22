"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { normalizeHexColor, getContrastForegroundColor } from "@/lib/helpers"
import { TeamChat } from "@/components/chat/team-chat"

interface Team {
  id: string
  name: string
  category_name: string
  category_color: string | null
  member_count: string | number
}

const copy = {
  de: {
    heading: "TEAM-CHATS",
    subtitle: "Chats aller Teams einsehen und mitschreiben",
    subtitleCategory: "Chats der Teams deiner Kategorie einsehen und mitschreiben",
    noTeams: "Noch keine Teams vorhanden.",
    selectTeam: "Wähle links ein Team aus, um den Chat zu öffnen.",
    members: "Mitglieder",
    loadError: "Fehler beim Laden der Teams"
  },
  en: {
    heading: "TEAM CHATS",
    subtitle: "View and write in every team's chat",
    subtitleCategory: "View and write in your category's team chats",
    noTeams: "No teams yet.",
    selectTeam: "Select a team on the left to open its chat.",
    members: "members",
    loadError: "Failed to load teams"
  }
} as const

function categoryBadgeStyle(color: string | null) {
  if (!color) return undefined
  const normalized = normalizeHexColor(color)
  return {
    backgroundColor: normalized,
    color: getContrastForegroundColor(normalized),
    borderColor: normalized
  }
}

export function AdminTeamChatsPage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const text = copy[language]
  const isCategoryPartner = user?.role === "category_partner"

  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/teams", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setTeams(data.data?.teams || [])
    } catch {
      toast.error(text.loadError)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{text.heading}</h1>
        <p className="text-muted-foreground mt-2">
          {isCategoryPartner ? text.subtitleCategory : text.subtitle}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="space-y-2 lg:w-72 lg:shrink-0">
          {teams.length === 0 && <p className="text-muted-foreground text-sm">{text.noTeams}</p>}
          {teams.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => setSelectedTeamId(team.id)}
              className={`border-border w-full rounded-xl border p-3 text-left transition-colors ${
                selectedTeamId === team.id ? "border-[#530A5D] bg-[#530A5D]/5" : "hover:bg-muted/50"
              }`}>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold">{team.name}</p>
                <Badge variant="outline" className="shrink-0" style={categoryBadgeStyle(team.category_color)}>
                  {team.category_name}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                <Users className="h-3 w-3" />
                {team.member_count} {text.members}
              </p>
            </button>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {selectedTeamId ? (
            <div className="border-border h-[500px] overflow-hidden rounded-xl border">
              <TeamChat teamId={selectedTeamId} />
            </div>
          ) : (
            <p className="text-muted-foreground py-12 text-center">{text.selectTeam}</p>
          )}
        </div>
      </div>
    </div>
  )
}
