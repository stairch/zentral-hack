"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Eye, FileText, Gavel, Loader2, Package, Plus, Save, Send, Trash2, Trophy } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import {
  createEmptySponsorChallengeData,
  normalizeSponsorChallengeData,
  type EvaluationCriterion,
  type SponsorChallengeData,
  type SponsorChallengeRecord
} from "@/lib/sponsor-challenge"

type SponsorChallengeEditorProps = {
  categoryName: string
  categorySlug: string
  categoryId?: string
  initialChallenge: SponsorChallengeRecord | null
  onSaved?: (challenge: SponsorChallengeRecord) => void
}

interface ChallengeListItem {
  id: string
  challenge_title: string | null
  challenge_title_en: string | null
  status: "draft" | "published"
  updated_at: string
  category_id: string
}

interface SponsorOption {
  id: string
  company_name: string
}

const NO_SPONSOR = "none"

function Field({
  label,
  hint,
  required,
  children
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}

function CheckboxRow({
  id,
  label,
  checked,
  onCheckedChange,
  hint
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
  hint?: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(Boolean(v))}
        className="mt-0.5"
      />
      <div className="space-y-0.5">
        <Label htmlFor={id} className="cursor-pointer text-sm leading-snug font-medium">
          {label}
        </Label>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </div>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-muted-foreground border-border border-b pb-2 text-xs font-semibold tracking-wider uppercase">
      {children}
    </h3>
  )
}

