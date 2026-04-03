import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword, generateJWT, JWTPayload, generateVerificationCode } from '@/lib/auth';
import { successResponse, validationError, serverError, unauthorizedError } from '@/lib/api';
import { LoginSchema, validateRequest } from '@/lib/validation';
import { createRateLimiter } from '@/lib/rate-limit';
import { send2FACodeEmail } from '@/lib/email';

const rateLimiter = createRateLimiter('auth');

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiter(request);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    
    // Validate input
    const validation = validateRequest(LoginSchema, body);
    if (!validation.success) {
      return validationError('Validation failed', validation.errors);
    }

    const { email, password } = validation.data;

    const result = await query(
      'SELECT id, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return unauthorizedError();
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return validationError('Account disabled');
    }

    const validPassword = await comparePassword(password, user.password_hash);
    if (!validPassword) {
      return unauthorizedError();
    }

    // Generate 2FA code for ALL users
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Save 2FA code to database
    await query(
      'INSERT INTO two_fa_tokens (user_id, token, code, expires_at) VALUES ($1, $2, $3, $4)',
      [user.id, code, code, expiresAt]
    );

    // Send 2FA code via email
    try {
      await send2FACodeEmail(user.email, code);
    } catch (emailError) {
      console.error('Failed to send 2FA email:', emailError);
      return serverError('Failed to send 2FA code');
    }

    // Return temporary auth response indicating 2FA is required
    const response = successResponse({
      user: { id: user.id, email: user.email, role: user.role },
      requiresTwoFa: true,
      message: '2FA code sent to email',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return serverError();
  }
}
