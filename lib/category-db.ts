import { query } from "@/lib/db"

const optionalCategoryColumns = [
  "partner_name",
  "name_en",
  "description_en",
  "short_description",
  "short_description_en",
  "partner_name_en",
  "color",
  "icon",
  "challenge_description",
  "challenge_description_en",
  "show_challenge_description",
  "prize",
  "prize_en",
  "target_group",
  "target_group_en",
  "display_order"
] as const
const optionalCategoryColumnsParam: string[] = [...optionalCategoryColumns]

export type OptionalCategoryColumn = (typeof optionalCategoryColumns)[number]

export async function getAvailableCategoryColumns(): Promise<Set<OptionalCategoryColumn>> {
  const result = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'categories'
       AND column_name = ANY($1::text[])`,
    [optionalCategoryColumnsParam]
  )

  return new Set(result.rows.map((row) => row.column_name as OptionalCategoryColumn))
}

export function buildCategorySelectClause(availableColumns: Set<OptionalCategoryColumn>) {
  return [
    "id",
    "name",
    availableColumns.has("name_en") ? "name_en" : "NULL::text AS name_en",
    "slug",
    "description",
    availableColumns.has("description_en") ? "description_en" : "NULL::text AS description_en",
    availableColumns.has("short_description") ? "short_description" : "NULL::text AS short_description",
    availableColumns.has("short_description_en")
      ? "short_description_en"
      : "NULL::text AS short_description_en",
    availableColumns.has("partner_name") ? "partner_name" : "NULL::text AS partner_name",
    availableColumns.has("partner_name_en") ? "partner_name_en" : "NULL::text AS partner_name_en",
    availableColumns.has("color") ? "color" : "NULL::text AS color",
    availableColumns.has("icon") ? "icon" : "NULL::text AS icon",
    availableColumns.has("challenge_description")
      ? "challenge_description"
      : "NULL::text AS challenge_description",
    availableColumns.has("challenge_description_en")
      ? "challenge_description_en"
      : "NULL::text AS challenge_description_en",
    availableColumns.has("show_challenge_description")
      ? "show_challenge_description"
      : "false::boolean AS show_challenge_description",
    availableColumns.has("prize") ? "prize" : "NULL::text AS prize",
    availableColumns.has("prize_en") ? "prize_en" : "NULL::text AS prize",
    availableColumns.has("target_group") ? "target_group" : "NULL::text AS target_group",
    availableColumns.has("target_group_en") ? "target_group_en" : "NULL::text AS target_group_en",
    availableColumns.has("display_order") ? "display_order" : "0::integer AS display_order",
    "is_active",
    "created_at",
    "updated_at"
  ].join(", ")
}
