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

// Admin-side access only: super admins see every team, category partners only their category's
export async function canManageTeam(
  teamId: string,
  role: string | undefined,
  categoryId: string | undefined
): Promise<boolean> {
  const teamCheck = await query("SELECT category_id FROM teams WHERE id = $1", [teamId])
  if (teamCheck.rows.length === 0) return false
  if (role === "admin") return true
  return role === "category_partner" && teamCheck.rows[0].category_id === categoryId
}

export async function isTeamMember(userId: string): Promise<boolean> {
  const result = await query("SELECT 1 FROM team_members WHERE user_id = $1 LIMIT 1", [userId])
  return result.rows.length > 0
}

// A participant's category follows their team. A challenge submission belongs to the old
// category's challenges, so it is withdrawn when the category actually changes.
export async function syncParticipantCategoryToTeam(userId: string, categoryId: string): Promise<void> {
  const registration = await query("SELECT category_id FROM registrations WHERE user_id = $1", [userId])
  const previousCategoryId: string | undefined = registration.rows[0]?.category_id

  if (!registration.rows[0]) {
    await query(
      `INSERT INTO registrations (user_id, category_id, status, confirmation_sent)
       VALUES ($1, $2, 'confirmed', false)`,
      [userId, categoryId]
    )
  } else if (previousCategoryId !== categoryId) {
    await query("UPDATE registrations SET category_id = $1, updated_at = NOW() WHERE user_id = $2", [
      categoryId,
      userId
    ])
  }

  await query("UPDATE users SET category_id = $1 WHERE id = $2", [categoryId, userId])

  if (previousCategoryId && previousCategoryId !== categoryId) {
    await query("DELETE FROM challenge_submissions WHERE user_id = $1", [userId])
  }
}

// Participants in a team work on the team's challenge, so their submission is set to it and accepted.
// Pass userId to sync only that member, otherwise every participant of the team is synced.
export async function syncTeamChallengeToMembers(teamId: string, userId?: string): Promise<void> {
  const params: string[] = [teamId]
  let userFilter = ""
  if (userId) {
    params.push(userId)
    userFilter = " AND tm.user_id = $2"
  }

  await query(
    `INSERT INTO challenge_submissions (user_id, category_id, challenge_id, status, reviewed_at)
     SELECT tm.user_id, t.category_id, t.challenge_id, 'accepted', NOW()
     FROM teams t
     JOIN team_members tm ON tm.team_id = t.id
     JOIN users u ON u.id = tm.user_id AND u.role = 'user'
     WHERE t.id = $1 AND t.challenge_id IS NOT NULL${userFilter}
     ON CONFLICT (user_id) DO UPDATE
     SET category_id = EXCLUDED.category_id,
         challenge_id = EXCLUDED.challenge_id,
         status = 'accepted',
         review_comment = NULL,
         reviewed_at = NOW(),
         updated_at = NOW()
     WHERE challenge_submissions.challenge_id IS DISTINCT FROM EXCLUDED.challenge_id
        OR challenge_submissions.status <> 'accepted'`,
    params
  )
}

// Deadline of the team's challenge; teams without an assigned challenge fall back to the
// earliest deadline of a challenge one of their members has been accepted for
export async function getTeamSubmissionDeadline(teamId: string): Promise<string | null> {
  const result = await query(
    `SELECT CASE
              WHEN t.challenge_id IS NOT NULL THEN sc.submission_deadline
              ELSE (
                SELECT MIN(msc.submission_deadline)
                FROM team_members tm
                JOIN challenge_submissions cs ON cs.user_id = tm.user_id AND cs.status = 'accepted'
                JOIN sponsor_challenges msc ON msc.id = cs.challenge_id
                WHERE tm.team_id = t.id
              )
            END AS submission_deadline
     FROM teams t
     LEFT JOIN sponsor_challenges sc ON sc.id = t.challenge_id
     WHERE t.id = $1`,
    [teamId]
  )
  const deadline = result.rows[0]?.submission_deadline
  return deadline ? new Date(deadline).toISOString() : null
}

// Admins and category partners may still fix a team's submission after the deadline
export async function isTeamSubmissionClosed(teamId: string, role: string | undefined): Promise<boolean> {
  if (role === "admin" || role === "category_partner") return false
  const deadline = await getTeamSubmissionDeadline(teamId)
  return !!deadline && new Date(deadline).getTime() <= Date.now()
}

export const SUBMISSION_CLOSED_ERROR = "Die Abgabefrist ist abgelaufen, Änderungen sind nicht mehr möglich"
