import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, serverError } from '@/lib/api';
import { verifyJWT } from '@/lib/auth';

/**
 * GET /api/admin-registrations
 * Fetches all confirmed registrations with search and filter support
 * Requires admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Verify JWT
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'category_partner')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT 
        r.id,
        r.user_id,
        u.email,
        u.first_name,
        u.last_name,
        c.name as category_name,
        p.university,
        p.study_program,
        p.semester,
        p.allergies,
        p.dietary_restrictions,
        r.created_at
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN profiles p ON u.id = p.user_id
      JOIN categories c ON r.category_id = c.id
      WHERE r.status = 'confirmed'
    `;
    const params: any[] = [];

    if (categoryId) {
      sql += ` AND r.category_id = $${params.length + 1}`;
      params.push(categoryId);
    }

    if (search) {
      sql += ` AND (u.email ILIKE $${params.length + 1} OR u.first_name ILIKE $${params.length + 1} OR u.last_name ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    return successResponse({
      registrations: result.rows,
      count: result.rows.length,
      total: result.rows.length < limit ? offset + result.rows.length : offset + result.rows.length,
    });
  } catch (error) {
    console.error('Registrations fetch error:', error);
    return serverError('Fehler beim Laden der Anmeldungen');
  }
}
