import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Datenschutzerklärung | Zentral Hack 2026',
  description: 'Datenschutzerklärung des Zentral Hack 2026',
};

export default function DatenschutzPage() {
  return (
    <main className="relative">
      <Navigation />
      <div className="min-h-screen pt-24 pb-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-violet mb-8">
            DATENSCHUTZ
          </h1>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">1. Verantwortliche Stelle</h2>
              <div className="mt-4 space-y-2">
                <p>Verantwortlich für die Datenbearbeitung auf dieser Website:</p>
                <div className="bg-light-violet/10 rounded-xl p-6">
                  <p className="font-semibold">Hochschule Luzern</p>
                  <p>Werftestrasse 4, 6002 Luzern, Schweiz</p>
                  <p>E-Mail: <a href="mailto:info@hslu.ch" className="text-violet hover:underline">info@hslu.ch</a></p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">2. Erhebung und Verwendung von Daten</h2>
              <p className="mt-4">
                Wir erheben und verwenden personenbezogene Daten nur, soweit dies zur Bereitstellung der Hackathon-Plattform
                und zur Durchführung des Events erforderlich ist.
              </p>
              <h3 className="text-lg font-semibold mt-4">Bei der Registrierung erheben wir:</h3>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Vor- und Nachname</li>
                <li>E-Mail-Adresse</li>
                <li>Hochschule und Studiengang</li>
                <li>Semester</li>
                <li>Allergien und Unverträglichkeiten (freiwillig)</li>
                <li>Gewählte Hackathon-Kategorie</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">3. Zweck der Datenbearbeitung</h2>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><span className="font-semibold">Registrierung und Teilnahme:</span> Verwaltung der Anmeldung und Teilnahme am Hackathon</li>
                <li><span className="font-semibold">Kommunikation:</span> Versand von Event-bezogenen Informationen und Bestätigungen per E-Mail</li>
                <li><span className="font-semibold">Verpflegung:</span> Berücksichtigung von Allergien und Ernährungspräferenzen</li>
                <li><span className="font-semibold">Newsletter:</span> Nur bei ausdrücklicher Einwilligung</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">4. Datensicherheit</h2>
              <p className="mt-4">
                Wir treffen angemessene technische und organisatorische Sicherheitsmassnahmen, um Ihre Daten
                gegen Manipulation, Verlust, Zerstörung oder unbefugten Zugriff zu schützen. Dazu gehören:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Verschlüsselung der Datenübertragung (HTTPS/TLS)</li>
                <li>Sichere Passwortspeicherung (bcrypt-Hashing)</li>
                <li>Zwei-Faktor-Authentifizierung (2FA) für alle Benutzer</li>
                <li>Regelmässige Sicherheitsüberprüfungen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">5. Cookies</h2>
              <p className="mt-4">
                Diese Website verwendet ausschliesslich technisch notwendige Cookies (httpOnly-Session-Cookies)
                für die Authentifizierung. Es werden keine Tracking- oder Werbe-Cookies eingesetzt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">6. Weitergabe an Dritte</h2>
              <p className="mt-4">
                Personenbezogene Daten werden grundsätzlich nicht an Dritte weitergegeben, es sei denn,
                dies ist zur Durchführung des Events erforderlich (z.B. Catering-Dienstleister für Allergien)
                oder es besteht eine gesetzliche Verpflichtung.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">7. Ihre Rechte</h2>
              <p className="mt-4">Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><span className="font-semibold">Auskunftsrecht:</span> Sie können Auskunft über Ihre gespeicherten Daten verlangen</li>
                <li><span className="font-semibold">Berichtigungsrecht:</span> Sie können die Berichtigung unrichtiger Daten verlangen</li>
                <li><span className="font-semibold">Löschungsrecht:</span> Sie können die Löschung Ihrer Daten verlangen</li>
                <li><span className="font-semibold">Widerspruchsrecht:</span> Sie können der Datenbearbeitung widersprechen</li>
              </ul>
              <p className="mt-4">
                Wenden Sie sich hierfür an: <a href="mailto:info@hslu.ch" className="text-violet hover:underline">info@hslu.ch</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">8. Aufbewahrungsdauer</h2>
              <p className="mt-4">
                Personenbezogene Daten werden gelöscht, sobald der Zweck der Speicherung entfällt.
                Registrierungsdaten werden spätestens 12 Monate nach Durchführung des Events gelöscht,
                sofern keine gesetzlichen Aufbewahrungspflichten bestehen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">9. Änderungen</h2>
              <p className="mt-4">
                Wir behalten uns vor, diese Datenschutzerklärung jederzeit anzupassen. Die aktuelle Fassung
                ist auf dieser Website veröffentlicht.
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
