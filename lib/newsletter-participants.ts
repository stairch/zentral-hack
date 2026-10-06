import { query } from "@/lib/db"
import type { NewsletterCampaign } from "@/lib/resend"

export interface ParticipantRecipient {
  email: string
  firstName: string | null
  lastName: string | null
}

interface ParticipantCategoryCount {
  id: string
  name: string
  count: number
}

export interface ParticipantAudienceCounts {
  all: number
  categories: ParticipantCategoryCount[]
}

/**
 * Participants are users with a confirmed email and at least one registration
 * that is not cancelled, optionally limited to a single category.
 */
export async function getParticipantRecipients(categoryId?: string): Promise<ParticipantRecipient[]> {
  const result = await query(
    `SELECT DISTINCT u.email, u.first_name, u.last_name
     FROM users u
     JOIN registrations r ON r.user_id = u.id
     WHERE u.email_verified = true
       AND u.is_active = true
       AND r.status <> 'cancelled'
       ${categoryId ? "AND r.category_id = $1" : ""}
     ORDER BY u.email`,
    categoryId ? [categoryId] : []
  )
  return result.rows.map((row) => ({
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name
  }))
}

export async function getParticipantAudienceCounts(): Promise<ParticipantAudienceCounts> {
  const [all, categories] = await Promise.all([
    query(
      `SELECT COUNT(DISTINCT u.id)::int AS count
       FROM users u
       JOIN registrations r ON r.user_id = u.id
       WHERE u.email_verified = true AND u.is_active = true AND r.status <> 'cancelled'`
    ),
    query(
      `SELECT c.id, c.name, COUNT(DISTINCT u.id)::int AS count
       FROM categories c
       LEFT JOIN registrations r ON r.category_id = c.id AND r.status <> 'cancelled'
       LEFT JOIN users u ON u.id = r.user_id AND u.email_verified = true AND u.is_active = true
       GROUP BY c.id, c.name
       ORDER BY c.name`
    )
  ])
  return {
    all: all.rows[0]?.count ?? 0,
    categories: categories.rows.map((row) => ({ id: row.id, name: row.name, count: row.count }))
  }
}

/**
 * Participant sends bypass Resend broadcasts, so each one is logged here to
 * keep it visible in the campaign list.
 */
export async function recordParticipantSend(input: {
  name: string
  categoryId?: string
  recipientCount: number
  scheduledAt?: string
}): Promise<void> {
  await query(
    `INSERT INTO newsletter_participant_sends (name, category_id, recipient_count, scheduled_at)
     VALUES ($1, $2, $3, $4)`,
    [input.name, input.categoryId ?? null, input.recipientCount, input.scheduledAt ?? null]
  )
}

export async function listParticipantSends(): Promise<NewsletterCampaign[]> {
  const result = await query(
    `SELECT s.id, s.name, s.recipient_count, s.scheduled_at, s.created_at, c.name AS category_name
     FROM newsletter_participant_sends s
     LEFT JOIN categories c ON c.id = s.category_id
     ORDER BY s.created_at DESC`
  )
  const now = Date.now()
  return result.rows.map((row) => {
    const scheduledAt: string | null = row.scheduled_at ? new Date(row.scheduled_at).toISOString() : null
    const createdAt = new Date(row.created_at).toISOString()
    const isScheduled = scheduledAt !== null && new Date(scheduledAt).getTime() > now
    return {
      id: row.id,
      name: row.name,
      status: isScheduled ? "scheduled" : "sent",
      segmentId: null,
      createdAt,
      scheduledAt,
      sentAt: isScheduled ? null : (scheduledAt ?? createdAt),
      lastModifiedAt: scheduledAt ?? createdAt,
      source: "participants",
      audience: `${row.category_name ?? "Teilnehmer"} (${row.recipient_count})`
    }
  })
}
