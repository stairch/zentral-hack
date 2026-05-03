import { randomBytes } from "crypto"
import { query } from "@/lib/db"
import { generateVerificationCode, hashCode } from "@/lib/auth"

export type AccountAction =
  | "email_change"
  | "password_change"
  | "category_change"
  | "delete_account"
  | "password_reset"

export type AccountActionPayload = Record<string, string | null>

export async function createAccountActionChallenge(params: {
  userId: string
  action: AccountAction
  payload?: AccountActionPayload
  expiresInMinutes?: number
}) {
  const code = generateVerificationCode()
  const codeHash = await hashCode(code)
  const token = randomBytes(24).toString("hex")
  const expiresAt = new Date(Date.now() + (params.expiresInMinutes || 15) * 60 * 1000)
  const payload = params.payload || {}

  await query(
    `DELETE FROM account_action_tokens
     WHERE user_id = $1 AND action = $2 AND verified = false`,
    [params.userId, params.action]
  )

  await query(
    `INSERT INTO account_action_tokens (user_id, action, token, code, payload, expires_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
    [params.userId, params.action, token, codeHash, JSON.stringify(payload), expiresAt.toISOString()]
  )

  return { token, code, expiresAt }
}

export async function getPendingAccountAction(params: {
  token: string
  action: AccountAction
  userId?: string
}) {
  const values: string[] = [params.token, params.action]
  let sql = `SELECT id, user_id, action, token, code, payload, verified, expires_at
     FROM account_action_tokens
     WHERE token = $1 AND action = $2 AND verified = false AND expires_at > NOW()`

  if (params.userId) {
    values.push(params.userId)
    sql += ` AND user_id = $3`
  }

  sql += ` ORDER BY created_at DESC LIMIT 1`

  const result = await query(sql, values)
  return result.rows[0] || null
}

export async function getPendingAccountActionByUser(params: { userId: string; action: AccountAction }) {
  const result = await query(
    `SELECT id, user_id, action, token, code, payload, verified, expires_at
     FROM account_action_tokens
     WHERE user_id = $1
       AND action = $2
       AND verified = false
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [params.userId, params.action]
  )

  return result.rows[0] || null
}

export async function markAccountActionVerified(id: string) {
  await query("UPDATE account_action_tokens SET verified = true WHERE id = $1", [id])
}

export async function cleanupPendingActions(userId: string, action?: AccountAction) {
  if (action) {
    await query("DELETE FROM account_action_tokens WHERE user_id = $1 AND action = $2", [userId, action])
    return
  }

  await query("DELETE FROM account_action_tokens WHERE user_id = $1", [userId])
}
