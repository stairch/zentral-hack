import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Impressum | Zentral Hack 2026',
  description: 'Impressum und Kontaktinformationen des Zentral Hack 2026',
};

export default function ImpressumPage() {
  return (
    <main className="relative">
      <Navigation />
      <div className="min-h-screen pt-24 pb-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-violet mb-8">
            IMPRESSUM
          </h1>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">Veranstalter</h2>
              <div className="bg-light-violet/10 rounded-xl p-6 mt-4">
                <p className="font-semibold text-lg">Hochschule Luzern</p>
                <p>Werftestrasse 4</p>
                <p>6002 Luzern</p>
                <p>Schweiz</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">Kontakt</h2>
              <div className="mt-4 space-y-2">
                <p><span className="font-semibold">Telefon:</span>{' '}
                  <a href="tel:+41412284242" className="text-violet hover:underline">+41 41 228 42 42</a>
                </p>
                <p><span className="font-semibold">E-Mail:</span>{' '}
                  <a href="mailto:info@hslu.ch" className="text-violet hover:underline">info@hslu.ch</a>
                </p>
                <p><span className="font-semibold">Website:</span>{' '}
                  <a href="https://www.hslu.ch" target="_blank" rel="noopener noreferrer" className="text-violet hover:underline">www.hslu.ch</a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">Vertretungsberechtigte Person</h2>
              <p className="mt-4">
                Die Hochschule Luzern ist eine autonome öffentlich-rechtliche Anstalt nach dem Fachhochschulgesetz
                und dem Zentralschweizer Fachhochschul-Konkordat.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">Haftungsausschluss</h2>
              <p className="mt-4">
                Der Autor übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen Richtigkeit, Genauigkeit,
                Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen.
              </p>
              <p className="mt-2">
                Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller Art, welche aus
                dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten Informationen, durch Missbrauch
                der Verbindung oder durch technische Störungen entstanden sind, werden ausgeschlossen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">Haftung für Links</h2>
              <p className="mt-4">
                Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres Verantwortungsbereichs.
                Es wird jegliche Verantwortung für solche Webseiten abgelehnt. Der Zugriff und die Nutzung
                solcher Webseiten erfolgen auf eigene Gefahr des Nutzers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">Urheberrechte</h2>
              <p className="mt-4">
                Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen Dateien auf der
                Website gehören ausschliesslich der Hochschule Luzern oder den speziell genannten Rechtsinhabern.
                Für die Reproduktion jeglicher Elemente ist die schriftliche Zustimmung der Urheberrechtsträger
                im Voraus einzuholen.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
