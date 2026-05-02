export interface AdminPermission {
  key: string
  labelDe: string
  labelEn: string
}

export const ADMIN_PERMISSIONS: AdminPermission[] = [
  { key: "registrations", labelDe: "Anmeldungen", labelEn: "Registrations" },
  { key: "users", labelDe: "Benutzer", labelEn: "Users" },
  { key: "teams", labelDe: "Teams", labelEn: "Teams" },
  { key: "documents", labelDe: "Dokumente", labelEn: "Documents" },
  { key: "categories", labelDe: "Kategorien", labelEn: "Categories" },
  { key: "challenges", labelDe: "Challenges", labelEn: "Challenges" },
  { key: "about", labelDe: "About Stats", labelEn: "About Stats" },
  { key: "schedule", labelDe: "Zeitplan", labelEn: "Schedule" },
  { key: "partner-logos", labelDe: "Partner-Logos", labelEn: "Partner Logos" },
  { key: "faqs", labelDe: "FAQs", labelEn: "FAQs" },
  { key: "emails", labelDe: "E-Mails & Kampagnen", labelEn: "Emails & Campaigns" },
  { key: "newsletter", labelDe: "Newsletter", labelEn: "Newsletter" },
  { key: "sponsors", labelDe: "Sponsoren", labelEn: "Sponsors" }
]

// Default permissions for category_partner users without a custom role
export const DEFAULT_CATEGORY_PARTNER_PERMISSIONS = [
  "registrations",
  "teams",
  "documents",
  "categories",
  "users",
  "challenges"
]
