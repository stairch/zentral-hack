export type SponsorRole = "user" | "category_partner" | "sponsor" | "admin"

export type SponsorChallengeDifficulty = "Einsteiger" | "Fortgeschritten" | "Expert"
export type SponsorChallengeLanguage = "Deutsch" | "Englisch" | "Beides"

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
    criteria: string
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
      criteria:
        "Innovation & Kreativität | 25 | Neuartigkeit, Originalität\nTechnische Umsetzung | 25 | Code-Qualität, Architektur\nProblemlösung & Relevanz | 20 | Löst die Challenge das definierte Problem?\nPräsentation & Pitch | 15 | Klarheit, Demo, Überzeugungskraft\nBusiness-Potenzial | 15 | Umsetzbarkeit, Skalierbarkeit",
      weightingNotes: "Die Gewichtung muss gesamthaft 100% ergeben."
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
      ...empty.evaluation,
      ...(value.evaluation || {})
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
