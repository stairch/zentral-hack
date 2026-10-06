export type ChallengeSubmissionStatus = "pending" | "accepted" | "rejected"

export interface ChallengeSubmissionRecord {
  id: string
  user_id: string
  category_id: string
  challenge_id: string
  description: string | null
  status: ChallengeSubmissionStatus
  review_comment: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}
