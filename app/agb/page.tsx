"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useLanguage } from "@/lib/language-context"

export default function AGBPage() {
  const { language } = useLanguage()

  const content = {
    de: {
      title: "ALLGEMEINE GESCHÄFTSBEDINGUNGEN",
      sections: [
        {
          title: "1. Geltungsbereich",
          text: "Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Teilnahme am Zentral Hack 2026, organisiert von der Hochschule Luzern (HSLU). Mit der Registrierung anerkennen die Teilnehmenden diese AGB."
        },
        {
          title: "2. Teilnahme",
          list: [
            "Die Teilnahme am Zentral Hack 2026 ist kostenlos.",
            "Teilnahmeberechtigt sind Studierende, Auszubildende und junge Fachkräfte.",
            "Eine gültige Registrierung über die offizielle Website ist erforderlich.",
            "Die Veranstalter behalten sich vor, Teilnehmende ohne Angabe von Gründen abzulehnen.",
            "Die Anzahl der Plätze ist begrenzt. Anmeldungen werden in der Reihenfolge des Eingangs berücksichtigt."
          ]
        },
        {
          title: "3. Verhaltensregeln",
          text: "Alle Teilnehmenden verpflichten sich zu respektvollem, professionellem Verhalten und zur Einhaltung der Anweisungen der Veranstalter. Verstösse können zum sofortigen Ausschluss führen."
        },
        {
          title: "4. Geistiges Eigentum",
          text: "Die während des Hackathons erstellten Projekte verbleiben im Eigentum der jeweiligen Teams. Die Veranstalter erhalten ein nicht-exklusives Recht zur Präsentation und Kommunikation der Ergebnisse."
        },
        {
          title: "5. Haftung",
          text: "Die Teilnahme erfolgt auf eigene Verantwortung. Die Veranstalter haften nicht für persönliche Gegenstände oder Datenverluste. Die Haftung ist auf Vorsatz und grobe Fahrlässigkeit beschränkt."
        },
        {
          title: "6. Bild- und Tonaufnahmen",
          text: "Während des Events können Foto- und Videoaufnahmen gemacht werden, die für Kommunikation und Dokumentation verwendet werden."
        },
        {
          title: "7. Absage und Änderungen",
          text: "Die Veranstalter können das Event bei höherer Gewalt oder unvorhergesehenen Umständen absagen oder verschieben."
        },
        {
          title: "8. Datenschutz",
          text: "Die Bearbeitung personenbezogener Daten erfolgt gemäss unserer Datenschutzerklärung."
        },
        {
          title: "9. Anwendbares Recht und Gerichtsstand",
          text: "Es gilt schweizerisches Recht. Gerichtsstand ist Luzern, Schweiz.",
          footnote: "Stand: April 2026"
        }
      ]
    },
    en: {
      title: "TERMS AND CONDITIONS",
      sections: [
        {
          title: "1. Scope",
          text: "These terms and conditions apply to participation in Zentral Hack 2026, organized by Lucerne University of Applied Sciences and Arts (HSLU). By registering, participants accept these terms."
        },
        {
          title: "2. Participation",
          list: [
            "Participation in Zentral Hack 2026 is free of charge.",
            "Eligible participants include students, trainees, and young professionals.",
            "A valid registration via the official website is required.",
            "Organizers reserve the right to reject participants without providing reasons.",
            "Spots are limited and assigned in order of registration."
          ]
        },
        {
          title: "3. Code of Conduct",
          text: "All participants are expected to behave respectfully and professionally and follow organizer instructions. Violations may result in immediate exclusion."
        },
        {
          title: "4. Intellectual Property",
          text: "Projects created during the hackathon remain the property of participating teams. Organizers receive a non-exclusive right to present and communicate project results."
        },
        {
          title: "5. Liability",
          text: "Participation is at your own risk. Organizers are not liable for personal belongings or data loss. Liability is limited to intent and gross negligence."
        },
        {
          title: "6. Audio and Visual Recordings",
          text: "Photo and video recordings may be made during the event and used for communication and documentation purposes."
        },
        {
          title: "7. Cancellation and Changes",
          text: "Organizers may cancel or postpone the event in cases of force majeure or unforeseen circumstances."
        },
        {
          title: "8. Privacy",
          text: "Personal data is processed in accordance with our privacy policy."
        },
        {
          title: "9. Governing Law and Jurisdiction",
          text: "Swiss law applies. Place of jurisdiction is Lucerne, Switzerland.",
          footnote: "Version: April 2026"
        }
      ]
    }
  } as const

  const text = content[language]

  return (
    <main className="relative">
      <Navigation />
      <div className="bg-background min-h-screen pt-24 pb-16">
        <div className="container mx-auto max-w-3xl px-4">
          <h1 className="font-display text-violet mb-8 text-4xl font-bold md:text-5xl">{text.title}</h1>

          <div className="text-foreground space-y-8">
            {text.sections.map((section) => (
              <section key={section.title}>
                <h2 className="border-yellow border-b-2 pb-2 text-2xl font-bold">{section.title}</h2>
                {"text" in section ? <p className="mt-4">{section.text}</p> : null}
                {"list" in section ? (
                  <ul className="mt-4 list-disc space-y-2 pl-6">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                {section.title.includes("8.") || section.title.includes("Privacy") ? (
                  <p className="mt-4">
                    <a href="/datenschutz" className="text-violet font-semibold hover:underline">
                      {language === "de" ? "Zur Datenschutzerklärung" : "Read the privacy policy"}
                    </a>
                  </p>
                ) : null}
                {"footnote" in section ? (
                  <p className="text-muted-foreground mt-4 text-sm">{section.footnote}</p>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
