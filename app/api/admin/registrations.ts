import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, serverError } from '@/lib/api';
import { verifyJWT } from '@/lib/auth';

/**
 * GET /api/admin/registrations
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
        r.category_id,
        r.status,
        r.allergies,
        r.dietary_restrictions,
        r.created_at,
        u.email,
        u.first_name,
        u.last_name,
        p.university,
        p.study_program,
        p.semester,
        c.name as category_name
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN profiles p ON u.id = p.user_id
      JOIN categories c ON r.category_id = c.id
      WHERE r.status = 'confirmed'
    `;

    const params: any[] = [];

    // Filter by category if provided
    if (categoryId) {
      sql += ` AND r.category_id = $${params.length + 1}`;
      params.push(categoryId);
    }

    // Category partners can only see their own category
    if (payload.role === 'category_partner') {
      sql += ` AND r.category_id = $${params.length + 1}`;
      params.push(payload.categoryId);
    }

    // Search by name or email
    if (search) {
      sql += ` AND (u.first_name ILIKE $${params.length + 1} OR u.last_name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get count
    let countSql = `
      SELECT COUNT(*) as count FROM registrations r
      WHERE r.status = 'confirmed'
    `;
    const countParams: any[] = [];

    if (categoryId) {
      countSql += ` AND r.category_id = $${countParams.length + 1}`;
      countParams.push(categoryId);
    }

    if (payload.role === 'category_partner') {
      countSql += ` AND r.category_id = $${countParams.length + 1}`;
      countParams.push(payload.categoryId);
    }

    if (search) {
      countSql += ` AND (
        SELECT COUNT(*) > 0 FROM users u 
        WHERE u.id = r.user_id 
        AND (u.first_name ILIKE $1 OR u.last_name ILIKE $2 OR u.email ILIKE $3)
      )`;
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0]?.count || '0');

    // Order and paginate
    sql += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    return successResponse({
      registrations: result.rows,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Registrations fetch error:', error);
    return serverError('Registrierungen konnten nicht geladen werden');
  }
}
