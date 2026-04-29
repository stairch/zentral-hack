import { normalizeHexColor } from "./helpers"

export type SponsorPackagePriceStatus = "hidden" | "show" | "on_request"

export type SponsorPackage = {
  id: string
  name: string
  name_en: string | null
  short_description: string | null
  short_description_en: string | null
  display_order: number
  description: string | null
  description_en: string | null
  color: string | null
  benefits: string[] | null
  benefits_en: string[] | null
  price: number | null
  price_status: SponsorPackagePriceStatus
}

export type SponsorPackageLocale = {
  id: string
  name: string
  short_description: string
  display_order: number
  description: string
  color: string
  benefits: string[]
  price: number | null
  price_status: SponsorPackagePriceStatus
}

export function formatSponsorPackagePrice(price: number, language: "de" | "en"): string {
  return new Intl.NumberFormat(language === "en" ? "en-CH" : "de-CH", {
    style: "currency",
    currency: "CHF",
    maximumFractionDigits: 0
  }).format(price)
}

export function getSponsorPackagePriceLabel(
  sponsorPackage:
    | Pick<SponsorPackage, "price" | "price_status">
    | Pick<SponsorPackageLocale, "price" | "price_status">,
  language: "de" | "en"
): string | null {
  if (sponsorPackage.price_status === "hidden") {
    return null
  }

  if (sponsorPackage.price_status === "on_request") {
    return language === "en" ? "Price on request" : "Preis auf Anfrage"
  }

  if (typeof sponsorPackage.price === "number") {
    return formatSponsorPackagePrice(sponsorPackage.price, language)
  }

  return language === "en" ? "Price not set" : "Preis nicht gesetzt"
}

export function getSponsorPackageByLanguage(
  sponsorPackage: SponsorPackage,
  language: "de" | "en"
): SponsorPackageLocale {
  const color = normalizeHexColor(sponsorPackage.color || "#530A5D")

  const localizedName =
    language === "en" ? (sponsorPackage.name_en || sponsorPackage.name).trim() : sponsorPackage.name.trim()

  const localizedShortDescription =
    language === "en"
      ? (sponsorPackage.short_description_en || sponsorPackage.short_description || "").trim()
      : (sponsorPackage.short_description || "").trim()

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
    short_description: localizedShortDescription,
    display_order: sponsorPackage.display_order,
    description: localizedDescription,
    color,
    benefits: localizedBenefits,
    price: sponsorPackage.price,
    price_status: sponsorPackage.price_status
  }
}
