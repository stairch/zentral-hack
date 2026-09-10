import { createHash, randomBytes } from "crypto"
import { query } from "@/lib/db"

const EXPIRATION_HOURS = 48

function getExpirationMs(): number {
  return EXPIRATION_HOURS * 60 * 60 * 1000
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

/**
 * Creates a pending double-opt-in confirmation token for the given email.
 * Any previous unconfirmed token for the same email is discarded so only the
 * most recent confirmation link stays valid.
 */
export async function createOptInToken(email: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + getExpirationMs())

  await query("DELETE FROM newsletter_opt_in_tokens WHERE email = $1", [email])
  await query(
    `INSERT INTO newsletter_opt_in_tokens (token_hash, email, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenHash, email, expiresAt.toISOString()]
  )

  return { token, expiresAt }
}

/**
 * Validates and consumes a confirmation token. Returns the associated email on
 * success (deleting the token so it cannot be reused), or null when the token is
 * unknown or expired.
 */
export async function consumeOptInToken(token: string): Promise<string | null> {
  if (!token) return null

  const tokenHash = hashToken(token)
  const result = await query(
    `DELETE FROM newsletter_opt_in_tokens
     WHERE token_hash = $1 AND expires_at > NOW()
     RETURNING email`,
    [tokenHash]
  )

  return result.rows[0]?.email ?? null
}
