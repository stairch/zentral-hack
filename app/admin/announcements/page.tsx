import { AnnouncementsAdminPage } from "@/components/admin/announcements-page"
import { adminTeamsFlag } from "@/lib/flags"
import ComingSoon from "@/components/ui/coming-soon"

export default async function AdminAnnouncementsPageRoute() {
  const showTeams = await adminTeamsFlag()

  if (!showTeams) {
    return <ComingSoon />
  }

  return <AnnouncementsAdminPage />
}
