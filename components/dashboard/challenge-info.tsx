"use client"

import { Badge } from "@/components/ui/badge"
import { Trophy } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { type ParticipantChallengeInfo } from "@/lib/challenge-submission"
import { formatSponsorNames } from "@/lib/sponsor-challenge"

const copy = {
  de: {
    poweredBy: (name: string) => `Powered by ${name}`,
    difficulty: "Schwierigkeit",
    teamSize: "Teamgrösse",
    language: "Sprache",
    prize: "Preis",
    problemContext: "Problemstellung & Kontext",
    background: "Hintergrund",
    problem: "Das Problem",
    goal: "Zielsetzung",
    requirements: "Anforderungen",
    mustRequirements: "MUSS-Anforderungen",
    canRequirements: "KANN-Anforderungen",
    outOfScope: "Nicht im Scope",
    technical: "Technische Rahmenbedingungen",
    allowedTechnologies: "Erlaubte Technologien & Vorgaben",
    restrictions: "Einschränkungen",
    infrastructure: "Infrastruktur / Umgebung",
    providedResources: "Bereitgestellte Ressourcen",
    datasets: "Datensätze / Daten",
    apis: "APIs / Endpoints",
    documentation: "Dokumentation",
    credentials: "Zugangsdaten / Credentials",
    sdk: "SDK / Libraries",
    hardware: "Hardware",
    aiModels: "KI-Modelle / LLMs",
    mentoringSupport: "Mentoring-Support",
    resourceDetails: "Details zu den Ressourcen",
    resourceTimes: "Bereitstellungszeitpunkt",
    deliverables: "Erwartete Deliverables",
    prototype: "Funktionierender Prototyp / Demo",
    pitch: "Präsentation / Pitch",
    codeRepository: "Code-Repository",
    readme: "README / Dokumentation",
    video: "Kurzvideo",
    pitchFormat: "Pitch-Format",
    videoLength: "Max. Video-Länge",
    otherDeliverables: "Weitere Deliverables",
    evaluationCriteria: "Bewertungskriterien",
    criterion: "Kriterium",
    weight: "Gewichtung",
    evalDescription: "Beschreibung",
    prizes: "Preise & Anreize",
    firstPlace: "1. Platz",
    secondPlace: "2. Platz",
    thirdPlace: "3. Platz",
    specialPrize: "Sonderpreis",
    categorySpecific: "Weitere Informationen",
    categorySpecificLabels: {
      youngTalentsTargetAudience: "Zielpublikum",
      youngTalentsPrerequisiteKnowledge: "Vorausgesetztes Wissen",
      youngTalentsLearningGoals: "Lernziele",
      youngTalentsEntryHelp: "Einstiegshilfen",
      aiExpectedTechnology: "Erwartete KI-Technologie",
      aiApiKeysProvided: "API-Keys werden bereitgestellt?",
      aiPrivacyRequirements: "Datenschutzanforderungen",
      aiEvaluationMetric: "Evaluation-Metrik",
      aiOutputQualityMethod: "Bewertungsmethode",
      campusChallengeType: "Art der Challenge",
      campusFlagFormat: "Flag-Format",
      campusNumberOfFlags: "Anzahl Flags / Levels",
      campusInfrastructureProvidedBy: "Infrastruktur bereitgestellt durch",
      campusScopeOfAttack: "Scope of Attack",
      campusOutOfScope: "Out of Scope",
      campusHintCount: "Anzahl Hinweise",
      regionalConnection: "Regionaler Bezug",
      regionalLocalStakeholders: "Lokale Stakeholder",
      regionalReuseAfterEvent: "Weiternutzung nach Event"
    }
  },
  en: {
    poweredBy: (name: string) => `Powered by ${name}`,
    difficulty: "Difficulty",
    teamSize: "Team size",
    language: "Language",
    prize: "Prize",
    problemContext: "Problem Statement & Context",
    background: "Background",
    problem: "The Problem",
    goal: "Goal",
    requirements: "Requirements",
    mustRequirements: "MUST requirements",
    canRequirements: "SHOULD requirements",
    outOfScope: "Out of scope",
    technical: "Technical Constraints",
    allowedTechnologies: "Allowed technologies & requirements",
    restrictions: "Restrictions",
    infrastructure: "Infrastructure / Environment",
    providedResources: "Provided Resources",
    datasets: "Datasets / Data",
    apis: "APIs / Endpoints",
    documentation: "Documentation",
    credentials: "Access credentials",
    sdk: "SDK / Libraries",
    hardware: "Hardware",
    aiModels: "AI models / LLMs",
    mentoringSupport: "Mentoring support",
    resourceDetails: "Resource details",
    resourceTimes: "Availability",
    deliverables: "Expected Deliverables",
    prototype: "Working prototype / demo",
    pitch: "Presentation / pitch",
    codeRepository: "Code repository",
    readme: "README / documentation",
    video: "Short video",
    pitchFormat: "Pitch format",
    videoLength: "Max. video length",
    otherDeliverables: "Other deliverables",
    evaluationCriteria: "Evaluation Criteria",
    criterion: "Criterion",
    weight: "Weight",
    evalDescription: "Description",
    prizes: "Prizes & Incentives",
    firstPlace: "1st place",
    secondPlace: "2nd place",
    thirdPlace: "3rd place",
    specialPrize: "Special prize",
    categorySpecific: "Further information",
    categorySpecificLabels: {
      youngTalentsTargetAudience: "Target audience",
      youngTalentsPrerequisiteKnowledge: "Prerequisite knowledge",
      youngTalentsLearningGoals: "Learning goals",
      youngTalentsEntryHelp: "Getting started aids",
      aiExpectedTechnology: "Expected AI technology",
      aiApiKeysProvided: "API keys provided?",
      aiPrivacyRequirements: "Privacy requirements",
      aiEvaluationMetric: "Evaluation metric",
      aiOutputQualityMethod: "Evaluation method",
      campusChallengeType: "Challenge type",
      campusFlagFormat: "Flag format",
      campusNumberOfFlags: "Number of flags / levels",
      campusInfrastructureProvidedBy: "Infrastructure provided by",
      campusScopeOfAttack: "Scope of attack",
      campusOutOfScope: "Out of scope",
      campusHintCount: "Number of hints",
      regionalConnection: "Regional connection",
      regionalLocalStakeholders: "Local stakeholders",
      regionalReuseAfterEvent: "Reuse after event"
    }
  }
} as const

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-muted-foreground border-border border-b pb-2 text-xs font-semibold tracking-wider uppercase">
      {children}
    </h3>
  )
}

