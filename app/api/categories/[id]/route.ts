import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, serverError } from '@/lib/api';
import { verifyJWT } from '@/lib/auth';
import { buildCategorySelectClause, getAvailableCategoryColumns } from '@/lib/category-db';
import { categoryIconMap, normalizeHexColor } from '@/lib/category-config';

/**
 * PUT /api/categories/[id]
 * Updates a category (admin only)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin only' }), { status: 401 });
    }

    const { name, description, partnerName, color, icon } = await request.json();
    const { id } = await params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Category ID required' }), { status: 400 });
    }

    if (typeof name === 'string' && name.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Category name required' }), { status: 400 });
    }

    if (typeof icon === 'string' && !(icon in categoryIconMap)) {
      return new Response(JSON.stringify({ error: 'Invalid category icon' }), { status: 400 });
    }

    const availableColumns = await getAvailableCategoryColumns();
    const fieldAssignments: string[] = [];
    const values: Array<string | null> = [];

    if (typeof name === 'string') {
      values.push(name.trim());
      fieldAssignments.push(`name = $${values.length}`);
    }

    if (typeof description === 'string') {
      values.push(description.trim());
      fieldAssignments.push(`description = $${values.length}`);
    }

    if (availableColumns.has('partner_name') && typeof partnerName === 'string') {
      values.push(partnerName.trim() || null);
      fieldAssignments.push(`partner_name = $${values.length}`);
    }

    if (availableColumns.has('color') && typeof color === 'string') {
      values.push(normalizeHexColor(color));
      fieldAssignments.push(`color = $${values.length}`);
    }

    if (availableColumns.has('icon') && typeof icon === 'string') {
      values.push(icon);
      fieldAssignments.push(`icon = $${values.length}`);
    }

    if (fieldAssignments.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid category fields provided' }), { status: 400 });
    }

    fieldAssignments.push('updated_at = NOW()');
    values.push(id);

    const result = await query(
      `UPDATE categories
       SET ${fieldAssignments.join(', ')}
       WHERE id = $${values.length}
       RETURNING ${buildCategorySelectClause(availableColumns)}`,
      values
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
