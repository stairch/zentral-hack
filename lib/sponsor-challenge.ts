export type SponsorRole = "user" | "category_partner" | "sponsor" | "admin"

export type SponsorChallengeDifficulty = "Einsteiger" | "Fortgeschritten" | "Expert"
export type SponsorChallengeLanguage = "Deutsch" | "Englisch" | "Beides"

export interface EvaluationCriterion {
  name: string
  weight: number
  description: string
}

const DEFAULT_CRITERIA: EvaluationCriterion[] = [
  { name: "Innovation & Kreativität", weight: 25, description: "Neuartigkeit, Originalität" },
  { name: "Technische Umsetzung", weight: 25, description: "Code-Qualität, Architektur" },
  { name: "Problemlösung & Relevanz", weight: 20, description: "Löst die Challenge das definierte Problem?" },
  { name: "Präsentation & Pitch", weight: 15, description: "Klarheit, Demo, Überzeugungskraft" },
  { name: "Business-Potenzial", weight: 15, description: "Umsetzbarkeit, Skalierbarkeit" }
]

function normalizeCriteria(value: unknown): EvaluationCriterion[] {
  if (Array.isArray(value)) {
    return value.map((item) => ({
      name: typeof item.name === "string" ? item.name : "",
      weight: typeof item.weight === "number" ? item.weight : 0,
      description: typeof item.description === "string" ? item.description : ""
    }))
  }
  // Backward compat: old string format "Name | weight | description\n..."
  if (typeof value === "string" && value.trim()) {
    return value
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|").map((s) => s.trim())
        return {
          name: parts[0] || "",
          weight: parseInt(parts[1] || "0", 10) || 0,
          description: parts[2] || ""
        }
      })
  }
  return [...DEFAULT_CRITERIA]
}

export interface SponsorChallengeData {
  companyName: string
  branch: string
  contactName: string
  contactFunction: string
  contactEmail: string
  contactPhone: string
  website: string
  logoNote: string
  challengeTitle: string
  shortDescription: string
  difficulty: SponsorChallengeDifficulty | ""
  teamSize: string
  challengeLanguage: SponsorChallengeLanguage | ""
  background: string
  problemStatement: string
  goal: string
  mustRequirements: string
  canRequirements: string
  outOfScope: string
  allowedTechnologies: string
  restrictions: string
  infrastructure: string
  resources: {
    datasets: boolean
    apis: boolean
    documentation: boolean
    credentials: boolean
    sdk: boolean
    hardware: boolean
    aiModels: boolean
    mentoringSupport: boolean
    details: string
    times: string
  }
  deliverables: {
    prototype: boolean
    pitch: boolean
    pitchFormat: string
    codeRepository: boolean
    readme: boolean
    video: boolean
    videoLength: string
    other: string
  }
  evaluation: {
    criteria: EvaluationCriterion[]
    weightingNotes: string
  }
  prizes: {
    first: string
    second: string
    third: string
    special: string
  }
  categorySpecific: {
    youngTalentsTargetAudience: string
    youngTalentsPrerequisiteKnowledge: string
    youngTalentsMentorOnSite: boolean
    youngTalentsLearningGoals: string
    youngTalentsProgressEvaluated: boolean
    youngTalentsEntryHelp: string
    aiExpectedTechnology: string
    aiOwnModelsAllowed: boolean
    aiApiKeysProvided: string
    aiPrivacyRequirements: string
    aiEvaluationMetric: string
    aiOutputQualityEvaluated: boolean
    aiOutputQualityMethod: string
    campusChallengeType: string
    campusFlagFormat: string
    campusNumberOfFlags: string
    campusInfrastructureProvidedBy: string
    campusScopeOfAttack: string
    campusOutOfScope: string
    campusHintSystem: boolean
    campusHintCount: string
    campusDocumentSolution: boolean
    regionalConnection: string
    regionalLocalDataAvailable: boolean
    regionalLocalStakeholders: string
    regionalReuseAfterEvent: string
  }
  legal: {
    dataAnonymous: boolean
    noRestrictions: boolean
    portfolioAllowed: boolean
    noSpecialIpRules: boolean
    specialIpRules: string
  }
  signature: {
    placeDate: string
    name: string
    function: string
  }
}

