import jwt, { SignOptions } from "jsonwebtoken"
import bcrypt from "bcrypt"
import { randomBytes } from "crypto"

const JWT_EXPIRATION = (process.env.JWT_EXPIRATION || "24h") as SignOptions["expiresIn"]

export interface JWTPayload {
  userId: string
  email: string
  role: "user" | "category_partner" | "sponsor" | "admin"
  twoFaVerified?: boolean
  categoryId?: string
  adminRoleId?: string
  updatedAt?: string
}

export function generateJWT(payload: JWTPayload): string {
  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: JWT_EXPIRATION
  })
}

export function generateTwoFAToken(): string {
  return jwt.sign({ type: "2fa" }, getJWTSecret(), {
    expiresIn: (process.env.TWO_FA_EXPIRATION || "15m") as SignOptions["expiresIn"]
  })
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJWTSecret()) as JWTPayload
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function hashCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10)
}

export async function compareCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash)
}

// Cryptographically secure verification code generation
export function generateVerificationCode(): string {
  // Generate 3 bytes (24 bits) = 6 hex characters (0-9, A-F)
  return randomBytes(3).toString("hex").toUpperCase()
}

function getJWTSecret(): string {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required")
  }

  return process.env.JWT_SECRET as string
}
