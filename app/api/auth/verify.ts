import { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { query } from '@/lib/db';
import { successResponse } from '@/lib/api';

/**
 * GET /api/auth/verify
 * Verify current session via httpOnly cookie
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from httpOnly cookie
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return new Response(JSON.stringify({ error: 'No token found' }), { status: 401 });
    }

    // Verify JWT
    const payload = verifyJWT(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    // Fetch user details from database
    const result = await query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    const user = result.rows[0];

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Auth verify error:', error);
    return new Response(JSON.stringify({ error: 'Verification failed' }), { status: 500 });
  }
}
