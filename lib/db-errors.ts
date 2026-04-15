type PgLikeError = {
  code?: string
  message?: string
}

export function isMissingTableError(error: unknown, tableName: string): boolean {
  const candidate = error as PgLikeError | null
  if (!candidate) return false

  const hasMissingRelationCode = candidate.code === "42P01"
  const message = (candidate.message || "").toLowerCase()

  return hasMissingRelationCode && message.includes(tableName.toLowerCase())
}