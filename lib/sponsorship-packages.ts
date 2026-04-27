import { normalizeHexColor } from "./helpers"

export type SponsorPackage = {
  id: string
  name: string
  name_en: string
  display_order: number
  description: string
  description_en: string
  color: string
  benefits: string[]
  benefits_en: string[]
}

export type SponsorPackageLocale = {
  id: string
  name: string
  display_order: number
  description: string
  color: string
  benefits: string[]
}

// export function normalizeSponsorInterest(value?: string | null) {
//   return getSponsorPackageBySlug(value)?.slug || value?.trim().toLowerCase() || null
// }

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

export function getSponsorPackageByLanguage(
  sponsorPackage: SponsorPackage,
  language: "de" | "en"
): SponsorPackageLocale {
  const color = normalizeHexColor(sponsorPackage.color)

  const localizedName =
    language === "en" ? (sponsorPackage.name_en || sponsorPackage.name).trim() : sponsorPackage.name.trim()

  const localizedDescription =
    language === "en"
      ? (sponsorPackage.description_en || sponsorPackage.description || "").trim()
      : (sponsorPackage.description || "").trim()

  const localizedBenefits =
    language === "en"
      ? ((sponsorPackage.benefits_en?.length ? sponsorPackage.benefits_en : sponsorPackage.benefits) ?? [])
      : (sponsorPackage.benefits ?? [])

  return {
    id: sponsorPackage.id,
    name: localizedName,
    display_order: sponsorPackage.display_order,
    description: localizedDescription,
    color,
    benefits: localizedBenefits
  }
}
