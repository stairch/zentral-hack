import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, serverError } from '@/lib/api';
import { verifyJWT } from '@/lib/auth';

/**
 * GET /api/admin/registrations
 * Fetches all registrations with search and filter support
 * Requires admin or category_partner role
 */
export async function GET(request: NextRequest) {
  try {
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
    const status = searchParams.get('status');
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
        r.allergies,
        r.dietary_restrictions,
        r.status,
        r.created_at
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      JOIN categories c ON r.category_id = c.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    // Category partner can only see their own category
    if (payload.role === 'category_partner' && payload.categoryId) {
      sql += ` AND r.category_id = $${params.length + 1}`;
      params.push(payload.categoryId);
    }

    if (status) {
      sql += ` AND r.status = $${params.length + 1}`;
      params.push(status);
    }

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

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM registrations r JOIN users u ON r.user_id = u.id JOIN categories c ON r.category_id = c.id WHERE 1=1';
    const countParams: (string | number)[] = [];

    if (payload.role === 'category_partner' && payload.categoryId) {
      countSql += ` AND r.category_id = $${countParams.length + 1}`;
      countParams.push(payload.categoryId);
    }
    if (status) {
      countSql += ` AND r.status = $${countParams.length + 1}`;
      countParams.push(status);
    }
    if (categoryId) {
      countSql += ` AND r.category_id = $${countParams.length + 1}`;
      countParams.push(categoryId);
    }

    const countResult = await query(countSql, countParams);

    return successResponse({
      registrations: result.rows,
      count: result.rows.length,
      total: parseInt(countResult.rows[0]?.total || '0'),
    });
  } catch (error) {
    console.error('Registrations fetch error:', error);
    return serverError('Fehler beim Laden der Anmeldungen');
  }
}
