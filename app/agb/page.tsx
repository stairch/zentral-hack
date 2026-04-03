import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'AGB | Zentral Hack 2026',
  description: 'Allgemeine Geschäftsbedingungen des Zentral Hack 2026',
};

export default function AGBPage() {
  return (
    <main className="relative">
      <Navigation />
      <div className="min-h-screen pt-24 pb-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-violet mb-8">
            ALLGEMEINE GESCHÄFTSBEDINGUNGEN
          </h1>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">1. Geltungsbereich</h2>
              <p className="mt-4">
                Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Teilnahme am Zentral Hack 2026,
                organisiert von der Hochschule Luzern (HSLU). Mit der Registrierung anerkennen die
                Teilnehmenden diese AGB.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">2. Teilnahme</h2>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Die Teilnahme am Zentral Hack 2026 ist kostenlos.</li>
                <li>Teilnahmeberechtigt sind Studierende, Auszubildende und junge Fachkräfte.</li>
                <li>Eine gültige Registrierung über die offizielle Website ist erforderlich.</li>
                <li>Die Veranstalter behalten sich vor, Teilnehmende ohne Angabe von Gründen abzulehnen.</li>
                <li>Die Anzahl der Plätze ist begrenzt. Anmeldungen werden in der Reihenfolge des Eingangs berücksichtigt.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">3. Verhaltensregeln</h2>
              <p className="mt-4">Alle Teilnehmenden verpflichten sich:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Respektvoll und professionell miteinander umzugehen</li>
                <li>Keine diskriminierenden, beleidigenden oder bedrohlichen Handlungen vorzunehmen</li>
                <li>Die Anweisungen der Veranstalter zu befolgen</li>
                <li>Sorgfältig mit bereitgestellten Materialien und Räumlichkeiten umzugehen</li>
                <li>Keine rechtswidrigen Inhalte oder Software zu erstellen</li>
              </ul>
              <p className="mt-4">
                Verstösse gegen diese Regeln können zum sofortigen Ausschluss vom Event führen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">4. Geistiges Eigentum</h2>
              <p className="mt-4">
                Die während des Hackathons erstellten Projekte und deren geistiges Eigentum verbleiben bei den
                jeweiligen Teilnehmenden bzw. Teams. Die Veranstalter erhalten ein nicht-exklusives Recht,
                die Projektergebnisse zu Präsentations- und Kommunikationszwecken zu verwenden.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">5. Haftung</h2>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Die Teilnahme erfolgt auf eigene Verantwortung.</li>
                <li>Die Veranstalter haften nicht für Schäden an persönlichem Eigentum der Teilnehmenden.</li>
                <li>Die Veranstalter haften nicht für den Verlust oder die Beschädigung von Daten.</li>
                <li>Die Haftung der Veranstalter ist auf Vorsatz und grobe Fahrlässigkeit beschränkt.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">6. Bild- und Tonaufnahmen</h2>
              <p className="mt-4">
                Während des Events können Foto- und Videoaufnahmen gemacht werden. Mit der Teilnahme
                erklären sich die Teilnehmenden damit einverstanden, dass diese Aufnahmen für die
                Kommunikation und Dokumentation des Events verwendet werden dürfen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">7. Absage und Änderungen</h2>
              <p className="mt-4">
                Die Veranstalter behalten sich vor, das Event bei höherer Gewalt oder unvorhergesehenen
                Umständen abzusagen oder zu verschieben. In diesem Fall werden die Teilnehmenden zeitnah
                informiert. Ein Anspruch auf Schadensersatz besteht nicht.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">8. Datenschutz</h2>
              <p className="mt-4">
                Die Bearbeitung personenbezogener Daten erfolgt gemäss unserer{' '}
                <a href="/datenschutz" className="text-violet hover:underline font-semibold">Datenschutzerklärung</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">9. Anwendbares Recht und Gerichtsstand</h2>
              <p className="mt-4">
                Es gilt schweizerisches Recht. Gerichtsstand ist Luzern, Schweiz.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">Stand: April 2026</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