function TextBlock({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null
  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed whitespace-pre-line">{value}</p>
    </div>
  )
}

export function ChallengeInfo({ info }: { info: ParticipantChallengeInfo }) {
  const { language } = useLanguage()
  const text = copy[language]
  const { details } = info

  // Show the challenge text for the active language, falling back to the other language.
  const pickLocale = (de: string | null | undefined, en: string | null | undefined) =>
    (language === "en" ? en || de : de || en) || ""

  const title = pickLocale(info.challenge_title, info.challenge_title_en)
  const shortDescription = pickLocale(info.short_description, info.short_description_en)
  const byline = [
    info.company_name,
    info.difficulty && `${text.difficulty}: ${info.difficulty}`,
    info.team_size && `${text.teamSize}: ${info.team_size}`,
    info.challenge_language && `${text.language}: ${info.challenge_language}`
  ].filter(Boolean)
  const prize = info.prize || details.prizes.first

  const hasProblem = [details.background, details.problemStatement, details.goal].some((v) => v.trim())
  const hasRequirements = [details.mustRequirements, details.canRequirements, details.outOfScope].some((v) =>
    v.trim()
  )
  const hasTechnical = [details.allowedTechnologies, details.restrictions, details.infrastructure].some((v) =>
    v.trim()
  )

  const resourceItems = (
    [
      "datasets",
      "apis",
      "documentation",
      "credentials",
      "sdk",
      "hardware",
      "aiModels",
      "mentoringSupport"
    ] as const
  ).filter((key) => details.resources[key])
  const hasResources =
    resourceItems.length > 0 || details.resources.details.trim() || details.resources.times.trim()

  const deliverableItems = (["prototype", "pitch", "codeRepository", "readme", "video"] as const).filter(
    (key) => details.deliverables[key]
  )
  const hasDeliverables = deliverableItems.length > 0 || details.deliverables.other.trim()

  const criteria = details.evaluation.criteria.filter((c) => c.name.trim())

  const prizeItems = [
    { label: text.firstPlace, value: details.prizes.first },
    { label: text.secondPlace, value: details.prizes.second },
    { label: text.thirdPlace, value: details.prizes.third },
    { label: text.specialPrize, value: details.prizes.special }
  ].filter((p) => p.value.trim())

  const categorySpecificItems = (
    Object.keys(text.categorySpecificLabels) as Array<keyof typeof text.categorySpecificLabels>
  )
    .map((key) => ({
      label: text.categorySpecificLabels[key],
      value: String(details.categorySpecific[key] ?? "")
    }))
    .filter((item) => item.value.trim())

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        {byline.length > 0 && <p className="text-muted-foreground text-xs">{byline.join(" · ")}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-bold">{title}</h3>
          {info.sponsor_names.length > 0 && (
            <Badge variant="secondary">{text.poweredBy(formatSponsorNames(info.sponsor_names))}</Badge>
          )}
        </div>
        {shortDescription && <p className="text-sm leading-relaxed">{shortDescription}</p>}
        {prize?.trim() && (
          <div className="border-border bg-primary/5 flex items-center gap-3 rounded-xl border p-3">
            <Trophy className="text-primary h-4 w-4 shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {text.prize}
              </p>
              <p className="font-bold">{prize}</p>
            </div>
          </div>
        )}
      </header>

      {hasProblem && (
        <section className="space-y-4">
          <SectionHeading>{text.problemContext}</SectionHeading>
          <TextBlock label={text.background} value={details.background} />
          <TextBlock label={text.problem} value={details.problemStatement} />
          <TextBlock label={text.goal} value={details.goal} />
        </section>
      )}

      {hasRequirements && (
        <section className="space-y-4">
          <SectionHeading>{text.requirements}</SectionHeading>
          <TextBlock label={text.mustRequirements} value={details.mustRequirements} />
          <TextBlock label={text.canRequirements} value={details.canRequirements} />
          <TextBlock label={text.outOfScope} value={details.outOfScope} />
        </section>
      )}

      {hasTechnical && (
        <section className="space-y-4">
          <SectionHeading>{text.technical}</SectionHeading>
          <TextBlock label={text.allowedTechnologies} value={details.allowedTechnologies} />
          <TextBlock label={text.restrictions} value={details.restrictions} />
          <TextBlock label={text.infrastructure} value={details.infrastructure} />
        </section>
      )}

      {hasResources && (
        <section className="space-y-4">
          <SectionHeading>{text.providedResources}</SectionHeading>
          {resourceItems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {resourceItems.map((key) => (
                <Badge key={key} variant="outline">
                  {text[key]}
                </Badge>
              ))}
            </div>
          )}
          <TextBlock label={text.resourceDetails} value={details.resources.details} />
          <TextBlock label={text.resourceTimes} value={details.resources.times} />
        </section>
      )}

      {hasDeliverables && (
        <section className="space-y-4">
          <SectionHeading>{text.deliverables}</SectionHeading>
          {deliverableItems.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {deliverableItems.map((key) => (
                <li key={key}>
                  {text[key]}
                  {key === "pitch" && details.deliverables.pitchFormat.trim() && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({text.pitchFormat}: {details.deliverables.pitchFormat})
                    </span>
                  )}
                  {key === "video" && details.deliverables.videoLength.trim() && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({text.videoLength}: {details.deliverables.videoLength})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <TextBlock label={text.otherDeliverables} value={details.deliverables.other} />
        </section>
      )}

      {criteria.length > 0 && (
        <section className="space-y-4">
          <SectionHeading>{text.evaluationCriteria}</SectionHeading>
          <div className="border-border overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
                <tr>
                  <th className="px-3 py-2 font-semibold">{text.criterion}</th>
                  <th className="px-3 py-2 font-semibold">{text.weight}</th>
                  <th className="px-3 py-2 font-semibold">{text.evalDescription}</th>
                </tr>
              </thead>
              <tbody>
                {criteria.map((c, i) => (
                  <tr key={i} className="border-border border-t">
                    <td className="px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2">{c.weight}%</td>
                    <td className="text-muted-foreground px-3 py-2">{c.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {details.evaluation.weightingNotes.trim() && (
            <p className="text-muted-foreground text-sm whitespace-pre-line">
              {details.evaluation.weightingNotes}
            </p>
          )}
        </section>
      )}

      {prizeItems.length > 0 && (
        <section className="space-y-4">
          <SectionHeading>{text.prizes}</SectionHeading>
          <dl className="grid gap-3 sm:grid-cols-2">
            {prizeItems.map((p) => (
              <div key={p.label}>
                <dt className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {p.label}
                </dt>
                <dd className="mt-0.5 text-sm">{p.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {categorySpecificItems.length > 0 && (
        <section className="space-y-4">
          <SectionHeading>{text.categorySpecific}</SectionHeading>
          {categorySpecificItems.map((item) => (
            <TextBlock key={item.label} label={item.label} value={item.value} />
          ))}
        </section>
      )}
    </article>
  )
}
