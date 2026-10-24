import { query } from "@/lib/db"
import { successResponse, serverError } from "@/lib/api"

export async function GET() {
  try {
    const [photosResult, leaderboardResult, participantsResult, teamsResult, sponsorsResult] =
      await Promise.all([
        query("SELECT id, image_url, caption FROM event_photos ORDER BY display_order ASC, created_at ASC"),
        query(
          `SELECT t.id, t.name, tr.rank, c.id AS category_id, c.name AS category_name, c.color AS category_color
           FROM team_rankings tr
           JOIN teams t ON t.id = tr.team_id
           JOIN categories c ON c.id = t.category_id
           WHERE tr.rank <= 3
           ORDER BY c.display_order ASC, tr.rank ASC`
        ),
        query(
          `SELECT COUNT(*)::integer AS count
           FROM registrations r
           JOIN users u ON u.id = r.user_id
           WHERE r.status != 'cancelled' AND u.role = 'user'`
        ),
        query("SELECT COUNT(*)::integer AS count FROM teams"),
        query(
          "SELECT COUNT(*)::integer AS count FROM sponsor_contacts WHERE status IN ('confirmed', 'published')"
        )
      ])

    return successResponse({
      photos: photosResult.rows,
      leaderboard: leaderboardResult.rows,
      stats: {
        participants: participantsResult.rows[0]?.count ?? 0,
        teams: teamsResult.rows[0]?.count ?? 0,
        sponsors: sponsorsResult.rows[0]?.count ?? 0
      }
    })
  } catch (error) {
    console.error("[Post Event] GET Error:", error)
    return serverError()
  }
}
