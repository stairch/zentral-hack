"use client";

import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { useLanguage } from '@/lib/language-context';

export default function DatenschutzPage() {
  const { language } = useLanguage();
  const text = {
    de: {
      title: 'DATENSCHUTZ',
      sections: [
        ['1. Verantwortliche Stelle', 'Verantwortlich für die Datenbearbeitung auf dieser Website: Hochschule Luzern, Werftestrasse 4, 6002 Luzern, Schweiz, info@hslu.ch'],
        ['2. Erhebung und Verwendung von Daten', 'Wir erheben personenbezogene Daten nur, soweit dies zur Bereitstellung der Plattform und zur Durchführung des Events erforderlich ist.'],
        ['3. Zweck der Datenbearbeitung', 'Daten werden für Registrierung, Teilnahme, Kommunikation, Verpflegung und (optional) Newsletter genutzt.'],
        ['4. Datensicherheit', 'Wir schützen Ihre Daten mit technischen und organisatorischen Massnahmen wie HTTPS/TLS, sicherer Passwortspeicherung und 2FA.'],
        ['5. Cookies', 'Diese Website verwendet nur technisch notwendige Cookies für die Authentifizierung.'],
        ['6. Weitergabe an Dritte', 'Daten werden grundsätzlich nicht an Dritte weitergegeben, ausser wenn dies für das Event nötig ist oder gesetzlich verlangt wird.'],
        ['7. Ihre Rechte', 'Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Widerspruch. Kontakt: info@hslu.ch'],
        ['8. Aufbewahrungsdauer', 'Daten werden gelöscht, sobald der Zweck entfällt, spätestens 12 Monate nach Eventende sofern keine Aufbewahrungspflicht besteht.'],
        ['9. Änderungen', 'Diese Datenschutzerklärung kann angepasst werden. Massgeblich ist die auf der Website publizierte Version.'],
      ],
      updated: 'Stand: April 2026',
    },
    en: {
      title: 'PRIVACY',
      sections: [
        ['1. Data Controller', 'Responsible for data processing on this website: Lucerne University of Applied Sciences and Arts, Werftestrasse 4, 6002 Lucerne, Switzerland, info@hslu.ch'],
        ['2. Data Collection and Use', 'We collect personal data only as needed to provide the platform and run the event.'],
        ['3. Purpose of Processing', 'Data is used for registration, participation, communication, catering needs, and optional newsletter updates.'],
        ['4. Data Security', 'We protect your data through technical and organizational safeguards such as HTTPS/TLS, secure password storage, and 2FA.'],
        ['5. Cookies', 'This website only uses technically required cookies for authentication.'],
        ['6. Sharing with Third Parties', 'Data is generally not shared with third parties unless required for event operations or legal obligations.'],
        ['7. Your Rights', 'You have rights to access, rectification, deletion, and objection. Contact: info@hslu.ch'],
        ['8. Retention', 'Data is deleted once no longer needed, at the latest 12 months after the event unless legal retention applies.'],
        ['9. Changes', 'This privacy notice may be updated at any time. The current published version applies.'],
      ],
      updated: 'Version: April 2026',
    },
  } as const;

  const copy = text[language];

  return (
    <main className="relative">
      <Navigation />
      <div className="min-h-screen pt-24 pb-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-violet mb-8">
            {copy.title}
          </h1>

          <div className="space-y-8 text-foreground">
            {copy.sections.map(([title, textBody]) => (
              <section key={title}>
                <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">{title}</h2>
                <p className="mt-4">{textBody}</p>
              </section>
            ))}
            <p className="mt-4 text-sm text-muted-foreground">{copy.updated}</p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
