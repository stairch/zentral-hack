"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useLanguage } from "@/lib/language-context"
import MarkdownContent from "@/components/ui/markdown-content"
import MdLegalNotice from "./legal-notice.md"

export default function ImpressumPage() {
  const { language } = useLanguage()
  const text = {
    de: {
      mainTitle: "IMPRESSUM",
      responsibilityTitle: "Verantwortliche Instanz",
      disclaimerTitle: "Haftungsausschluss",
      disclaimerContentAndLinksTitle: "Haftung für Inhalte und Links",
      copyrightTitle: "Urheberrechtserklärung",
      responsibilityCompany: "Hochschule Luzern – Informatik",
      responsibilityEmail: "E-Mail",
      responsibilityPhone: "Telefon",
      responsibilityWebsite: "Webseite",
      disclaimerText1: `Der Autor übernimmt keine Gewähr für die Richtigkeit, Genauigkeit, Aktualität,
      Zuverlässigkeit und Vollständigkeit der Informationen. Haftungsansprüche gegen den Autor für Schäden
      materieller oder immaterieller Art, die aus dem Zugriff auf, der Nutzung oder Nichtnutzung der
      veröffentlichten Informationen, aus dem Missbrauch der Verbindung oder aus technischen Störungen
      entstehen, sind ausgeschlossen.`,
      disclaimerText2: `Alle Angebote sind unverbindlich. Der Autor behält sich ausdrücklich vor,
      Teile der Seiten oder das gesamte Angebot ohne gesonderte Ankündigung zu verändern,
      zu ergänzen, zu löschen oder die Veröffentlichung zeitweise oder endgültig einzustellen.`,
      disclaimerContentAndLinksText: `Verweise und Links auf Websites Dritter liegen ausserhalb
      des Verantwortungsbereichs des Autors. Jegliche Verantwortung für solche Websites wird abgelehnt.
      Der Zugriff auf und die Nutzung solcher Websites erfolgt auf eigene Gefahr des Nutzers.`,
      copyrightText: `Die Urheberrechte und alle anderen Rechte an Inhalten, Bildern, Fotos oder
      anderen Dateien auf dieser Website gehören ausschliesslich der oben genannten Stelle oder
      den ausdrücklich genannten Rechteinhabern. Für die Vervielfältigung jeglicher Elemente ist
      die schriftliche Zustimmung des Urheberrechtsinhabers im Voraus einzuholen.`,
      ambiguityText: ""
    },
    en: {
      mainTitle: "LEGAL NOTICE",
      responsibilityTitle: "Responsible Entity",
      disclaimerTitle: "Disclaimer",
      disclaimerContentAndLinksTitle: "Liability for Content and Links",
      copyrightTitle: "Copyright Notice",
      responsibilityCompany: "Lucerne School of Computer Science and Information Technology",
      responsibilityEmail: "Email",
      responsibilityPhone: "Phone",
      responsibilityWebsite: "Website",
      disclaimerText1: `The author assumes no responsibility for the correctness, accuracy, timeliness,
      reliability, or completeness of the information. Liability claims against the author for
      material or immaterial damages arising from access to, use or non-use of the published
      information, from misuse of the connection, or from technical issues are excluded.`,
      disclaimerText2: `All offers are non-binding. The author expressly reserves the right to
      change, supplement, delete parts of the pages or the entire offer without prior notice,
      or to temporarily or permanently discontinue publication.`,
      disclaimerContentAndLinksText: `References and links to third-party websites are outside
      the author's area of responsibility. Any responsibility for such websites is declined.
      Access to and use of such websites is at the user's own risk.`,
      copyrightText: `The copyrights and all other rights to content, images, photos, or other
      files on this website belong exclusively to the aforementioned entity or the specifically
      named rights holders. Prior written consent of the copyright holder must be obtained
      for the reproduction of any elements.`,
      ambiguityText: `In case of doubt, the German version shall prevail.`
    }
  } as const

  const copy = text[language]

  return (
    <main className="relative">
      <Navigation />
      <div className="bg-background min-h-screen pt-24 pb-16">
        <div className="container mx-auto max-w-3xl px-4">
          <h1 className="font-display text-violet mb-8 text-4xl font-bold md:text-5xl">{copy.title}</h1>

          <div className="text-foreground space-y-8">
            <section>
              <h2 className="border-yellow border-b-2 pb-2 text-2xl font-bold">{copy.organizer}</h2>
              <div className="mt-4 rounded-xl p-6">
                <p className="text-lg font-semibold">
                  {language === "de"
                    ? "Hochschule Luzern – Informatik"
                    : "Lucerne School of Computer Science and Information Technology"}
                </p>
                <p>Suurstoffi 1</p>
                <p>6343 Rotkreuz</p>
                <p>{language === "de" ? "Schweiz" : "Switzerland"}</p>
              </div>
            </section>

            <section>
              <h2 className="border-yellow border-b-2 pb-2 text-2xl font-bold">{copy.contact}</h2>
              <div className="mt-4 space-y-2">
                <p>
                  <span className="font-semibold">{copy.phone}:</span>{" "}
                  <a href="tel:+41417576811" className="text-violet hover:underline">
                    +41 41 757 68 11
                  </a>
                </p>
                <p>
                  <span className="font-semibold">{copy.email}:</span>{" "}
                  <a href={`mailto:${Emails.contactHSLU}`} className="text-violet hover:underline">
                    {Emails.contactHSLU}
                  </a>
                </p>
                <p>
                  <span className="font-semibold">{copy.website}:</span>{" "}
                  <a
                    href="https://www.hslu.ch/future-talents"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet hover:underline">
                    hslu.ch/future-talents
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="border-yellow border-b-2 pb-2 text-2xl font-bold">{copy.representative}</h2>
              <p className="mt-4">{copy.representativeText}</p>
            </section>

            <section>
              <h2 className="border-yellow border-b-2 pb-2 text-2xl font-bold">{copy.disclaimer}</h2>
              <p className="mt-4">{copy.disclaimerText}</p>
            </section>

            <section>
              <h2 className="border-yellow border-b-2 pb-2 text-2xl font-bold">{copy.links}</h2>
              <p className="mt-4">{copy.linksText}</p>
            </section>

            <section>
              <h2 className="border-yellow border-b-2 pb-2 text-2xl font-bold">{copy.copyright}</h2>
              <p className="mt-4">{copy.copyrightText}</p>
            </section>
          </div>
      <div className="bg-background min-h-screen pt-48 pb-28">
        <div className="container mx-auto max-w-5xl px-4">
          <MarkdownContent toReplace={copy}>{MdLegalNotice}</MarkdownContent>
        </div>
      </div>
      <Footer />
    </main>
  )
}
