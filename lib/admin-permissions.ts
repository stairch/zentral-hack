export interface AdminPermission {
  key: string
  labelDe: string
  labelEn: string
}

export const ADMIN_PERMISSIONS: AdminPermission[] = [
  { key: "users", labelDe: "Benutzer & Anmeldungen", labelEn: "Users & Registrations" },
  { key: "teams", labelDe: "Teams", labelEn: "Teams" },
  { key: "documents", labelDe: "Dokumente", labelEn: "Documents" },
  { key: "categories", labelDe: "Kategorien", labelEn: "Categories" },
  { key: "challenges", labelDe: "Challenges", labelEn: "Challenges" },
  { key: "about", labelDe: "About Stats", labelEn: "About Stats" },
  { key: "schedule", labelDe: "Zeitplan", labelEn: "Schedule" },
  { key: "partner-logos", labelDe: "Partner-Logos", labelEn: "Partner Logos" },
  { key: "faqs", labelDe: "FAQs", labelEn: "FAQs" },
  { key: "sponsors", labelDe: "Sponsoren", labelEn: "Sponsors" }
]

// Default permissions for category_partner users without a custom role
export const DEFAULT_CATEGORY_PARTNER_PERMISSIONS = [
  "teams",
  "documents",
  "categories",
  "users",
  "challenges"
]
