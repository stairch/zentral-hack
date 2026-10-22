import { AdminTeamChatsPage } from "@/components/admin/team-chats-page"
import { adminTeamsFlag } from "@/lib/flags"
import ComingSoon from "@/components/ui/coming-soon"

export default async function AdminTeamChatsPageRoute() {
  const showTeams = await adminTeamsFlag()

  if (!showTeams) {
    return <ComingSoon />
  }

  return <AdminTeamChatsPage />
}
