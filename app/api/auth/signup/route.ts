import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, generateJWT, JWTPayload } from '@/lib/auth';
import { successResponse, validationError, serverError } from '@/lib/api';
import { SignupSchema, validateRequest } from '@/lib/validation';
import { createRateLimiter } from '@/lib/rate-limit';

const rateLimiter = createRateLimiter('signup');

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiter(request);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    
    // Validate input
    const validation = validateRequest(SignupSchema, body);
    if (!validation.success) {
      console.error('Signup validation errors:', validation.errors);
      return validationError(`Validierungsfehler: ${Object.values(validation.errors).join(', ')}`);
    }

    const { email, password, firstName, lastName } = validation.data;

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return validationError('Diese Email ist bereits registriert');
    }

    const hash = await hashPassword(password);
    const result = await query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, role',
      [email.toLowerCase(), hash, firstName, lastName]
    );

    const user = result.rows[0];
    await query('INSERT INTO profiles (user_id) VALUES ($1)', [user.id]);

    const payload: JWTPayload = { userId: user.id, email: user.email, role: user.role };
    const token = generateJWT(payload);

    const response = successResponse({
      user: { id: user.id, email: user.email, role: user.role },
      token,
    }, 201);

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return serverError('Fehler bei der Anmeldung. Bitte versuchen Sie es später erneut.');
  }
}
