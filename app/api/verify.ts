import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { query } from '@/lib/db';
import { successResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    // Get token from httpOnly cookie
    const token = request.cookies.get('token')?.value;
    console.log('[Verify] Token from cookie:', token ? 'Found' : 'Not found');

    if (!token) {
      console.log('[Verify] No token in cookie, returning 401');
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    // Verify JWT
    const payload = verifyJWT(token);
    console.log('[Verify] JWT verification:', payload ? 'Valid' : 'Invalid');
    
    if (!payload) {
      console.log('[Verify] Invalid JWT, returning 401');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch user details from database
    const result = await query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
      [payload.userId]
    );

    console.log('[Verify] User query result:', result.rows.length > 0 ? 'Found' : 'Not found');

    if (result.rows.length === 0) {
      console.log('[Verify] User not found in DB, returning 404');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];
    console.log('[Verify] Returning user:', user.email);

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
    console.error('[Verify] Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
