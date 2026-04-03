import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, serverError } from '@/lib/api';
import { verifyJWT } from '@/lib/auth';

/**
 * GET /api/admin/email-subscribers
 * Fetches all newsletter subscribers (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin only' }), { status: 401 });
    }

    const result = await query(
      'SELECT email, subscribed, created_at FROM newsletter_subscribers WHERE subscribed = true ORDER BY created_at DESC'
    );

    return successResponse({
      subscribers: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Subscribers fetch error:', error);
    return serverError('Abonnenten konnten nicht geladen werden');
  }
}
