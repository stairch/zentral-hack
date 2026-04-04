import { query } from "@/lib/db"

const optionalFaqColumns = ["question_en", "answer_en"] as const

export type OptionalFaqColumn = (typeof optionalFaqColumns)[number]

export async function getAvailableFaqColumns(): Promise<Set<OptionalFaqColumn>> {
  const result = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'faqs'
       AND column_name = ANY($1::text[])`,
    [[...optionalFaqColumns]]
  )

  return new Set(result.rows.map((row) => row.column_name as OptionalFaqColumn))
}

export function buildFaqSelectClause(availableColumns: Set<OptionalFaqColumn>): string {
  return [
    "id",
    "question",
    availableColumns.has("question_en") ? "question_en" : "NULL::text AS question_en",
    "answer",
    availableColumns.has("answer_en") ? "answer_en" : "NULL::text AS answer_en",
    "order_position",
    "is_active",
    "created_at",
    "updated_at"
  ].join(", ")
}
