export type SponsorPackage = {
  id: string
  slug: string
  name: { de: string; en: string }
  description: { de: string; en: string }
  shortDescription: { de: string; en: string }
  color: string
  benefits: { de: string; en: string }[]
  display_order: number
  price: { de: string; en: string }
}

export const sponsorPackages: SponsorPackage[] = [
  {
    id: "platin",
    slug: "platin",
    name: {
      de: "Platin",
      en: "Platinum"
    },
    color: "#8eb7d3",
    display_order: 1,
    price: {
      de: "ab CHF 10'0000",
      en: "from CHF 10'0000"
    },
    shortDescription: {
      de: "Co-Organisationspartnerschaft mit maximaler Präsenz.",
      en: "Co-organisational partnership with maximum presence."
    },
    description: {
      de: "Das Platin-Paket ist die engste Partnerschaft mit dem Zentral Hack. Es kombiniert strategische Sichtbarkeit, aktive Mitgestaltung und direkten Zugang zu Talenten, Jury und Hochschulumfeld.",
      en: "The Platinum package is the closest partnership with Zentral Hack. It combines strategic visibility, active co-creation, and direct access to talent, jury members, and the university environment."
    },
    benefits: [
      {
        de: "Beteiligung an Organisation und Mitgestaltung der Eventplanung",
        en: "Involvement in organisation and co-shaping of event planning"
      },
      {
        de: "Lead-Partner einer Kategorie mit starker inhaltlicher Präsenz",
        en: "Lead partner of a category with strong content presence"
      },
      {
        de: "Prominentes Branding auf Website, Event-Plattform, Flyer, Give-aways und Social Media",
        en: "Prominent branding on website, event platform, flyers, give-aways, and social media"
      },
      {
        de: "Sponsor-Porträt auf Social Media sowie zusätzliche Sichtbarkeit auf dem HSLU-Moodboard",
        en: "Sponsor portrait on social media and additional visibility on the HSLU moodboard"
      },
      {
        de: "Grosse Präsenzfläche vor Ort inklusive Werbemittel, LED-Banner und Recruiting-Möglichkeiten",
        en: "Large on-site presence area including promotional materials, LED banner, and recruiting opportunities"
      },
      {
        de: "Offizielle Erwähnung während des Events sowie Zugang zu Networking mit Jury, Departement und Talenten",
        en: "Official mention during the event and access to networking with jury, department, and talent"
      }
    ]
  },
  {
    id: "gold",
    slug: "gold",
    name: {
      de: "Gold",
      en: "Gold"
    },
    color: "#D4A422",
    display_order: 2,
    price: {
      de: "ab CHF 5'000",
      en: "from CHF 5'000"
    },
    shortDescription: {
      de: "Hohe Event-Präsenz mit starkem Branding und Aktivierung vor Ort.",
      en: "High event presence with strong branding and on-site activation."
    },
    description: {
      de: "Das Gold-Paket eignet sich für Partner, die am Event deutlich sichtbar sein und gleichzeitig mit eigenen Aktivierungen, Werbemitteln und Networking überzeugen wollen.",
      en: "The Gold package is ideal for partners who want to be clearly visible at the event while making an impression through their own activations, promotional materials, and networking."
    },
    benefits: [
      {
        de: "Branding auf Website, Event-Plattform, Flyer und Social Media",
        en: "Branding on website, event platform, flyers, and social media"
      },
      {
        de: "Sponsor-Porträt auf Social Media und zusätzliche Sichtbarkeit über ausgewählte Eventflächen",
        en: "Sponsor portrait on social media and additional visibility across selected event areas"
      },
      {
        de: "LED-Banner-Präsenz und Einbindung in Give-away-Aktivierungen",
        en: "LED banner presence and inclusion in give-away activations"
      },
      {
        de: "Präsenzfläche vor Ort für Austausch, Interaktion und Markeninszenierung",
        en: "On-site presence area for exchange, interaction, and brand staging"
      },
      {
        de: "Möglichkeit zur Platzierung eigener Werbemittel am Event",
        en: "Option to place your own promotional materials at the event"
      },
      {
        de: "Direkter Zugang zu Apéro, Networking und Recruiting im Eventumfeld",
        en: "Direct access to apéro, networking, and recruiting in the event environment"
      }
    ]
  },
  {
    id: "silber",
    slug: "silber",
    name: {
      de: "Silber",
      en: "Silver"
    },
    color: "#94979F",
    display_order: 3,
    price: {
      de: "ab CHF 3'000",
      en: "from CHF 3'000"
    },
    shortDescription: {
      de: "Solide Markenpräsenz auf den wichtigsten Eventkanälen.",
      en: "Solid brand presence across the key event channels."
    },
    description: {
      de: "Das Silber-Paket bietet eine ausgewogene Mischung aus Sichtbarkeit, Event-Präsenz und Kontaktpunkten mit Teilnehmenden, ohne den Umfang eines Hauptpartners zu benötigen.",
      en: "The Silver package offers a balanced mix of visibility, event presence, and touchpoints with participants, without requiring the scope of a main partner."
    },
    benefits: [
      {
        de: "Sichtbarkeit auf Website, Event-Plattform und ausgewählten Eventmedien",
        en: "Visibility on website, event platform, and selected event media"
      },
      {
        de: "Branding in Social-Media-Kommunikation und auf Sponsor-Übersichten",
        en: "Branding in social media communications and sponsor overviews"
      },
      {
        de: "Präsenz vor Ort mit kompakten Werbe- und Aktivierungsmöglichkeiten",
        en: "On-site presence with compact promotional and activation options"
      },
      {
        de: "Einbindung in zentrale Eventmomente und Sponsorennennung",
        en: "Inclusion in key event moments and sponsor acknowledgement"
      },
      {
        de: "Möglichkeit zur Platzierung eigener Werbemittel",
        en: "Option to place your own promotional materials"
      },
      {
        de: "Zugang zu Networking mit Teilnehmenden und Partnern",
        en: "Access to networking with participants and partners"
      }
    ]
  },
  {
    id: "bronze",
    slug: "bronze",
    name: {
      de: "Bronze",
      en: "Bronze"
    },
    color: "#C07A3A",
    display_order: 4,
    price: {
      de: "ab CHF 1'500",
      en: "from CHF 1'500"
    },
    shortDescription: {
      de: "Kompakter Einstieg in das Sponsoring des Zentral Hack.",
      en: "A compact entry into sponsoring Zentral Hack."
    },
    description: {
      de: "Das Bronze-Paket ist ideal für Unternehmen, die mit einem klaren, fokussierten Auftritt am Event präsent sein möchten und erste Sichtbarkeit im Sponsoring-Umfeld suchen.",
      en: "The Bronze package is ideal for companies that want a clear, focused presence at the event and are looking for initial visibility in the sponsorship environment."
    },
    benefits: [
      {
        de: "Branding auf Website und Event-Plattform",
        en: "Branding on website and event platform"
      },
      {
        de: "Präsenz auf ausgewählten Kommunikations- und Übersichtsflächen",
        en: "Presence on selected communication and overview surfaces"
      },
      {
        de: "Kompakte Sichtbarkeit vor Ort während des Events",
        en: "Compact on-site visibility during the event"
      },
      {
        de: "Möglichkeit zur Platzierung von Werbematerial im Rahmen des Events",
        en: "Option to place promotional material within the event"
      },
      {
        de: "Einbindung in Sponsorennennung und Eventkommunikation",
        en: "Inclusion in sponsor acknowledgements and event communications"
      },
      {
        de: "Niederschwelliger Zugang zum Sponsoring-Netzwerk des Zentral Hack",
        en: "Low-barrier access to the Zentral Hack sponsorship network"
      }
    ]
  }
]

export function getSponsorPackageBySlug(slug?: string | null) {
  if (!slug) {
    return null
  }

  const normalizedSlug = slug.trim().toLowerCase()
  console.log(sponsorPackages.find((pkg) => pkg.slug === normalizedSlug))
  return sponsorPackages.find((pkg) => pkg.slug === normalizedSlug) || null
}

export function normalizeSponsorInterest(value?: string | null) {
  return getSponsorPackageBySlug(value)?.slug || value?.trim().toLowerCase() || null
}

export function getSponsorContrastTextColor(hexColor: string): string {
  const hex = (hexColor || "#530A5D").replace("#", "")
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return "#FFFFFF"
  }

  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  return brightness > 165 ? "#1A1A1A" : "#FFFFFF"
}
