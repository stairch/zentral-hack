import {
  normalizeSponsorChallengeData,
  type SponsorChallengeData,
  type SponsorChallengeRecord
} from "@/lib/sponsor-challenge"

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
  challenge_title?: string | null
  challenge_title_en?: string | null
  submission_deadline?: string | null
}

// Challenge details shown to participants once the info is published (no contact, legal or signature data)
export interface ParticipantChallengeInfo {
  id: string
  challenge_title: string | null
  challenge_title_en: string | null
  short_description: string | null
  short_description_en: string | null
  company_name: string | null
  sponsor_name: string | null
  difficulty: string | null
  team_size: string | null
  challenge_language: string | null
  prize: string | null
  details: Pick<
    SponsorChallengeData,
    | "background"
    | "problemStatement"
    | "goal"
    | "mustRequirements"
    | "canRequirements"
    | "outOfScope"
    | "allowedTechnologies"
    | "restrictions"
    | "infrastructure"
    | "resources"
    | "deliverables"
    | "evaluation"
    | "prizes"
    | "categorySpecific"
  >
}

type ParticipantChallengeRow = Pick<
  SponsorChallengeRecord,
  | "id"
  | "challenge_title"
  | "challenge_title_en"
  | "short_description"
  | "short_description_en"
  | "company_name"
  | "difficulty"
  | "team_size"
  | "challenge_language"
  | "prize"
  | "challenge_data"
> & { sponsor_name: string | null }

export function toParticipantChallengeInfo(row: ParticipantChallengeRow): ParticipantChallengeInfo {
  const data = normalizeSponsorChallengeData(row.challenge_data)
  return {
    id: row.id,
    challenge_title: row.challenge_title,
    challenge_title_en: row.challenge_title_en,
    short_description: row.short_description,
    short_description_en: row.short_description_en,
    company_name: row.company_name,
    sponsor_name: row.sponsor_name,
    difficulty: row.difficulty,
    team_size: row.team_size,
    challenge_language: row.challenge_language,
    prize: row.prize,
    details: {
      background: data.background,
      problemStatement: data.problemStatement,
      goal: data.goal,
      mustRequirements: data.mustRequirements,
      canRequirements: data.canRequirements,
      outOfScope: data.outOfScope,
      allowedTechnologies: data.allowedTechnologies,
      restrictions: data.restrictions,
      infrastructure: data.infrastructure,
      resources: data.resources,
      deliverables: data.deliverables,
      evaluation: data.evaluation,
      prizes: data.prizes,
      categorySpecific: data.categorySpecific
    }
  }
}
