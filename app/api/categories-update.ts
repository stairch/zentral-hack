import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, serverError } from '@/lib/api';
import { verifyJWT } from '@/lib/auth';

/**
 * PUT /api/categories-update
 * Updates a category (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin only' }), { status: 401 });
    }

    const { id, description } = await request.json();

    if (!id || !description || description.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'ID and description required' }), { status: 400 });
    }

    const result = await query(
      'UPDATE categories SET description = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [description, id]
    );

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Category not found' }), { status: 404 });
    }

    return successResponse({
      category: result.rows[0],
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Category update error:', error);
    return serverError('Fehler beim Aktualisieren der Kategorie');
  }
}
