"use client";

import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { useLanguage } from '@/lib/language-context';

export default function ImpressumPage() {
  const { language } = useLanguage();
  const text = {
    de: {
      title: 'IMPRESSUM',
      organizer: 'Veranstalter',
      contact: 'Kontakt',
      representative: 'Vertretungsberechtigte Person',
      disclaimer: 'Haftungsausschluss',
      links: 'Haftung für Links',
      copyright: 'Urheberrechte',
      representativeText:
        'Die Hochschule Luzern ist eine autonome öffentlich-rechtliche Anstalt nach dem Fachhochschulgesetz und dem Zentralschweizer Fachhochschul-Konkordat.',
      disclaimerText:
        'Der Autor übernimmt keinerlei Gewähr hinsichtlich inhaltlicher Richtigkeit, Genauigkeit, Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen.',
      linksText:
        'Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres Verantwortungsbereichs. Zugriff und Nutzung erfolgen auf eigene Gefahr.',
      copyrightText:
        'Die Rechte an Inhalten, Bildern und Dateien gehören der Hochschule Luzern oder den genannten Rechteinhabern. Für Reproduktionen ist eine schriftliche Zustimmung erforderlich.',
      phone: 'Telefon',
      email: 'E-Mail',
      website: 'Website',
    },
    en: {
      title: 'LEGAL NOTICE',
      organizer: 'Organizer',
      contact: 'Contact',
      representative: 'Authorized Representative',
      disclaimer: 'Disclaimer',
      links: 'Liability for Links',
      copyright: 'Copyright',
      representativeText:
        'Lucerne University of Applied Sciences and Arts is an autonomous public institution under Swiss university law.',
      disclaimerText:
        'The author assumes no liability for correctness, accuracy, timeliness, reliability, or completeness of information.',
      linksText:
        'References and links to third-party websites are outside our responsibility. Access and use are at your own risk.',
      copyrightText:
        'Rights to content, images, and files belong to Lucerne University of Applied Sciences and Arts or named rights holders. Written permission is required for reproduction.',
      phone: 'Phone',
      email: 'Email',
      website: 'Website',
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
            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">{copy.organizer}</h2>
              <div className="bg-light-violet/10 rounded-xl p-6 mt-4">
                <p className="font-semibold text-lg">{language === 'de' ? 'Hochschule Luzern' : 'Lucerne University of Applied Sciences and Arts'}</p>
                <p>Werftestrasse 4</p>
                <p>6002 Luzern</p>
                <p>{language === 'de' ? 'Schweiz' : 'Switzerland'}</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">{copy.contact}</h2>
              <div className="mt-4 space-y-2">
                <p><span className="font-semibold">{copy.phone}:</span>{' '}
                  <a href="tel:+41412284242" className="text-violet hover:underline">+41 41 228 42 42</a>
                </p>
                <p><span className="font-semibold">{copy.email}:</span>{' '}
                  <a href="mailto:info@hslu.ch" className="text-violet hover:underline">info@hslu.ch</a>
                </p>
                <p><span className="font-semibold">{copy.website}:</span>{' '}
                  <a href="https://www.hslu.ch" target="_blank" rel="noopener noreferrer" className="text-violet hover:underline">www.hslu.ch</a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">{copy.representative}</h2>
              <p className="mt-4">{copy.representativeText}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">{copy.disclaimer}</h2>
              <p className="mt-4">{copy.disclaimerText}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">{copy.links}</h2>
              <p className="mt-4">{copy.linksText}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold border-b-2 border-yellow pb-2">{copy.copyright}</h2>
              <p className="mt-4">{copy.copyrightText}</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