export interface SponsorChallengeRecord {
  id: string
  user_id: string
  category_id: string
  status: "draft" | "published"
  company_name: string | null
  branch: string | null
  contact_name: string | null
  contact_function: string | null
  contact_email: string | null
  contact_phone: string | null
  website: string | null
  logo_note: string | null
  challenge_title: string | null
  short_description: string | null
  difficulty: SponsorChallengeDifficulty | null
  team_size: string | null
  challenge_language: SponsorChallengeLanguage | null
  prize: string | null
  challenge_data: SponsorChallengeData | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export function createEmptySponsorChallengeData(): SponsorChallengeData {
  return {
    companyName: "",
    branch: "",
    contactName: "",
    contactFunction: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    logoNote: "",
    challengeTitle: "",
    shortDescription: "",
    difficulty: "",
    teamSize: "",
    challengeLanguage: "",
    background: "",
    problemStatement: "",
    goal: "",
    mustRequirements: "",
    canRequirements: "",
    outOfScope: "",
    allowedTechnologies: "",
    restrictions: "",
    infrastructure: "",
    resources: {
      datasets: false,
      apis: false,
      documentation: false,
      credentials: false,
      sdk: false,
      hardware: false,
      aiModels: false,
      mentoringSupport: false,
      details: "",
      times: ""
    },
    deliverables: {
      prototype: false,
      pitch: false,
      pitchFormat: "",
      codeRepository: false,
      readme: false,
      video: false,
      videoLength: "",
      other: ""
    },
    evaluation: {
      criteria: [...DEFAULT_CRITERIA],
      weightingNotes: ""
    },
    prizes: {
      first: "",
      second: "",
      third: "",
      special: ""
    },
    categorySpecific: {
      youngTalentsTargetAudience: "",
      youngTalentsPrerequisiteKnowledge: "",
      youngTalentsMentorOnSite: false,
      youngTalentsLearningGoals: "",
      youngTalentsProgressEvaluated: false,
      youngTalentsEntryHelp: "",
      aiExpectedTechnology: "",
      aiOwnModelsAllowed: false,
      aiApiKeysProvided: "",
      aiPrivacyRequirements: "",
      aiEvaluationMetric: "",
      aiOutputQualityEvaluated: false,
      aiOutputQualityMethod: "",
      campusChallengeType: "",
      campusFlagFormat: "",
      campusNumberOfFlags: "",
      campusInfrastructureProvidedBy: "",
      campusScopeOfAttack: "",
      campusOutOfScope: "",
      campusHintSystem: false,
      campusHintCount: "",
      campusDocumentSolution: false,
      regionalConnection: "",
      regionalLocalDataAvailable: false,
      regionalLocalStakeholders: "",
      regionalReuseAfterEvent: ""
    },
    legal: {
      dataAnonymous: false,
      noRestrictions: false,
      portfolioAllowed: false,
      noSpecialIpRules: false,
      specialIpRules: ""
    },
    signature: {
      placeDate: "",
      name: "",
      function: ""
    }
  }
}

export function normalizeSponsorChallengeData(
  value?: Partial<SponsorChallengeData> | null
): SponsorChallengeData {
  const empty = createEmptySponsorChallengeData()
  if (!value) {
    return empty
  }

  return {
    ...empty,
    ...value,
    resources: {
      ...empty.resources,
      ...(value.resources || {})
    },
    deliverables: {
      ...empty.deliverables,
      ...(value.deliverables || {})
    },
    evaluation: {
      weightingNotes: value.evaluation?.weightingNotes ?? empty.evaluation.weightingNotes,
      criteria: normalizeCriteria((value.evaluation as { criteria?: unknown } | undefined)?.criteria)
    },
    prizes: {
      ...empty.prizes,
      ...(value.prizes || {})
    },
    categorySpecific: {
      ...empty.categorySpecific,
      ...(value.categorySpecific || {})
    },
    legal: {
      ...empty.legal,
      ...(value.legal || {})
    },
    signature: {
      ...empty.signature,
      ...(value.signature || {})
    }
  }
}