function EvaluationTable({
  criteria,
  onChange,
  labels
}: {
  criteria: EvaluationCriterion[]
  onChange: (criteria: EvaluationCriterion[]) => void
  labels: {
    criterion: string
    weight: string
    description: string
    addCriterion: string
    total: string
    mustBe100: string
    noCriteria: string
  }
}) {
  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0)

  const addRow = () => onChange([...criteria, { name: "", weight: 0, description: "" }])
  const removeRow = (i: number) => onChange(criteria.filter((_, idx) => idx !== i))
  const updateRow = (i: number, partial: Partial<EvaluationCriterion>) =>
    onChange(criteria.map((c, idx) => (idx === i ? { ...c, ...partial } : c)))

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-3 py-2 text-left font-medium">{labels.criterion}</th>
              <th className="w-28 px-3 py-2 text-left font-medium">{labels.weight}</th>
              <th className="px-3 py-2 text-left font-medium">{labels.description}</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {criteria.map((c, i) => (
              <tr key={i} className="hover:bg-muted/20 border-b last:border-0">
                <td className="px-3 py-1.5">
                  <Input
                    value={c.name}
                    onChange={(e) => updateRow(i, { name: e.target.value })}
                    placeholder="e.g. Innovation"
                    className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={c.weight === 0 ? "" : c.weight}
                    onChange={(e) => updateRow(i, { weight: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <Input
                    value={c.description}
                    onChange={(e) => updateRow(i, { description: e.target.value })}
                    placeholder="Optional"
                    className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {criteria.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-3 py-4 text-center text-sm">
                  {labels.noCriteria}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {labels.addCriterion}
        </Button>
        <span
          className={cn(
            "text-sm font-medium",
            totalWeight === 100
              ? "text-green-600"
              : totalWeight > 0
                ? "text-amber-600"
                : "text-muted-foreground"
          )}>
          {labels.total}: {totalWeight}%{totalWeight > 0 && totalWeight !== 100 && ` ${labels.mustBe100}`}
        </span>
      </div>
    </div>
  )
}

export function SponsorChallengeEditor({
  categoryName,
  categorySlug,
  categoryId,
  initialChallenge,
  onSaved
}: SponsorChallengeEditorProps) {
  const { language } = useLanguage()
  const { user: currentUser } = useAuth()
  const canPublish = currentUser?.role !== "sponsor"

  const t = {
    de: {
      existingChallenges: "Vorhandene Challenges",
      loading: "Lade…",
      selectChallenge: "Challenge auswählen",
      publishedLabel: "Veröffentlicht",
      draftLabel: "Entwurf",
      newChallenge: "+ Neue Challenge",
      saveDraft: "Entwurf speichern",
      publish: "Veröffentlichen",
      websiteVisible: "Auf der Website sichtbar",
      websiteVisibleDesc:
        "Diese Felder werden direkt auf der Zentral Hack Website bei den Challenges angezeigt.",
      challengeTitleDe: "Challenge-Titel (Deutsch)",
      challengeTitleEn: "Challenge-Titel (Englisch)",
      shortDescriptionDe: "Kurzbeschreibung (Deutsch)",
      shortDescriptionEn: "Kurzbeschreibung (Englisch)",
      shortDescriptionHint: "Max. 2–3 Sätze – wird als Teaser angezeigt",
      prize: "Preisgeld / Preis",
      prizeHint: "Wird als Preis-Highlight auf der Challenge-Karte angezeigt",
      sponsor: "Sponsor",
      sponsorHint: "Verknüpft die Challenge mit einem bestätigten oder veröffentlichten Sponsor",
      noSponsor: "Kein Sponsor",
      challengeFormat: "Challenge-Format",
      difficulty: "Schwierigkeitsgrad",
      teamSize: "Empfohlene Teamgrösse",
      language: "Sprache",
      beginner: "Einsteiger",
      intermediate: "Fortgeschritten",
      expert: "Expert",
      german: "Deutsch",
      english: "Englisch",
      both: "Beides",
      choose: "Wählen",
      tabContent: "Inhalt",
      tabResources: "Ressourcen",
      tabClosing: "Abschluss",
      problemContext: "Problemstellung & Kontext",
      background: "Hintergrund",
      backgroundHint: "Kontext und Ausgangssituation beschreiben",
      problem: "Das Problem",
      problemHint: "Was soll gelöst werden?",
      goal: "Zielsetzung",
      goalHint: "Was ist das erwünschte Ergebnis?",
      requirements: "Anforderungen",
      mustRequirements: "MUSS-Anforderungen",
      mustRequirementsHint: "Was muss die Lösung zwingend erfüllen?",
      canRequirements: "KANN-Anforderungen",
      canRequirementsHint: "Optionale Erweiterungen / Bonus-Features",
      outOfScope: "Nicht im Scope",
      outOfScopeHint: "Was soll explizit nicht Teil der Lösung sein?",
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
      resourceTimesHint: "Wann stehen die Ressourcen bereit?",
      deliverables: "Erwartete Deliverables",
      prototype: "Funktionierender Prototyp / Demo",
      pitch: "Präsentation / Pitch",
      codeRepository: "Code-Repository",
      readme: "README / Dokumentation",
      video: "Kurzvideo",
      pitchFormat: "Pitch-Format",
      videoLength: "Max. Video-Länge",
      otherDeliverables: "Weitere Deliverables",
      otherDeliverablesHint: "Sonstiges",
      evaluationCriteria: "Bewertungskriterien",
      criterion: "Kriterium",
      weight: "Gewichtung %",
      evalDescription: "Beschreibung",
      addCriterion: "Kriterium hinzufügen",
      total: "Total",
      mustBe100: "· muss 100% ergeben",
      noCriteria: "Noch keine Kriterien hinzugefügt",
      prizes: "Preise & Anreize",
      firstPlace: "1. Platz",
      secondPlace: "2. Platz",
      thirdPlace: "3. Platz",
      specialPrize: "Sonderpreis",
      legal: "Datenschutz & Rechtliches",
      dataAnonymous: "Alle bereitgestellten Daten sind anonymisiert oder frei verwendbar",
      noRestrictions: "Keine rechtlichen Einschränkungen für die Teilnahme",
      portfolioAllowed: "Teams dürfen die Lösung im Portfolio verwenden",
      noSpecialIpRules: "IP/Urheberrecht: keine Sonderregelungen",
      specialIpRules: "Sonderregelungen IP/Urheberrecht",
      specialIpRulesPlaceholder: "Nur ausfüllen falls Sonderregelungen bestehen",
      categorySpecific: "Kategoriespezifisch",
      targetAudience: "Zielpublikum",
      targetAudienceHint: "z.B. 1. bis 3. Lehrjahr, Fachrichtung",
      prerequisiteKnowledge: "Vorausgesetztes Wissen",
      mentorOnSite: "Mentor vor Ort anwesend",
      progressEvaluated: "Lernfortschritt wird bewertet",
      learningGoals: "Lernziele",
      entryHelp: "Einstiegshilfen",
      entryHelpHint: "z.B. Starter-Code, Tutorial",
      expectedTechnology: "Erwartete KI-Technologie",
      ownModelsAllowed: "Eigene Modelle erlaubt?",
      yes: "Ja",
      no: "Nein",
      apiKeysProvided: "API-Keys werden bereitgestellt?",
      evaluationMetric: "Evaluation-Metrik",
      privacyRequirements: "Datenschutzanforderungen",
      outputQualityEvaluated: "Output-Qualität wird bewertet",
      evaluationMethod: "Bewertungsmethode",
      challengeType: "Art der Challenge",
      flagFormat: "Flag-Format",
      numberOfFlags: "Anzahl Flags / Levels",
      infrastructureProvidedBy: "Infrastruktur bereitgestellt durch",
      scopeOfAttack: "Scope of Attack",
      campusOutOfScope: "Out of Scope",
      regionalConnection: "Regionaler Bezug",
      localDataAvailable: "Lokale Daten verfügbar",
      localStakeholders: "Lokale Stakeholder",
      reuseAfterEvent: "Weiternutzung nach Event",
      loadError: "Fehler beim Laden",
      saveSuccess: "Entwurf gespeichert",
      publishSuccess: "Challenge veröffentlicht",
      saveError: "Fehler beim Speichern"
    },
    en: {
      existingChallenges: "Existing Challenges",
      loading: "Loading…",
      selectChallenge: "Select challenge",
      publishedLabel: "Published",
      draftLabel: "Draft",
      newChallenge: "+ New Challenge",
      saveDraft: "Save draft",
      publish: "Publish",
      websiteVisible: "Visible on website",
      websiteVisibleDesc: "These fields are displayed directly on the Zentral Hack website under Challenges.",
      challengeTitleDe: "Challenge title (German)",
      challengeTitleEn: "Challenge title (English)",
      shortDescriptionDe: "Short description (German)",
      shortDescriptionEn: "Short description (English)",
      shortDescriptionHint: "Max. 2–3 sentences – shown as a teaser",
      prize: "Prize / Reward",
      prizeHint: "Shown as a prize highlight on the challenge card",
      sponsor: "Sponsor",
      sponsorHint: "Links the challenge to a confirmed or published sponsor",
      noSponsor: "No sponsor",
      challengeFormat: "Challenge Format",
      difficulty: "Difficulty",
      teamSize: "Recommended team size",
      language: "Language",
      beginner: "Beginner",
      intermediate: "Intermediate",
      expert: "Expert",
      german: "German",
      english: "English",
      both: "Both",
      choose: "Select",
      tabContent: "Content",
      tabResources: "Resources",
      tabClosing: "Closing",
      problemContext: "Problem Statement & Context",
      background: "Background",
      backgroundHint: "Describe the context and starting situation",
      problem: "The Problem",
      problemHint: "What needs to be solved?",
      goal: "Goal",
      goalHint: "What is the desired outcome?",
      requirements: "Requirements",
      mustRequirements: "MUST requirements",
      mustRequirementsHint: "What must the solution absolutely fulfil?",
      canRequirements: "SHOULD requirements",
      canRequirementsHint: "Optional extensions / bonus features",
      outOfScope: "Out of scope",
      outOfScopeHint: "What should explicitly not be part of the solution?",
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
      resourceTimesHint: "When will the resources be available?",
      deliverables: "Expected Deliverables",
      prototype: "Working prototype / demo",
      pitch: "Presentation / pitch",
      codeRepository: "Code repository",
      readme: "README / documentation",
      video: "Short video",
      pitchFormat: "Pitch format",
      videoLength: "Max. video length",
      otherDeliverables: "Other deliverables",
      otherDeliverablesHint: "Miscellaneous",
      evaluationCriteria: "Evaluation Criteria",
      criterion: "Criterion",
      weight: "Weight %",
      evalDescription: "Description",
      addCriterion: "Add criterion",
      total: "Total",
      mustBe100: "· must equal 100%",
      noCriteria: "No criteria added yet",
      prizes: "Prizes & Incentives",
      firstPlace: "1st place",
      secondPlace: "2nd place",
      thirdPlace: "3rd place",
      specialPrize: "Special prize",
      legal: "Privacy & Legal",
      dataAnonymous: "All provided data is anonymised or freely usable",
      noRestrictions: "No legal restrictions for participation",
      portfolioAllowed: "Teams may use the solution in their portfolio",
      noSpecialIpRules: "IP/copyright: no special rules",
      specialIpRules: "Special IP/copyright rules",
      specialIpRulesPlaceholder: "Only fill in if special rules apply",
      categorySpecific: "Category-specific",
      targetAudience: "Target audience",
      targetAudienceHint: "e.g. 1st–3rd year apprentices, field of study",
      prerequisiteKnowledge: "Prerequisite knowledge",
      mentorOnSite: "Mentor present on site",
      progressEvaluated: "Learning progress is evaluated",
      learningGoals: "Learning goals",
      entryHelp: "Getting started aids",
      entryHelpHint: "e.g. starter code, tutorial",
      expectedTechnology: "Expected AI technology",
      ownModelsAllowed: "Own models allowed?",
      yes: "Yes",
      no: "No",
      apiKeysProvided: "API keys provided?",
      evaluationMetric: "Evaluation metric",
      privacyRequirements: "Privacy requirements",
      outputQualityEvaluated: "Output quality is evaluated",
      evaluationMethod: "Evaluation method",
      challengeType: "Challenge type",
      flagFormat: "Flag format",
      numberOfFlags: "Number of flags / levels",
      infrastructureProvidedBy: "Infrastructure provided by",
      scopeOfAttack: "Scope of attack",
      campusOutOfScope: "Out of scope",
      regionalConnection: "Regional connection",
      localDataAvailable: "Local data available",
      localStakeholders: "Local stakeholders",
      reuseAfterEvent: "Reuse after event",
      loadError: "Error loading",
      saveSuccess: "Draft saved",
      publishSuccess: "Challenge published",
      saveError: "Error saving"
    }
  }[language]

  const [formData, setFormData] = useState<SponsorChallengeData>(() => createEmptySponsorChallengeData())
  const [prize, setPrize] = useState("")
  const [sponsorId, setSponsorId] = useState("")
  const [sponsors, setSponsors] = useState<SponsorOption[]>([])
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [saving, setSaving] = useState<"draft" | "published" | null>(null)
  const [challengeList, setChallengeList] = useState<ChallengeListItem[]>([])
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("")
  const [loadingList, setLoadingList] = useState(false)

  const patch = (partial: Partial<SponsorChallengeData>) => setFormData((prev) => ({ ...prev, ...partial }))

  const patchSpecific = (partial: Partial<SponsorChallengeData["categorySpecific"]>) =>
    setFormData((prev) => ({ ...prev, categorySpecific: { ...prev.categorySpecific, ...partial } }))

  const patchResources = (partial: Partial<SponsorChallengeData["resources"]>) =>
    setFormData((prev) => ({ ...prev, resources: { ...prev.resources, ...partial } }))

  const patchDeliverables = (partial: Partial<SponsorChallengeData["deliverables"]>) =>
    setFormData((prev) => ({ ...prev, deliverables: { ...prev.deliverables, ...partial } }))

  const patchEvaluation = (partial: Partial<SponsorChallengeData["evaluation"]>) =>
    setFormData((prev) => ({ ...prev, evaluation: { ...prev.evaluation, ...partial } }))

  const patchPrizes = (partial: Partial<SponsorChallengeData["prizes"]>) =>
    setFormData((prev) => ({ ...prev, prizes: { ...prev.prizes, ...partial } }))

  const patchLegal = (partial: Partial<SponsorChallengeData["legal"]>) =>
    setFormData((prev) => ({ ...prev, legal: { ...prev.legal, ...partial } }))

  function applyRecord(record: SponsorChallengeRecord) {
    setStatus(record.status)
    setPrize(record.prize || "")
    setSponsorId(record.sponsor_id || "")
    const normalized = normalizeSponsorChallengeData(record.challenge_data)
    setFormData({
      ...normalized,
      challengeTitle: record.challenge_title || normalized.challengeTitle,
      challengeTitleEn: record.challenge_title_en || normalized.challengeTitleEn,
      shortDescription: record.short_description || normalized.shortDescription,
      shortDescriptionEn: record.short_description_en || normalized.shortDescriptionEn,
      difficulty: (record.difficulty as SponsorChallengeData["difficulty"]) || normalized.difficulty,
      teamSize: record.team_size || normalized.teamSize,
      challengeLanguage:
        (record.challenge_language as SponsorChallengeData["challengeLanguage"]) ||
        normalized.challengeLanguage
    })
  }

  async function loadChallengeCollection(challengeId?: string) {
    if (!categoryId) return
    setLoadingList(true)
    try {
      const params = new URLSearchParams({ categoryId })
      if (challengeId) params.set("challengeId", challengeId)
      const res = await fetch(`/api/sponsor/challenge?${params}`, { credentials: "include" })
      if (!res.ok) throw new Error()
      const json = await res.json()
      const list = (json.data?.challenges || []) as ChallengeListItem[]
      const selected = (json.data?.challenge || null) as SponsorChallengeRecord | null
      setChallengeList(list)
      setSelectedChallengeId(selected?.id || list[0]?.id || "")
      if (selected) applyRecord(selected)
      else {
        setStatus("draft")
        setPrize("")
        setSponsorId("")
        setFormData(createEmptySponsorChallengeData())
      }
    } catch {
      toast.error(t.loadError)
    } finally {
      setLoadingList(false)
    }
  }

  function startNewChallenge() {
    setSelectedChallengeId("")
    setStatus("draft")
    setPrize("")
    setSponsorId("")
    setFormData(createEmptySponsorChallengeData())
  }

  useEffect(() => {
    if (categoryId) {
      void loadChallengeCollection()
      return
    }
    if (!initialChallenge) {
      setStatus("draft")
      setSponsorId("")
      setFormData(createEmptySponsorChallengeData())
      return
    }
    applyRecord(initialChallenge)
  }, [initialChallenge, categoryId])

  // Sponsor list for the "visible on website" selector; sourced from the public sponsor list.
  useEffect(() => {
    let cancelled = false
    fetch("/api/sponsors", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        const list = (data.data?.sponsors || []) as Array<{
          id: string
          company_name: string
          status: string
        }>
        setSponsors(
          list
            .filter((s) => s.status === "confirmed" || s.status === "published")
            .map((s) => ({ id: s.id, company_name: s.company_name }))
        )
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const isPublished = status === "published"

  const categorySpecificFields = useMemo(() => {
    switch (categorySlug) {
      case "young-talents":
        return (
          <div className="space-y-4">
            <Field label={t.targetAudience} hint={t.targetAudienceHint}>
              <Input
                value={formData.categorySpecific.youngTalentsTargetAudience}
                onChange={(e) => patchSpecific({ youngTalentsTargetAudience: e.target.value })}
                placeholder="e.g. 1st–3rd year apprentices, field of study"
              />
            </Field>
            <Field label={t.prerequisiteKnowledge}>
              <Textarea
                value={formData.categorySpecific.youngTalentsPrerequisiteKnowledge}
                onChange={(e) => patchSpecific({ youngTalentsPrerequisiteKnowledge: e.target.value })}
                placeholder="e.g. Basic Python knowledge"
                rows={3}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <CheckboxRow
                id="youngTalentsMentorOnSite"
                label={t.mentorOnSite}
                checked={formData.categorySpecific.youngTalentsMentorOnSite}
                onCheckedChange={(v) => patchSpecific({ youngTalentsMentorOnSite: v })}
              />
              <CheckboxRow
                id="youngTalentsProgressEvaluated"
                label={t.progressEvaluated}
                checked={formData.categorySpecific.youngTalentsProgressEvaluated}
                onCheckedChange={(v) => patchSpecific({ youngTalentsProgressEvaluated: v })}
              />
            </div>
            <Field label={t.learningGoals}>
              <Textarea
                value={formData.categorySpecific.youngTalentsLearningGoals}
                onChange={(e) => patchSpecific({ youngTalentsLearningGoals: e.target.value })}
                rows={3}
              />
            </Field>
            <Field label={t.entryHelp} hint={t.entryHelpHint}>
              <Textarea
                value={formData.categorySpecific.youngTalentsEntryHelp}
                onChange={(e) => patchSpecific({ youngTalentsEntryHelp: e.target.value })}
                placeholder="e.g. starter code, tutorial link"
                rows={3}
              />
            </Field>
          </div>
        )
      case "ai-agentic":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.expectedTechnology}>
                <Input
                  value={formData.categorySpecific.aiExpectedTechnology}
                  onChange={(e) => patchSpecific({ aiExpectedTechnology: e.target.value })}
                  placeholder="LLM, ML model, Computer Vision, Open"
                />
              </Field>
              <Field label={t.ownModelsAllowed}>
                <Select
                  value={String(formData.categorySpecific.aiOwnModelsAllowed)}
                  onValueChange={(v) => patchSpecific({ aiOwnModelsAllowed: v === "true" })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.choose} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t.yes}</SelectItem>
                    <SelectItem value="false">{t.no}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t.apiKeysProvided}>
                <Input
                  value={formData.categorySpecific.aiApiKeysProvided}
                  onChange={(e) => patchSpecific({ aiApiKeysProvided: e.target.value })}
                  placeholder="Yes – which ones / No"
                />
              </Field>
              <Field label={t.evaluationMetric}>
                <Input
                  value={formData.categorySpecific.aiEvaluationMetric}
                  onChange={(e) => patchSpecific({ aiEvaluationMetric: e.target.value })}
                />
              </Field>
            </div>
            <Field label={t.privacyRequirements}>
              <Textarea
                value={formData.categorySpecific.aiPrivacyRequirements}
                onChange={(e) => patchSpecific({ aiPrivacyRequirements: e.target.value })}
                rows={3}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <CheckboxRow
                id="aiOutputQualityEvaluated"
                label={t.outputQualityEvaluated}
                checked={formData.categorySpecific.aiOutputQualityEvaluated}
                onCheckedChange={(v) => patchSpecific({ aiOutputQualityEvaluated: v })}
              />
            </div>
            <Field label={t.evaluationMethod}>
              <Textarea
                value={formData.categorySpecific.aiOutputQualityMethod}
                onChange={(e) => patchSpecific({ aiOutputQualityMethod: e.target.value })}
                rows={3}
              />
            </Field>
          </div>
        )
      case "campus-challenge":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.challengeType}>
                <Input
                  value={formData.categorySpecific.campusChallengeType}
                  onChange={(e) => patchSpecific({ campusChallengeType: e.target.value })}
                  placeholder="CTF, Red Team, Blue Team, Pentest, Mixed"
                />
              </Field>
              <Field label={t.flagFormat}>
                <Input
                  value={formData.categorySpecific.campusFlagFormat}
                  onChange={(e) => patchSpecific({ campusFlagFormat: e.target.value })}
                  placeholder="FLAG{...}"
                />
              </Field>
              <Field label={t.numberOfFlags}>
                <Input
                  value={formData.categorySpecific.campusNumberOfFlags}
                  onChange={(e) => patchSpecific({ campusNumberOfFlags: e.target.value })}
                />
              </Field>
              <Field label={t.infrastructureProvidedBy}>
                <Input
                  value={formData.categorySpecific.campusInfrastructureProvidedBy}
                  onChange={(e) => patchSpecific({ campusInfrastructureProvidedBy: e.target.value })}
                  placeholder="Company, HSLU, Together"
                />
              </Field>
            </div>
            <Field label={t.scopeOfAttack}>
              <Textarea
                value={formData.categorySpecific.campusScopeOfAttack}
                onChange={(e) => patchSpecific({ campusScopeOfAttack: e.target.value })}
                rows={3}
              />
            </Field>
            <Field label={t.campusOutOfScope}>
              <Textarea
                value={formData.categorySpecific.campusOutOfScope}
                onChange={(e) => patchSpecific({ campusOutOfScope: e.target.value })}
                rows={3}
              />
            </Field>
          </div>
        )
      default:
        return (
          <div className="space-y-4">
            <Field label={t.regionalConnection}>
              <Textarea
                value={formData.categorySpecific.regionalConnection}
                onChange={(e) => patchSpecific({ regionalConnection: e.target.value })}
                placeholder="What connects the challenge to the region?"
                rows={3}
              />
            </Field>
            <CheckboxRow
              id="regionalLocalDataAvailable"
              label={t.localDataAvailable}
              checked={formData.categorySpecific.regionalLocalDataAvailable}
              onCheckedChange={(v) => patchSpecific({ regionalLocalDataAvailable: v })}
            />
            <Field label={t.localStakeholders}>
              <Textarea
                value={formData.categorySpecific.regionalLocalStakeholders}
                onChange={(e) => patchSpecific({ regionalLocalStakeholders: e.target.value })}
                placeholder="Municipalities, clubs, SMEs, etc."
                rows={3}
              />
            </Field>
            <Field label={t.reuseAfterEvent}>
              <Textarea
                value={formData.categorySpecific.regionalReuseAfterEvent}
                onChange={(e) => patchSpecific({ regionalReuseAfterEvent: e.target.value })}
                rows={3}
              />
            </Field>
          </div>
        )
    }
  }, [categorySlug, formData.categorySpecific, language])

  const saveChallenge = async (nextStatus: "draft" | "published") => {
    setSaving(nextStatus)
    try {
      const res = await fetch("/api/sponsor/challenge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: nextStatus,
          challengeId: selectedChallengeId || undefined,
          categoryId,
          challengeData: formData,
          prize: prize.trim() || null,
          sponsorId: sponsorId || null
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || err.message || t.saveError)
      }
      const json = await res.json()
      const challenge = json.data?.challenge as SponsorChallengeRecord
      setStatus(challenge.status)
      setPrize(challenge.prize || "")
      setSponsorId(challenge.sponsor_id || "")
      setSelectedChallengeId(challenge.id)
      setFormData(normalizeSponsorChallengeData(challenge.challenge_data))
      if (categoryId) {
        setChallengeList((prev) => {
          const rest = prev.filter((c) => c.id !== challenge.id)
          return [
            {
              id: challenge.id,
              challenge_title: challenge.challenge_title,
              challenge_title_en: challenge.challenge_title_en,
              status: challenge.status,
              updated_at: challenge.updated_at,
              category_id: challenge.category_id
            },
            ...rest
          ]
        })
      }
      toast.success(nextStatus === "published" ? t.publishSuccess : t.saveSuccess)
      onSaved?.(challenge)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.saveError)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* ── Status / Actions ── */}
      <Card className="border-border">
        <CardHeader className="space-y-4 pb-4">
          {categoryId && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t.existingChallenges}
                </Label>
                <Select
                  value={selectedChallengeId}
                  onValueChange={(v) => {
                    setSelectedChallengeId(v)
                    void loadChallengeCollection(v)
                  }}>
                  <SelectTrigger disabled={loadingList}>
                    <SelectValue placeholder={loadingList ? t.loading : t.selectChallenge} />
                  </SelectTrigger>
                  <SelectContent>
                    {challengeList.map((c, i) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.challenge_title || c.challenge_title_en || `Challenge ${i + 1}`}
                        {c.status === "published" && (
                          <span className="ml-2 text-xs text-green-600">● {t.publishedLabel}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="outline" onClick={startNewChallenge} className="shrink-0">
                {t.newChallenge}
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-muted-foreground text-sm">{categoryName}</p>
                <Badge
                  variant={isPublished ? "default" : "outline"}
                  className={isPublished ? "bg-green-600 text-white" : ""}>
                  {isPublished ? t.publishedLabel : t.draftLabel}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => saveChallenge("draft")}
                disabled={saving !== null}
                className="flex-1 gap-2 sm:flex-none">
                {saving === "draft" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t.saveDraft}
              </Button>
              {canPublish && (
                <Button
                  onClick={() => saveChallenge("published")}
                  disabled={saving !== null}
                  className="flex-1 gap-2 bg-[#530A5D] hover:bg-[#530A5D]/90 sm:flex-none">
                  {saving === "published" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {t.publish}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── Website-visible section ── */}
      <Card className="border-[#530A5D]/40 bg-gradient-to-br from-[#530A5D]/5 to-[#530A5D]/10 shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-xl text-[#530A5D]">
            <Eye className="h-5 w-5" />
            {t.websiteVisible}
          </CardTitle>
          <p className="text-muted-foreground text-sm">{t.websiteVisibleDesc}</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.challengeTitleDe} required>
              <Input
                value={formData.challengeTitle}
                onChange={(e) => patch({ challengeTitle: e.target.value })}
                placeholder="Kurzer, prägnanter Titel auf Deutsch"
              />
            </Field>
            <Field label={t.challengeTitleEn}>
              <Input
                value={formData.challengeTitleEn}
                onChange={(e) => patch({ challengeTitleEn: e.target.value })}
                placeholder="Short, punchy title in English"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.shortDescriptionDe} required hint={t.shortDescriptionHint}>
              <Textarea
                value={formData.shortDescription}
                onChange={(e) => patch({ shortDescription: e.target.value })}
                placeholder="2–3 Sätze auf Deutsch, die als Teaser auf der Website angezeigt werden"
                rows={3}
              />
            </Field>
            <Field label={t.shortDescriptionEn} hint={t.shortDescriptionHint}>
              <Textarea
                value={formData.shortDescriptionEn}
                onChange={(e) => patch({ shortDescriptionEn: e.target.value })}
                placeholder="2–3 sentences in English shown as a teaser on the website"
                rows={3}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.prize} hint={t.prizeHint}>
              <div className="relative">
                <Trophy className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                <Input
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  placeholder="e.g. CHF 1,000 voucher, iPad, internship offer"
                  className="pl-9"
                />
              </div>
            </Field>
            <Field label={t.sponsor} hint={t.sponsorHint}>
              <Select
                value={sponsorId || NO_SPONSOR}
                onValueChange={(v) => setSponsorId(v === NO_SPONSOR ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.choose} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SPONSOR}>{t.noSponsor}</SelectItem>
                  {sponsors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ── Challenge-Format ── */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeading>{t.challengeFormat}</SectionHeading>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={t.difficulty}>
              <Select
                value={formData.difficulty}
                onValueChange={(v) => patch({ difficulty: v as SponsorChallengeData["difficulty"] })}>
                <SelectTrigger>
                  <SelectValue placeholder={t.choose} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Einsteiger">{t.beginner}</SelectItem>
                  <SelectItem value="Fortgeschritten">{t.intermediate}</SelectItem>
                  <SelectItem value="Expert">{t.expert}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t.teamSize}>
              <Input
                value={formData.teamSize}
                onChange={(e) => patch({ teamSize: e.target.value })}
                placeholder="e.g. 2–4 people"
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabbed detail form ── */}
      <Tabs defaultValue="content">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content" className="gap-1.5">
            <FileText className="h-4 w-4 shrink-0" />
            <span>{t.tabContent}</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-1.5">
            <Package className="h-4 w-4 shrink-0" />
            <span>{t.tabResources}</span>
          </TabsTrigger>
          <TabsTrigger value="legal" className="gap-1.5">
            <Gavel className="h-4 w-4 shrink-0" />
            <span>{t.tabClosing}</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Content ── */}
        <TabsContent value="content" className="mt-4 space-y-6">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <SectionHeading>{t.problemContext}</SectionHeading>
              <Field label={t.background} hint={t.backgroundHint}>
                <Textarea
                  value={formData.background}
                  onChange={(e) => patch({ background: e.target.value })}
                  rows={4}
                  placeholder="What is your company / department working on?"
                />
              </Field>
              <Field label={t.problem} hint={t.problemHint}>
                <Textarea
                  value={formData.problemStatement}
                  onChange={(e) => patch({ problemStatement: e.target.value })}
                  rows={4}
                  placeholder="What is the concrete challenge?"
                />
              </Field>
              <Field label={t.goal} hint={t.goalHint}>
                <Textarea
                  value={formData.goal}
                  onChange={(e) => patch({ goal: e.target.value })}
                  rows={3}
                  placeholder="What should be achieved by the end of the challenge?"
                />
              </Field>

              <SectionHeading>{t.requirements}</SectionHeading>
              <Field label={t.mustRequirements} hint={t.mustRequirementsHint}>
                <Textarea
                  value={formData.mustRequirements}
                  onChange={(e) => patch({ mustRequirements: e.target.value })}
                  rows={4}
                  placeholder="One requirement per line"
                />
              </Field>
              <Field label={t.canRequirements} hint={t.canRequirementsHint}>
                <Textarea
                  value={formData.canRequirements}
                  onChange={(e) => patch({ canRequirements: e.target.value })}
                  rows={3}
                  placeholder="Bonus requirements"
                />
              </Field>
              <Field label={t.outOfScope} hint={t.outOfScopeHint}>
                <Textarea
                  value={formData.outOfScope}
                  onChange={(e) => patch({ outOfScope: e.target.value })}
                  rows={3}
                />
              </Field>

              <SectionHeading>{t.technical}</SectionHeading>
              <Field label={t.allowedTechnologies}>
                <Textarea
                  value={formData.allowedTechnologies}
                  onChange={(e) => patch({ allowedTechnologies: e.target.value })}
                  rows={3}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.restrictions}>
                  <Textarea
                    value={formData.restrictions}
                    onChange={(e) => patch({ restrictions: e.target.value })}
                    rows={3}
                  />
                </Field>
                <Field label={t.infrastructure}>
                  <Textarea
                    value={formData.infrastructure}
                    onChange={(e) => patch({ infrastructure: e.target.value })}
                    rows={3}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Resources ── */}
        <TabsContent value="resources" className="mt-4 space-y-6">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <SectionHeading>{t.providedResources}</SectionHeading>
              <div className="grid gap-3 sm:grid-cols-2">
                <CheckboxRow
                  id="datasets"
                  label={t.datasets}
                  checked={formData.resources.datasets}
                  onCheckedChange={(v) => patchResources({ datasets: v })}
                />
                <CheckboxRow
                  id="apis"
                  label={t.apis}
                  checked={formData.resources.apis}
                  onCheckedChange={(v) => patchResources({ apis: v })}
                />
                <CheckboxRow
                  id="documentation"
                  label={t.documentation}
                  checked={formData.resources.documentation}
                  onCheckedChange={(v) => patchResources({ documentation: v })}
                />
                <CheckboxRow
                  id="credentials"
                  label={t.credentials}
                  checked={formData.resources.credentials}
                  onCheckedChange={(v) => patchResources({ credentials: v })}
                />
                <CheckboxRow
                  id="sdk"
                  label={t.sdk}
                  checked={formData.resources.sdk}
                  onCheckedChange={(v) => patchResources({ sdk: v })}
                />
                <CheckboxRow
                  id="hardware"
                  label={t.hardware}
                  checked={formData.resources.hardware}
                  onCheckedChange={(v) => patchResources({ hardware: v })}
                />
                <CheckboxRow
                  id="aiModels"
                  label={t.aiModels}
                  checked={formData.resources.aiModels}
                  onCheckedChange={(v) => patchResources({ aiModels: v })}
                />
                <CheckboxRow
                  id="mentoringSupport"
                  label={t.mentoringSupport}
                  checked={formData.resources.mentoringSupport}
                  onCheckedChange={(v) => patchResources({ mentoringSupport: v })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.resourceDetails}>
                  <Textarea
                    value={formData.resources.details}
                    onChange={(e) => patchResources({ details: e.target.value })}
                    rows={3}
                  />
                </Field>
                <Field label={t.resourceTimes} hint={t.resourceTimesHint}>
                  <Input
                    value={formData.resources.times}
                    onChange={(e) => patchResources({ times: e.target.value })}
                    placeholder="e.g. at least 1 week before the event"
                  />
                </Field>
              </div>

              <SectionHeading>{t.deliverables}</SectionHeading>
              <div className="grid gap-3 sm:grid-cols-2">
                <CheckboxRow
                  id="prototype"
                  label={t.prototype}
                  checked={formData.deliverables.prototype}
                  onCheckedChange={(v) => patchDeliverables({ prototype: v })}
                />
                <CheckboxRow
                  id="pitch"
                  label={t.pitch}
                  checked={formData.deliverables.pitch}
                  onCheckedChange={(v) => patchDeliverables({ pitch: v })}
                />
                <CheckboxRow
                  id="codeRepository"
                  label={t.codeRepository}
                  checked={formData.deliverables.codeRepository}
                  onCheckedChange={(v) => patchDeliverables({ codeRepository: v })}
                />
                <CheckboxRow
                  id="readme"
                  label={t.readme}
                  checked={formData.deliverables.readme}
                  onCheckedChange={(v) => patchDeliverables({ readme: v })}
                />
                <CheckboxRow
                  id="video"
                  label={t.video}
                  checked={formData.deliverables.video}
                  onCheckedChange={(v) => patchDeliverables({ video: v })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.pitchFormat}>
                  <Input
                    value={formData.deliverables.pitchFormat}
                    onChange={(e) => patchDeliverables({ pitchFormat: e.target.value })}
                    placeholder="e.g. 5 slides / 3 min."
                  />
                </Field>
                <Field label={t.videoLength}>
                  <Input
                    value={formData.deliverables.videoLength}
                    onChange={(e) => patchDeliverables({ videoLength: e.target.value })}
                    placeholder="e.g. 2 minutes"
                  />
                </Field>
                <Field label={t.otherDeliverables} hint={t.otherDeliverablesHint}>
                  <Textarea
                    value={formData.deliverables.other}
                    onChange={(e) => patchDeliverables({ other: e.target.value })}
                    rows={2}
                  />
                </Field>
              </div>

              <SectionHeading>{t.evaluationCriteria}</SectionHeading>
              <EvaluationTable
                criteria={formData.evaluation.criteria}
                onChange={(criteria) => patchEvaluation({ criteria })}
                labels={{
                  criterion: t.criterion,
                  weight: t.weight,
                  description: t.evalDescription,
                  addCriterion: t.addCriterion,
                  total: t.total,
                  mustBe100: t.mustBe100,
                  noCriteria: t.noCriteria
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Closing ── */}
        <TabsContent value="legal" className="mt-4 space-y-6">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <SectionHeading>{t.prizes}</SectionHeading>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.firstPlace}>
                  <Textarea
                    value={formData.prizes.first}
                    onChange={(e) => patchPrizes({ first: e.target.value })}
                    rows={2}
                  />
                </Field>
                <Field label={t.secondPlace}>
                  <Textarea
                    value={formData.prizes.second}
                    onChange={(e) => patchPrizes({ second: e.target.value })}
                    rows={2}
                  />
                </Field>
                <Field label={t.thirdPlace}>
                  <Textarea
                    value={formData.prizes.third}
                    onChange={(e) => patchPrizes({ third: e.target.value })}
                    rows={2}
                  />
                </Field>
                <Field label={t.specialPrize}>
                  <Textarea
                    value={formData.prizes.special}
                    onChange={(e) => patchPrizes({ special: e.target.value })}
                    rows={2}
                  />
                </Field>
              </div>

              <SectionHeading>{t.legal}</SectionHeading>
              <div className="grid gap-3 sm:grid-cols-2">
                <CheckboxRow
                  id="dataAnonymous"
                  label={t.dataAnonymous}
                  checked={formData.legal.dataAnonymous}
                  onCheckedChange={(v) => patchLegal({ dataAnonymous: v })}
                />
                <CheckboxRow
                  id="noRestrictions"
                  label={t.noRestrictions}
                  checked={formData.legal.noRestrictions}
                  onCheckedChange={(v) => patchLegal({ noRestrictions: v })}
                />
                <CheckboxRow
                  id="portfolioAllowed"
                  label={t.portfolioAllowed}
                  checked={formData.legal.portfolioAllowed}
                  onCheckedChange={(v) => patchLegal({ portfolioAllowed: v })}
                />
                <CheckboxRow
                  id="noSpecialIpRules"
                  label={t.noSpecialIpRules}
                  checked={formData.legal.noSpecialIpRules}
                  onCheckedChange={(v) => patchLegal({ noSpecialIpRules: v })}
                />
              </div>
              <Field label={t.specialIpRules}>
                <Textarea
                  value={formData.legal.specialIpRules}
                  onChange={(e) => patchLegal({ specialIpRules: e.target.value })}
                  rows={3}
                  placeholder={t.specialIpRulesPlaceholder}
                />
              </Field>

              <SectionHeading>{t.categorySpecific}</SectionHeading>
              {categorySpecificFields}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
