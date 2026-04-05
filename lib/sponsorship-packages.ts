export interface SponsorPackage {
  id: string
  slug: string
  name: string
  description: string
  shortDescription: string
  color: string
  benefits: string[]
  display_order: number
}

export const sponsorPackages: SponsorPackage[] = [
  {
    id: "platin",
    slug: "platin",
    name: "Platin",
    shortDescription: "Co-Organisationspartnerschaft mit maximaler Präsenz.",
    description:
      "Das Platin-Paket ist die engste Partnerschaft mit dem Zentral Hack. Es kombiniert strategische Sichtbarkeit, aktive Mitgestaltung und direkten Zugang zu Talenten, Jury und Hochschulumfeld.",
    color: "#8eb7d3",
    display_order: 1,
    benefits: [
      "Beteiligung an Organisation und Mitgestaltung der Eventplanung",
      "Lead-Partner einer Kategorie mit starker inhaltlicher Präsenz",
      "Prominentes Branding auf Website, Event-Plattform, Flyer, Give-aways und Social Media",
      "Sponsor-Porträt auf Social Media sowie zusätzliche Sichtbarkeit auf dem HSLU-Moodboard",
      "Grosse Präsenzfläche vor Ort inklusive Werbemittel, LED-Banner und Recruiting-Möglichkeiten",
      "Offizielle Erwähnung während des Events sowie Zugang zu Networking mit Jury, Departement und Talenten"
    ]
  },
  {
    id: "gold",
    slug: "gold",
    name: "Gold",
    shortDescription: "Hohe Event-Präsenz mit starkem Branding und Aktivierung vor Ort.",
    description:
      "Das Gold-Paket eignet sich für Partner, die am Event deutlich sichtbar sein und gleichzeitig mit eigenen Aktivierungen, Werbemitteln und Networking überzeugen wollen.",
    color: "#D4A422",
    display_order: 2,
    benefits: [
      "Branding auf Website, Event-Plattform, Flyer und Social Media",
      "Sponsor-Porträt auf Social Media und zusätzliche Sichtbarkeit über ausgewählte Eventflächen",
      "LED-Banner-Präsenz und Einbindung in Give-away-Aktivierungen",
      "Präsenzfläche vor Ort für Austausch, Interaktion und Markeninszenierung",
      "Möglichkeit zur Platzierung eigener Werbemittel am Event",
      "Direkter Zugang zu Apéro, Networking und Recruiting im Eventumfeld"
    ]
  },
  {
    id: "silber",
    slug: "silber",
    name: "Silber",
    shortDescription: "Solide Markenpräsenz auf den wichtigsten Eventkanälen.",
    description:
      "Das Silber-Paket bietet eine ausgewogene Mischung aus Sichtbarkeit, Event-Präsenz und Kontaktpunkten mit Teilnehmenden, ohne den Umfang eines Hauptpartners zu benötigen.",
    color: "#94979F",
    display_order: 3,
    benefits: [
      "Sichtbarkeit auf Website, Event-Plattform und ausgewählten Eventmedien",
      "Branding in Social-Media-Kommunikation und auf Sponsor-Übersichten",
      "Präsenz vor Ort mit kompakten Werbe- und Aktivierungsmöglichkeiten",
      "Einbindung in zentrale Eventmomente und Sponsorennennung",
      "Möglichkeit zur Platzierung eigener Werbemittel",
      "Zugang zu Networking mit Teilnehmenden und Partnern"
    ]
  },
  {
    id: "bronze",
    slug: "bronze",
    name: "Bronze",
    shortDescription: "Kompakter Einstieg in das Sponsoring des Zentral Hack.",
    description:
      "Das Bronze-Paket ist ideal für Unternehmen, die mit einem klaren, fokussierten Auftritt am Event präsent sein möchten und erste Sichtbarkeit im Sponsoring-Umfeld suchen.",
    color: "#C07A3A",
    display_order: 4,
    benefits: [
      "Branding auf Website und Event-Plattform",
      "Präsenz auf ausgewählten Kommunikations- und Übersichtsflächen",
      "Kompakte Sichtbarkeit vor Ort während des Events",
      "Möglichkeit zur Platzierung von Werbematerial im Rahmen des Events",
      "Einbindung in Sponsorennennung und Eventkommunikation",
      "Niederschwelliger Zugang zum Sponsoring-Netzwerk des Zentral Hack"
    ]
  }
]

export function getSponsorPackageBySlug(slug?: string | null) {
  if (!slug) {
    return null
  }

  const normalizedSlug = slug.trim().toLowerCase()
  return (
    sponsorPackages.find((pkg) => pkg.slug === normalizedSlug || pkg.name.toLowerCase() === normalizedSlug) ||
    null
  )
}

export function normalizeSponsorInterest(value?: string | null) {
  return getSponsorPackageBySlug(value)?.slug || value?.trim().toLowerCase() || null
}
