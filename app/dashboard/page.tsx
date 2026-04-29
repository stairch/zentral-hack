import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { dashboardChallengesFlag } from "@/lib/flags"

export default async function DashboardPage() {
  const showChallenges = await dashboardChallengesFlag()

  return <DashboardContent showChallenges={showChallenges} />
}
