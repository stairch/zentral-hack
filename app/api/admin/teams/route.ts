import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { withCategoryPartnerAuth, AuthenticatedRequest } from '@/lib/middleware';
import { successResponse, validationError, serverError } from '@/lib/api';

async function handler(req: AuthenticatedRequest) {
  try {
    if (req.method === 'GET') {
      const categoryId = req.user?.categoryId;
      
      if (!categoryId && req.user?.role !== 'admin') {
        return validationError('Category ID required');
      }

      const filter = categoryId ? 'WHERE teams.category_id = $1' : '';
      const params = categoryId ? [categoryId] : [];

      const result = await query(
        `SELECT teams.id, teams.name, teams.description, teams.category_id,
                COUNT(DISTINCT team_members.id) as member_count,
                teams.created_at
         FROM teams
         LEFT JOIN team_members ON teams.id = team_members.team_id
         ${filter}
         GROUP BY teams.id
         ORDER BY teams.created_at DESC`,
        params
      );

      return successResponse({ teams: result.rows });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { name, description, categoryId } = body;

      if (!name || !categoryId) {
        return validationError('Name and category required');
      }

      if (req.user?.role === 'category_partner' && req.user.categoryId !== categoryId) {
        return validationError('Cannot create teams in other categories');
      }

      const result = await query(
        'INSERT INTO teams (name, description, category_id, created_by) VALUES ($1, $2, $3, $4) RETURNING id, name',
        [name, description || null, categoryId, req.user?.userId]
      );

      return successResponse({ team: result.rows[0] }, 201);
    }

    return validationError('Method not allowed');
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export const GET = withCategoryPartnerAuth(handler);
export const POST = withCategoryPartnerAuth(handler);
