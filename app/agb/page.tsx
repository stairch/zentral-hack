"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useLanguage } from "@/lib/language-context"
import MarkdownContent from "@/components/ui/markdown-content"
import MdTerms from "./terms.md"

export default function AGBPage() {
  const { language } = useLanguage()

  const text = {
    de: {
      mainTitle: "Allgemeine Geschäftsbedingungen",
      scopeTitle: "Geltungsbereich",
      scopeText:
        "Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Teilnahme am Zentral Hack 2026, organisiert von der Hochschule Luzern (HSLU). Mit der Registrierung anerkennen die Teilnehmenden diese AGB.",
      participationTitle: "Teilnahme",
      participationText:
        "- Die Teilnahme am Zentral Hack 2026 ist kostenlos.\n- Teilnahmeberechtigt sind Studierende, Auszubildende und junge Fachkräfte.\n- Eine gültige Registrierung über die offizielle Website ist erforderlich.\n- Die Anzahl der Plätze ist begrenzt. Anmeldungen werden in der Reihenfolge des Eingangs berücksichtigt.",
      codeOfConductTitle: "Verhaltensregeln",
      codeOfConductText:
        "Alle Teilnehmenden verpflichten sich zu respektvollem, professionellem Verhalten und zur Einhaltung der Anweisungen der Veranstalter. Verstösse können zum sofortigen Ausschluss führen.",
      intellectualPropertyTitle: "Geistiges Eigentum",
      intellectualPropertyText:
        "Die während des Hackathons erstellten Projekte verbleiben im Eigentum der jeweiligen Teams. Die Veranstalter erhalten ein nicht-exklusives Recht zur Präsentation und Kommunikation der Ergebnisse.",
      liabilityTitle: "Haftung",
      liabilityText:
        "Die Teilnahme erfolgt auf eigene Verantwortung. Die Veranstalter haften nicht für persönliche Gegenstände oder Datenverluste. Die Haftung ist auf Vorsatz und grobe Fahrlässigkeit beschränkt.",
      mediaTitle: "Bild- und Tonaufnahmen",
      mediaText:
        "Während des Events können Foto- und Videoaufnahmen gemacht werden, die für Kommunikation und Dokumentation verwendet werden.",
      cancellationTitle: "Absage und Änderungen",
      cancellationText:
        "Die Veranstalter können das Event bei höherer Gewalt oder unvorhergesehenen Umständen absagen oder verschieben.",
      privacyTitle: "Datenschutz",
      privacyText: "Die Bearbeitung personenbezogener Daten erfolgt gemäss unserer Datenschutzerklärung.",
      legalTitle: "Anwendbares Recht und Gerichtsstand",
      legalText: "Es gilt schweizerisches Recht. Gerichtsstand ist Luzern, Schweiz.",
      legalFootnote: "Stand: April 2026"
    },
    en: {
      mainTitle: "Terms and Conditions",
      scopeTitle: "Scope",
      scopeText:
        "These Terms and Conditions (T&Cs) apply to participation in Zentral Hack 2026, organized by Lucerne University of Applied Sciences and Arts (HSLU). By registering, participants agree to these T&Cs.",
      participationTitle: "Participation",
      participationText:
        "- Participation in Zentral Hack 2026 is free of charge.\n- Eligible participants are students, apprentices, and young professionals.\n- A valid registration via the official website is required.\n- The number of places is limited. Registrations are considered in the order received.",
      codeOfConductTitle: "Code of Conduct",
      codeOfConductText:
        "All participants commit to respectful and professional behavior and to following the organizers' instructions. Violations may result in immediate exclusion.",
      intellectualPropertyTitle: "Intellectual Property",
      intellectualPropertyText:
        "Projects created during the hackathon remain the property of the respective teams. The organizers are granted a non-exclusive right to present and communicate the results.",
      liabilityTitle: "Liability",
      liabilityText:
        "Participation is at the participant's own risk. The organizers are not liable for personal belongings or data loss. Liability is limited to intent and gross negligence.",
      mediaTitle: "Photo and Video Recordings",
      mediaText:
        "During the event, photos and videos may be taken and used for communication and documentation purposes.",
      cancellationTitle: "Cancellation and Changes",
      cancellationText:
        "The organizers may cancel or postpone the event in cases of force majeure or unforeseen circumstances.",
      privacyTitle: "Privacy",
      privacyText: "The processing of personal data is carried out in accordance with our privacy policy.",
      legalTitle: "Governing Law and Jurisdiction",
      legalText: "Swiss law applies. Place of jurisdiction is Lucerne, Switzerland.",
      legalFootnote: "Status: April 2026"
    }
  } as const

  const copy = text[language]

  return (
    <main className="relative">
      <Navigation />
      <div className="bg-background min-h-screen pt-48 pb-28">
        <div className="content-numbered container mx-auto max-w-5xl px-4">
          <MarkdownContent toReplace={copy}>{MdTerms}</MarkdownContent>
        </div>
      </div>
      <Footer />
    </main>
  )
}
