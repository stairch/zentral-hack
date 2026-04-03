import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, serverError } from '@/lib/api';
import { verifyJWT } from '@/lib/auth';

/**
 * GET /api/admin/dashboard-stats
 * Fetches dashboard statistics (admin only)
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

    const [registrationsRes, newsletterRes, teamsRes, documentsRes] = await Promise.all([
      query('SELECT COUNT(*) as count FROM registrations'),
      query('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE subscribed = true'),
      query('SELECT COUNT(*) as count FROM teams'),
      query('SELECT COUNT(*) as count FROM category_documents'),
    ]);

    const stats = {
      registrations: parseInt(registrationsRes.rows[0]?.count || 0),
      newsletter: parseInt(newsletterRes.rows[0]?.count || 0),
      teams: parseInt(teamsRes.rows[0]?.count || 0),
      documents: parseInt(documentsRes.rows[0]?.count || 0),
    };

    return successResponse({ stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return serverError('Fehler beim Laden der Statistiken');
  }
}
