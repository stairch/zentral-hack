import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withCategoryPartnerAuth, AuthenticatedRequest } from '@/lib/middleware';
import { successResponse, validationError, serverError } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const result = await query('SELECT id, name, slug, description, is_active FROM categories WHERE is_active = true ORDER BY name');
    return successResponse({ categories: result.rows });
  } catch (error) {
    console.error('Categories fetch error:', error);
    return serverError('Kategorien konnten nicht geladen werden');
  }
}

async function putHandler(req: AuthenticatedRequest) {
  try {
    const { id, description } = await req.json();

    if (!id) {
      return validationError('Category ID required');
    }

    if (req.user?.role === 'category_partner' && req.user.categoryId !== id) {
      return validationError('Cannot edit other categories');
    }

    const result = await query(
      'UPDATE categories SET description = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, description',
      [description, id]
    );

    if (result.rows.length === 0) {
      return validationError('Category not found');
    }

    return successResponse({ category: result.rows[0] });
  } catch (error) {
    console.error('Category update error:', error);
    return serverError();
  }
}

export const PUT = withCategoryPartnerAuth(putHandler);
