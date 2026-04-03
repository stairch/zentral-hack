import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

// Ensure secrets are configured
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'category_partner' | 'admin';
  twoFaVerified?: boolean;
  categoryId?: string;
}

export function generateJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
}

export function generateTwoFAToken(): string {
  return jwt.sign({ type: '2fa' }, JWT_SECRET, {
    expiresIn: process.env.TWO_FA_EXPIRATION || '15m',
  });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Cryptographically secure verification code generation
export function generateVerificationCode(): string {
  // Generate 3 bytes (24 bits) = 6 hex characters (0-9, A-F)
  return randomBytes(3).toString('hex').toUpperCase();
}
