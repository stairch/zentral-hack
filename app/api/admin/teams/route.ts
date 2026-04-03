import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { withCategoryPartnerAuth, AuthenticatedRequest } from '@/lib/middleware';
import { successResponse, validationError, serverError } from '@/lib/api';

async function handleGet(req: AuthenticatedRequest) {
  try {
    const categoryId = req.user?.categoryId;
    
    if (!categoryId && req.user?.role !== 'admin') {
      return validationError('Category ID required');
    }

    const filter = categoryId ? 'WHERE teams.category_id = $1' : '';
    const params = categoryId ? [categoryId] : [];

    const result = await query(
      `SELECT teams.id, teams.name, teams.description, teams.category_id,
              c.name as category_name,
              COUNT(DISTINCT team_members.id) as member_count,
              teams.created_at
       FROM teams
       LEFT JOIN team_members ON teams.id = team_members.team_id
       JOIN categories c ON teams.category_id = c.id
       ${filter}
       GROUP BY teams.id, c.name
       ORDER BY teams.created_at DESC`,
      params
    );

    return successResponse({ teams: result.rows });
  } catch (error) {
    console.error('[Teams] GET Error:', error);
    return serverError();
  }
}

async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const { name, description, categoryId } = body;

    if (!name || !categoryId) {
      return validationError('Name and category required');
    }

    if (req.user?.role === 'category_partner' && req.user.categoryId !== categoryId) {
      return validationError('Cannot create teams in other categories');
    }

    const catResult = await query('SELECT name FROM categories WHERE id = $1', [categoryId]);
    const categoryName = catResult.rows[0]?.name || '';

    const result = await query(
      'INSERT INTO teams (name, description, category_id, created_by) VALUES ($1, $2, $3, $4) RETURNING id, name, description, category_id, created_at',
      [name, description || null, categoryId, req.user?.userId]
    );

    return successResponse({
      team: { ...result.rows[0], category_name: categoryName, member_count: 0 }
    }, 201);
  } catch (error) {
    console.error('[Teams] POST Error:', error);
    return serverError();
  }
}

async function handleDelete(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('id');

    if (!teamId) return validationError('Team ID required');

    // Verify access
    if (req.user?.role === 'category_partner') {
      const teamCheck = await query('SELECT category_id FROM teams WHERE id = $1', [teamId]);
      if (teamCheck.rows.length === 0) return validationError('Team not found');
      if (teamCheck.rows[0].category_id !== req.user.categoryId) {
        return validationError('Cannot delete teams from other categories');
      }
    }

    await query('DELETE FROM teams WHERE id = $1', [teamId]);
    return successResponse({ message: 'Team deleted' });
  } catch (error) {
    console.error('[Teams] DELETE Error:', error);
    return serverError();
  }
}

export const GET = withCategoryPartnerAuth(handleGet);
export const POST = withCategoryPartnerAuth(handlePost);
export const DELETE = withCategoryPartnerAuth(handleDelete);
