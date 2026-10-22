import { query } from "@/lib/db"

export async function hasTeamAccess(
  teamId: string,
  userId: string,
  role: string | undefined,
  categoryId: string | undefined
): Promise<boolean> {
  if (role === "admin") return true

  const memberCheck = await query("SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2", [
    teamId,
    userId
  ])
  if (memberCheck.rows.length > 0) return true

  if (role === "category_partner" && categoryId) {
    const teamCheck = await query("SELECT id FROM teams WHERE id = $1 AND category_id = $2", [
      teamId,
      categoryId
    ])
    return teamCheck.rows.length > 0
  }

  return false
}
