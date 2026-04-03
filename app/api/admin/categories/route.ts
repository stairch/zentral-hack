import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withCategoryPartnerAuth, AuthenticatedRequest } from '@/lib/middleware';
import { successResponse, validationError, serverError } from '@/lib/api';
import { buildCategorySelectClause, getAvailableCategoryColumns } from '@/lib/category-db';
import { categoryIconMap, normalizeHexColor } from '@/lib/category-config';

export async function GET(request: NextRequest) {
  try {
    const availableColumns = await getAvailableCategoryColumns();
    const result = await query(
      `SELECT ${buildCategorySelectClause(availableColumns)}
       FROM categories
       WHERE is_active = true
       ORDER BY name`
    );
    return successResponse({ categories: result.rows });
  } catch (error) {
    console.error('Categories fetch error:', error);
    return serverError('Kategorien konnten nicht geladen werden');
  }
}

async function putHandler(req: AuthenticatedRequest) {
  try {
    const {
      id,
      name,
      description,
      partnerName,
      color,
      icon,
      challengeDescription,
      showChallengeDescription,
    } = await req.json();

    if (!id) {
      return validationError('Category ID required');
    }

    if (typeof name === 'string' && name.trim().length === 0) {
      return validationError('Category name required');
    }

    if (typeof icon === 'string' && !(icon in categoryIconMap)) {
      return validationError('Invalid category icon');
    }

    if (req.user?.role === 'category_partner' && req.user.categoryId !== id) {
      return validationError('Cannot edit other categories');
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

    if (
      availableColumns.has('challenge_description') &&
      (typeof challengeDescription === 'string' || challengeDescription === null)
    ) {
      const normalizedChallengeDescription =
        typeof challengeDescription === 'string'
          ? challengeDescription.trim() || null
          : null;

      values.push(normalizedChallengeDescription);
      fieldAssignments.push(`challenge_description = $${values.length}`);
    }

    if (
      availableColumns.has('show_challenge_description') &&
      typeof showChallengeDescription === 'boolean'
    ) {
      values.push(showChallengeDescription ? 'true' : 'false');
      fieldAssignments.push(`show_challenge_description = $${values.length}::boolean`);
    }

    if (fieldAssignments.length === 0) {
      return validationError('No valid category fields provided');
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
      return validationError('Category not found');
    }

    return successResponse({ category: result.rows[0] });
  } catch (error) {
    console.error('Category update error:', error);
    return serverError();
  }
}

export const PUT = withCategoryPartnerAuth(putHandler);
