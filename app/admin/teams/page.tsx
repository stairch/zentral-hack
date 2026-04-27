import { TeamsAdminPage } from "@/components/admin/teams-page"
import { adminTeamsFlag } from "@/lib/flags"
import ComingSoon from "@/components/ui/coming-soon"

export default async function TeamsPage() {
  const showTeams = await adminTeamsFlag()

  if (!showTeams) {
    return <ComingSoon />
  }

  return <TeamsAdminPage />
}
