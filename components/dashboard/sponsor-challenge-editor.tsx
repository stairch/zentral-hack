"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, Send } from "lucide-react"
import { toast } from "sonner"
import {
  createEmptySponsorChallengeData,
  normalizeSponsorChallengeData,
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
  status: "draft" | "published"
  updated_at: string
  category_id: string
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">{children}</CardContent>
    </Card>
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
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
      <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        {hint ? <p className="text-muted-foreground text-sm">{hint}</p> : null}
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
  const [formData, setFormData] = useState<SponsorChallengeData>(() => createEmptySponsorChallengeData())
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [saving, setSaving] = useState(false)
  const [challengeList, setChallengeList] = useState<ChallengeListItem[]>([])
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("")
  const [loadingList, setLoadingList] = useState(false)

  async function loadChallengeCollection(challengeId?: string) {
    if (!categoryId) return

    setLoadingList(true)
    try {
      const query = new URLSearchParams({ categoryId })
      if (challengeId) {
        query.set("challengeId", challengeId)
      }

      const response = await fetch(`/api/sponsor/challenge?${query.toString()}`, {
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Fehler beim Laden der Challenges")
      }

      const json = await response.json()
      const list = (json.data?.challenges || []) as ChallengeListItem[]
      const selected = (json.data?.challenge || null) as SponsorChallengeRecord | null

      setChallengeList(list)
      setSelectedChallengeId(selected?.id || list[0]?.id || "")

      if (selected) {
        setStatus(selected.status)
        const normalized = normalizeSponsorChallengeData(selected.challenge_data)
        setFormData({
          ...normalized,
          companyName: selected.company_name || normalized.companyName,
          branch: selected.branch || normalized.branch,
          contactName: selected.contact_name || normalized.contactName,
          contactFunction: selected.contact_function || normalized.contactFunction,
          contactEmail: selected.contact_email || normalized.contactEmail,
          contactPhone: selected.contact_phone || normalized.contactPhone,
          website: selected.website || normalized.website,
          logoNote: selected.logo_note || normalized.logoNote,
          challengeTitle: selected.challenge_title || normalized.challengeTitle,
          shortDescription: selected.short_description || normalized.shortDescription,
          difficulty: (selected.difficulty as SponsorChallengeData["difficulty"]) || normalized.difficulty,
          teamSize: selected.team_size || normalized.teamSize,
          challengeLanguage:
            (selected.challenge_language as SponsorChallengeData["challengeLanguage"]) ||
            normalized.challengeLanguage
        })
      } else {
        setStatus("draft")
        setFormData(createEmptySponsorChallengeData())
      }
    } catch (error) {
      console.error("Failed to load challenge collection:", error)
    } finally {
      setLoadingList(false)
    }
  }

  function startNewChallenge() {
    setSelectedChallengeId("")
    setStatus("draft")
    setFormData(createEmptySponsorChallengeData())
  }

  useEffect(() => {
    if (categoryId) {
      void loadChallengeCollection()
      return
    }

    if (!initialChallenge) {
      setStatus("draft")
      setFormData(createEmptySponsorChallengeData())
      return
    }

    setStatus(initialChallenge.status)
    const normalized = normalizeSponsorChallengeData(initialChallenge.challenge_data)

    setFormData({
      ...normalized,
      companyName: initialChallenge.company_name || normalized.companyName,
      branch: initialChallenge.branch || normalized.branch,
      contactName: initialChallenge.contact_name || normalized.contactName,
      contactFunction: initialChallenge.contact_function || normalized.contactFunction,
      contactEmail: initialChallenge.contact_email || normalized.contactEmail,
      contactPhone: initialChallenge.contact_phone || normalized.contactPhone,
      website: initialChallenge.website || normalized.website,
      logoNote: initialChallenge.logo_note || normalized.logoNote,
      challengeTitle: initialChallenge.challenge_title || normalized.challengeTitle,
      shortDescription: initialChallenge.short_description || normalized.shortDescription,
      difficulty:
        (initialChallenge.difficulty as SponsorChallengeData["difficulty"]) || normalized.difficulty,
      teamSize: initialChallenge.team_size || normalized.teamSize,
      challengeLanguage:
        (initialChallenge.challenge_language as SponsorChallengeData["challengeLanguage"]) ||
        normalized.challengeLanguage
    })
  }, [initialChallenge, categoryId])

  const isPublished = status === "published"

  const categorySpecificFields = useMemo(() => {
    switch (categorySlug) {
      case "young-talents":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="youngTalentsTargetAudience">Zielpublikum</Label>
                <Input
                  id="youngTalentsTargetAudience"
                  value={formData.categorySpecific.youngTalentsTargetAudience}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySpecific: {
                        ...prev.categorySpecific,
                        youngTalentsTargetAudience: e.target.value
                      }
                    }))
                  }
                  placeholder="z.B. 1. bis 3. Lehrjahr, Fachrichtung"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="youngTalentsPrerequisiteKnowledge">Vorausgesetztes Wissen</Label>
                <Textarea
                  id="youngTalentsPrerequisiteKnowledge"
                  value={formData.categorySpecific.youngTalentsPrerequisiteKnowledge}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySpecific: {
                        ...prev.categorySpecific,
                        youngTalentsPrerequisiteKnowledge: e.target.value
                      }
                    }))
                  }
                  placeholder="z.B. Grundkenntnisse in Python"
                />
              </div>
              <CheckboxRow
                id="youngTalentsMentorOnSite"
                label="Mentor vor Ort anwesend?"
                checked={formData.categorySpecific.youngTalentsMentorOnSite}
                onCheckedChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    categorySpecific: { ...prev.categorySpecific, youngTalentsMentorOnSite: value }
                  }))
                }
              />
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="youngTalentsLearningGoals">Lernziele definiert?</Label>
                <Textarea
                  id="youngTalentsLearningGoals"
                  value={formData.categorySpecific.youngTalentsLearningGoals}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySpecific: {
                        ...prev.categorySpecific,
                        youngTalentsLearningGoals: e.target.value
                      }
                    }))
                  }
                />
              </div>
              <CheckboxRow
                id="youngTalentsProgressEvaluated"
                label="Lernfortschritt wird bewertet?"
                checked={formData.categorySpecific.youngTalentsProgressEvaluated}
                onCheckedChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    categorySpecific: { ...prev.categorySpecific, youngTalentsProgressEvaluated: value }
                  }))
                }
              />
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="youngTalentsEntryHelp">Einstiegshilfen vorhanden?</Label>
                <Textarea
                  id="youngTalentsEntryHelp"
                  value={formData.categorySpecific.youngTalentsEntryHelp}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySpecific: { ...prev.categorySpecific, youngTalentsEntryHelp: e.target.value }
                    }))
                  }
                  placeholder="z.B. Starter-Code, Tutorial"
                />
              </div>
            </div>
          </div>
        )
      case "ai-agentic":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="aiExpectedTechnology">Erwartete KI-Technologie</Label>
                <Input
                  id="aiExpectedTechnology"
                  value={formData.categorySpecific.aiExpectedTechnology}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySpecific: { ...prev.categorySpecific, aiExpectedTechnology: e.target.value }
                    }))
                  }
                  placeholder="LLM, ML-Modell, Computer Vision, Offen"
                />
              </div>
              <div className="space-y-2">
                <Label>Eigene Modelle erlaubt?</Label>
                <Select
                  value={String(formData.categorySpecific.aiOwnModelsAllowed)}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySpecific: { ...prev.categorySpecific, aiOwnModelsAllowed: value === "true" }
                    }))
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ja</SelectItem>
                    <SelectItem value="false">Nein</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aiApiKeysProvided">API-Keys werden bereitgestellt?</Label>
                <Input
                  id="aiApiKeysProvided"
                  value={formData.categorySpecific.aiApiKeysProvided}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySpecific: { ...prev.categorySpecific, aiApiKeysProvided: e.target.value }
                    }))
                  }
                  placeholder="Ja - welche / Nein"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="aiPrivacyRequirements">Datenschutzanforderungen</Label>
                <Textarea
                  id="aiPrivacyRequirements"
                  value={formData.categorySpecific.aiPrivacyRequirements}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySpecific: { ...prev.categorySpecific, aiPrivacyRequirements: e.target.value }
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aiEvaluationMetric">Evaluation-Metrik</Label>
                <Input
                  id="aiEvaluationMetric"
                  value={formData.categorySpecific.aiEvaluationMetric}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySpecific: { ...prev.categorySpecific, aiEvaluationMetric: e.target.value }
                    }))
                  }
                />
              </div>
              <CheckboxRow
                id="aiOutputQualityEvaluated"
                label="Wird Output-Qualität bewertet?"
                checked={formData.categorySpecific.aiOutputQualityEvaluated}
                onCheckedChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    categorySpecific: { ...prev.categorySpecific, aiOutputQualityEvaluated: value }
                  }))
                }
              />
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="aiOutputQualityMethod">Methode</Label>
                <Textarea
                  id="aiOutputQualityMethod"
                  value={formData.categorySpecific.aiOutputQualityMethod}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySpecific: { ...prev.categorySpecific, aiOutputQualityMethod: e.target.value }
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )
      case "campus-challenge":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="campusChallengeType">Art der Challenge</Label>
                <Input
                  id="campusChallengeType"
                  value={formData.categorySpecific.campusChallengeType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySpecific: { ...prev.categorySpecific, campusChallengeType: e.target.value }
                    }))
                  }
                  placeholder="CTF, Red Team, Blue Team, Pentest, Mixed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campusFlagFormat">Flag-Format</Label>
                <Input
                  id="campusFlagFormat"
                  value={formData.categorySpecific.campusFlagFormat}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySpecific: { ...prev.categorySpecific, campusFlagFormat: e.target.value }
                    }))
                  }
                  placeholder="FLAG{...}"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campusNumberOfFlags">Anzahl Flags / Levels</Label>
                <Input
                  id="campusNumberOfFlags"
                  value={formData.categorySpecific.campusNumberOfFlags}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySpecific: { ...prev.categorySpecific, campusNumberOfFlags: e.target.value }
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campusInfrastructureProvidedBy">Infrastruktur bereitgestellt durch</Label>
                <Input
                  id="campusInfrastructureProvidedBy"
                  value={formData.categorySpecific.campusInfrastructureProvidedBy}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySpecific: {
                        ...prev.categorySpecific,
                        campusInfrastructureProvidedBy: e.target.value
                      }
                    }))
                  }
                  placeholder="Unternehmen, HSLU, Gemeinsam"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="campusScopeOfAttack">Scope of Attack</Label>
                <Textarea
                  id="campusScopeOfAttack"
                  value={formData.categorySpecific.campusScopeOfAttack}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySpecific: { ...prev.categorySpecific, campusScopeOfAttack: e.target.value }
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="campusOutOfScope">Out of Scope</Label>
                <Textarea
                  id="campusOutOfScope"
                  value={formData.categorySpecific.campusOutOfScope}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySpecific: { ...prev.categorySpecific, campusOutOfScope: e.target.value }
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="regionalConnection">Regionaler Bezug</Label>
              <Textarea
                id="regionalConnection"
                value={formData.categorySpecific.regionalConnection}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    categorySpecific: { ...prev.categorySpecific, regionalConnection: e.target.value }
                  }))
                }
                placeholder="Was verbindet die Challenge mit der Region?"
              />
            </div>
            <CheckboxRow
              id="regionalLocalDataAvailable"
              label="Lokale Daten verfügbar?"
              checked={formData.categorySpecific.regionalLocalDataAvailable}
              onCheckedChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  categorySpecific: { ...prev.categorySpecific, regionalLocalDataAvailable: value }
                }))
              }
            />
            <div className="space-y-2">
              <Label htmlFor="regionalLocalStakeholders">Lokale Stakeholder</Label>
              <Textarea
                id="regionalLocalStakeholders"
                value={formData.categorySpecific.regionalLocalStakeholders}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    categorySpecific: { ...prev.categorySpecific, regionalLocalStakeholders: e.target.value }
                  }))
                }
                placeholder="Gemeinden, Vereine, KMU, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regionalReuseAfterEvent">Weiternutzung nach Event</Label>
              <Textarea
                id="regionalReuseAfterEvent"
                value={formData.categorySpecific.regionalReuseAfterEvent}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    categorySpecific: { ...prev.categorySpecific, regionalReuseAfterEvent: e.target.value }
                  }))
                }
              />
            </div>
          </div>
        )
    }
  }, [categorySlug, formData])

  const saveChallenge = async (nextStatus: "draft" | "published") => {
    setSaving(true)
    try {
      const response = await fetch("/api/sponsor/challenge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: nextStatus,
          challengeId: selectedChallengeId || undefined,
          categoryId,
          challengeData: formData
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || "Fehler beim Speichern")
      }

      const json = await response.json()
      const challenge = json.data?.challenge as SponsorChallengeRecord
      setStatus(challenge.status)
      setSelectedChallengeId(challenge.id)
      setFormData(normalizeSponsorChallengeData(challenge.challenge_data))

      if (categoryId) {
        const nextList = (challengeList || []).filter((item) => item.id !== challenge.id)
        setChallengeList([
          {
            id: challenge.id,
            challenge_title: challenge.challenge_title,
            status: challenge.status,
            updated_at: challenge.updated_at,
            category_id: challenge.category_id
          },
          ...nextList
        ])
      }

      toast.success(nextStatus === "published" ? "Challenge veröffentlicht" : "Entwurf gespeichert")
      onSaved?.(challenge)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Card className="border-[#530A5D]/20 bg-[#530A5D]/5">
        <CardHeader className="space-y-3">
          {categoryId ? (
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="challenge-select">Vorhandene Challenges</Label>
                <Select
                  value={selectedChallengeId}
                  onValueChange={(value) => {
                    setSelectedChallengeId(value)
                    void loadChallengeCollection(value)
                  }}>
                  <SelectTrigger id="challenge-select" disabled={loadingList}>
                    <SelectValue placeholder={loadingList ? "Lade Challenges..." : "Challenge auswählen"} />
                  </SelectTrigger>
                  <SelectContent>
                    {challengeList.map((challenge, index) => (
                      <SelectItem key={challenge.id} value={challenge.id}>
                        {challenge.challenge_title || `Challenge ${index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="outline" onClick={startNewChallenge}>
                Neue Challenge
              </Button>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                Deine Challenge
                <Badge
                  variant={isPublished ? "default" : "outline"}
                  className={isPublished ? "bg-green-600" : ""}>
                  {isPublished ? "Veröffentlicht" : "Entwurf"}
                </Badge>
              </CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">{categoryName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => saveChallenge("draft")}
                disabled={saving}
                className="gap-2">
                {saving && status === "draft" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Entwurf speichern
              </Button>
              <Button
                onClick={() => saveChallenge("published")}
                disabled={saving}
                className="gap-2 bg-[#530A5D] hover:bg-[#530A5D]/90">
                {saving && status === "published" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Veröffentlichen
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <SectionCard title="Unternehmen & Kontakt">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Unternehmensname</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch">Branche</Label>
            <Input
              id="branch"
              value={formData.branch}
              onChange={(e) => setFormData((prev) => ({ ...prev, branch: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactName">Ansprechperson</Label>
            <Input
              id="contactName"
              value={formData.contactName}
              onChange={(e) => setFormData((prev) => ({ ...prev, contactName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactFunction">Funktion</Label>
            <Input
              id="contactFunction"
              value={formData.contactFunction}
              onChange={(e) => setFormData((prev) => ({ ...prev, contactFunction: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">E-Mail</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Telefon</Label>
            <Input
              id="contactPhone"
              value={formData.contactPhone}
              onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoNote">Logo</Label>
            <Input
              id="logoNote"
              value={formData.logoNote}
              onChange={(e) => setFormData((prev) => ({ ...prev, logoNote: e.target.value }))}
              placeholder="PNG oder SVG separat beilegen"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Challenge-Übersicht">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="challengeTitle">Challenge-Titel</Label>
            <Input
              id="challengeTitle"
              value={formData.challengeTitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, challengeTitle: e.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="shortDescription">Kurzbeschreibung</Label>
            <Textarea
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
              placeholder="Max. 2-3 Sätze für die Website"
            />
          </div>
          <div className="space-y-2">
            <Label>Schwierigkeitsgrad</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, difficulty: value as SponsorChallengeData["difficulty"] }))
              }>
              <SelectTrigger>
                <SelectValue placeholder="Wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Einsteiger">Einsteiger</SelectItem>
                <SelectItem value="Fortgeschritten">Fortgeschritten</SelectItem>
                <SelectItem value="Expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamSize">Empfohlene Teamgrösse</Label>
            <Input
              id="teamSize"
              value={formData.teamSize}
              onChange={(e) => setFormData((prev) => ({ ...prev, teamSize: e.target.value }))}
              placeholder="z.B. 2-4 Personen"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Sprache der Challenge</Label>
            <Select
              value={formData.challengeLanguage}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  challengeLanguage: value as SponsorChallengeData["challengeLanguage"]
                }))
              }>
              <SelectTrigger>
                <SelectValue placeholder="Wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Deutsch">Deutsch</SelectItem>
                <SelectItem value="Englisch">Englisch</SelectItem>
                <SelectItem value="Beides">Beides</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Problemstellung & Kontext">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="background">4.1 Hintergrund</Label>
            <Textarea
              id="background"
              value={formData.background}
              onChange={(e) => setFormData((prev) => ({ ...prev, background: e.target.value }))}
              rows={5}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="problemStatement">4.2 Das Problem</Label>
            <Textarea
              id="problemStatement"
              value={formData.problemStatement}
              onChange={(e) => setFormData((prev) => ({ ...prev, problemStatement: e.target.value }))}
              rows={5}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">4.3 Zielsetzung</Label>
            <Textarea
              id="goal"
              value={formData.goal}
              onChange={(e) => setFormData((prev) => ({ ...prev, goal: e.target.value }))}
              rows={4}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Anforderungen">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mustRequirements">5.1 MUSS-Anforderungen</Label>
            <Textarea
              id="mustRequirements"
              value={formData.mustRequirements}
              onChange={(e) => setFormData((prev) => ({ ...prev, mustRequirements: e.target.value }))}
              rows={4}
              placeholder="Eine Anforderung pro Zeile"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="canRequirements">5.2 KANN-Anforderungen</Label>
            <Textarea
              id="canRequirements"
              value={formData.canRequirements}
              onChange={(e) => setFormData((prev) => ({ ...prev, canRequirements: e.target.value }))}
              rows={4}
              placeholder="Bonus-Anforderungen"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outOfScope">5.3 Nicht im Scope</Label>
            <Textarea
              id="outOfScope"
              value={formData.outOfScope}
              onChange={(e) => setFormData((prev) => ({ ...prev, outOfScope: e.target.value }))}
              rows={4}
              placeholder="Was explizit nicht Teil der Lösung sein soll"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Technische Rahmenbedingungen">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="allowedTechnologies">6.1 Erlaubte Technologien / Vorgaben</Label>
            <Textarea
              id="allowedTechnologies"
              value={formData.allowedTechnologies}
              onChange={(e) => setFormData((prev) => ({ ...prev, allowedTechnologies: e.target.value }))}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restrictions">6.2 Einschränkungen</Label>
            <Textarea
              id="restrictions"
              value={formData.restrictions}
              onChange={(e) => setFormData((prev) => ({ ...prev, restrictions: e.target.value }))}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="infrastructure">6.3 Infrastruktur / Umgebung</Label>
            <Textarea
              id="infrastructure"
              value={formData.infrastructure}
              onChange={(e) => setFormData((prev) => ({ ...prev, infrastructure: e.target.value }))}
              rows={4}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Bereitgestellte Ressourcen">
        <div className="grid gap-3 md:grid-cols-2">
          <CheckboxRow
            id="datasets"
            label="Datensätze / Daten"
            checked={formData.resources.datasets}
            onCheckedChange={(value) =>
              setFormData((prev) => ({ ...prev, resources: { ...prev.resources, datasets: value } }))
            }
          />
          <CheckboxRow
            id="apis"
            label="APIs / Endpoints"
            checked={formData.resources.apis}
            onCheckedChange={(value) =>
              setFormData((prev) => ({ ...prev, resources: { ...prev.resources, apis: value } }))
            }
          />
          <CheckboxRow
            id="documentation"
            label="Dokumentation"
            checked={formData.resources.documentation}
            onCheckedChange={(value) =>
              setFormData((prev) => ({ ...prev, resources: { ...prev.resources, documentation: value } }))
            }
          />
          <CheckboxRow
            id="credentials"
            label="Zugangsdaten / Credentials"
            checked={formData.resources.credentials}
            onCheckedChange={(value) =>
              setFormData((prev) => ({ ...prev, resources: { ...prev.resources, credentials: value } }))
            }
          />
          <CheckboxRow
            id="sdk"
            label="SDK / Libraries"
            checked={formData.resources.sdk}
            onCheckedChange={(value) =>
              setFormData((prev) => ({ ...prev, resources: { ...prev.resources, sdk: value } }))
            }
          />
          <CheckboxRow
            id="hardware"
            label="Hardware"
            checked={formData.resources.hardware}
            onCheckedChange={(value) =>
              setFormData((prev) => ({ ...prev, resources: { ...prev.resources, hardware: value } }))
            }
          />
          <CheckboxRow
            id="aiModels"
            label="KI-Modelle / LLMs"
            checked={formData.resources.aiModels}
            onCheckedChange={(value) =>
              setFormData((prev) => ({ ...prev, resources: { ...prev.resources, aiModels: value } }))
            }
          />
          <CheckboxRow
            id="mentoringSupport"
            label="Mentoring-Support"
            checked={formData.resources.mentoringSupport}
            onCheckedChange={(value) =>
              setFormData((prev) => ({ ...prev, resources: { ...prev.resources, mentoringSupport: value } }))
            }
          />
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="resourceDetails">Details / Zeiten</Label>
            <Textarea
              id="resourceDetails"
              value={formData.resources.details}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  resources: { ...prev.resources, details: e.target.value }
                }))
              }
              rows={3}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="resourceTimes">Zeiten</Label>
            <Input
              id="resourceTimes"
              value={formData.resources.times}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, resources: { ...prev.resources, times: e.target.value } }))
              }
              placeholder="Spätestens 1 Woche vor Event bereitstellen"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Erwartete Deliverables">
        <div className="grid gap-3 md:grid-cols-2">
          <CheckboxRow
            id="prototype"
            label="Funktionierender Prototyp / Demo"
            checked={formData.deliverables.prototype}
            onCheckedChange={(value) =>
              setFormData((prev) => ({ ...prev, deliverables: { ...prev.deliverables, prototype: value } }))
            }
          />
          <CheckboxRow
            id="pitch"
            label="Präsentation / Pitch"
            checked={formData.deliverables.pitch}
            onCheckedChange={(value) =>
              setFormData((prev) => ({ ...prev, deliverables: { ...prev.deliverables, pitch: value } }))
            }
          />
          <CheckboxRow
            id="codeRepository"
            label="Code-Repository"
            checked={formData.deliverables.codeRepository}
            onCheckedChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                deliverables: { ...prev.deliverables, codeRepository: value }
              }))
            }
          />
          <CheckboxRow
            id="readme"
            label="README / Dokumentation"
            checked={formData.deliverables.readme}
            onCheckedChange={(value) =>
              setFormData((prev) => ({ ...prev, deliverables: { ...prev.deliverables, readme: value } }))
            }
          />
          <CheckboxRow
            id="video"
            label="Kurzvideo"
            checked={formData.deliverables.video}
            onCheckedChange={(value) =>
              setFormData((prev) => ({ ...prev, deliverables: { ...prev.deliverables, video: value } }))
            }
          />
          <div className="space-y-2">
            <Label htmlFor="pitchFormat">Max. Folien / Min.</Label>
            <Input
              id="pitchFormat"
              value={formData.deliverables.pitchFormat}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  deliverables: { ...prev.deliverables, pitchFormat: e.target.value }
                }))
              }
              placeholder="z.B. 5 Folien / 3 Min."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoLength">Max. Video-Minuten</Label>
            <Input
              id="videoLength"
              value={formData.deliverables.videoLength}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  deliverables: { ...prev.deliverables, videoLength: e.target.value }
                }))
              }
              placeholder="z.B. 2 Minuten"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="deliverableOther">Sonstiges</Label>
            <Textarea
              id="deliverableOther"
              value={formData.deliverables.other}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  deliverables: { ...prev.deliverables, other: e.target.value }
                }))
              }
              rows={3}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Bewertung">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="evaluationCriteria">Kriterien</Label>
            <Textarea
              id="evaluationCriteria"
              value={formData.evaluation.criteria}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  evaluation: { ...prev.evaluation, criteria: e.target.value }
                }))
              }
              rows={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weightingNotes">Gewichtungs-Hinweise</Label>
            <Textarea
              id="weightingNotes"
              value={formData.evaluation.weightingNotes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  evaluation: { ...prev.evaluation, weightingNotes: e.target.value }
                }))
              }
              rows={3}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Preise & Anreize">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prizeFirst">1. Platz</Label>
            <Textarea
              id="prizeFirst"
              value={formData.prizes.first}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, prizes: { ...prev.prizes, first: e.target.value } }))
              }
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prizeSecond">2. Platz</Label>
            <Textarea
              id="prizeSecond"
              value={formData.prizes.second}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, prizes: { ...prev.prizes, second: e.target.value } }))
              }
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prizeThird">3. Platz</Label>
            <Textarea
              id="prizeThird"
              value={formData.prizes.third}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, prizes: { ...prev.prizes, third: e.target.value } }))
              }
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prizeSpecial">Sonderpreis</Label>
            <Textarea
              id="prizeSpecial"
              value={formData.prizes.special}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, prizes: { ...prev.prizes, special: e.target.value } }))
              }
              rows={2}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Kategoriespezifische Ergänzungen">{categorySpecificFields}</SectionCard>

      <SectionCard title="Datenschutz & Rechtliches">
        <div className="grid gap-3 md:grid-cols-2">
          <CheckboxRow
            id="dataAnonymous"
            label="Alle bereitgestellten Daten sind anonymisiert oder frei verwendbar"
            checked={formData.legal.dataAnonymous}
            onCheckedChange={(value) =>
              setFormData((prev) => ({ ...prev, legal: { ...prev.legal, dataAnonymous: value } }))
            }
          />
          <CheckboxRow
            id="noRestrictions"
            label="Es bestehen keine rechtlichen Einschränkungen für die Teilnahme"
            checked={formData.legal.noRestrictions}
            onCheckedChange={(value) =>
              setFormData((prev) => ({ ...prev, legal: { ...prev.legal, noRestrictions: value } }))
            }
          />
          <CheckboxRow
            id="portfolioAllowed"
            label="Teams dürfen die Lösung nach dem Event im Portfolio verwenden"
            checked={formData.legal.portfolioAllowed}
            onCheckedChange={(value) =>
              setFormData((prev) => ({ ...prev, legal: { ...prev.legal, portfolioAllowed: value } }))
            }
          />
          <CheckboxRow
            id="noSpecialIpRules"
            label="IP/Urheberrecht: keine Sonderregelungen"
            checked={formData.legal.noSpecialIpRules}
            onCheckedChange={(value) =>
              setFormData((prev) => ({ ...prev, legal: { ...prev.legal, noSpecialIpRules: value } }))
            }
          />
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="specialIpRules">Sonderregelungen bezüglich IP/Urheberrecht</Label>
            <Textarea
              id="specialIpRules"
              value={formData.legal.specialIpRules}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, legal: { ...prev.legal, specialIpRules: e.target.value } }))
              }
              rows={3}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Unterschrift & Einreichung">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="placeDate">Ort, Datum</Label>
            <Input
              id="placeDate"
              value={formData.signature.placeDate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  signature: { ...prev.signature, placeDate: e.target.value }
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signatureName">Name</Label>
            <Input
              id="signatureName"
              value={formData.signature.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, signature: { ...prev.signature, name: e.target.value } }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signatureFunction">Funktion</Label>
            <Input
              id="signatureFunction"
              value={formData.signature.function}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  signature: { ...prev.signature, function: e.target.value }
                }))
              }
            />
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
