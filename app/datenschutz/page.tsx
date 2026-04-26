"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useLanguage } from "@/lib/language-context"
import MarkdownContent from "@/components/ui/markdown-content"
import MdPrivacy from "./privacy.md"

export default function DatenschutzPage() {
  const { language } = useLanguage()
  const text = {
    de: {
      mainTitle: "Datenschutzerklärung",
      introductionText: `Die vorliegende Datenschutzerklärung klärt Sie über die Art, den Umfang und den Zweck 
      der Erhebung und Verwendung personenbezogener Daten auf dieser Webseite zentralhack.ch (im Folgenden "Webseite") 
      auf und gibt über die Ihnen zustehenden Rechte Auskunft. Diese Rechte richten sich nach den anwendbaren 
      Datenschutzgesetzen.`,
      responsibilityTitle: "Verantwortliche Instanz",
      responsibilityText:
        "Verantwortlich für die Datenbearbeitung auf dieser Webseite und Ansprechpartner für Datenschutzanliegen ist:",
      responsibilityCompany: "Hochschule Luzern – Informatik",
      responsibilityEmail: "E-Mail",
      responsibilityPhone: "Telefon",
      responsibilityWebsite: "Webseite",
      dataCollectionTitle: "Datenerfassung",
      logFilesTitle: "Logfiles",
      logFilesText1: `Diese Webseite wird von Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, USA) 
      ("Vercel", "Host Provider") auf einem Server in der EU gehostet.`,
      logFilesText2: `Zur Optimierung und Aufrechterhaltung dieser Webseite werden technische Fehler protokolliert, 
      die beim Aufrufen dieser Webseite allenfalls auftreten. Ferner werden bei der Nutzung dieser Webseite automatisch 
      Informationen erhoben, die der Browser Ihres Endgeräts an den Host Provider übermittelt. Dies sind insbesondere:`,
      logFilesText3:
        "- IP-Adresse und Betriebssystem Ihres Endgeräts - Browsertyp, Version, Sprache\n- Datum und Uhrzeit der Serveranfrage\n- aufgerufene Datei\n- die Webseite, von der aus der Zugriff erfolgte (Referrer URL)\n- der Status-Code (z. B. 404)\n- das verwendete Übertragungsprotokoll (z. B. HTTP/2)",
      logFilesText4: `Diese Daten werden vom Host Provider erhoben und gespeichert, um Prozesse und Abläufe insbesondere in 
      Zusammenhang mit der Nutzung dieser Webseite sowie die Sicherheit und Stabilität des Systems optimieren zu können.`,
      logFilesText5:
        "Weitere Informationen finden Sie in der Datenschutzerklärung von Vercel unter [vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy).",
      logFilesText6:
        "Sofern die DSGVO anwendbar ist, ist Grundlage für diese Datenbearbeitung Art. 6 Abs. 1 lit. f DSGVO."
    },
    en: {}
  }

  const copy = text[language]

  return (
    <main className="relative">
      <Navigation />
      <div className="bg-background min-h-screen pt-48 pb-28">
        <div className="content-numbered container mx-auto max-w-5xl px-4">
          <MarkdownContent toReplace={copy}>{MdPrivacy}</MarkdownContent>
        </div>
      </div>
      <Footer />
    </main>
  )
}
