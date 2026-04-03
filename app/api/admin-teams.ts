import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';
import { successResponse, validationError, serverError } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify user is admin or category_partner
    const userResult = await query('SELECT role, category_id FROM users WHERE id = $1', [
      payload.userId,
    ]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    if (user.role !== 'admin' && user.role !== 'category_partner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch teams
    let result;
    if (user.role === 'admin') {
      result = await query(
        `SELECT teams.id, teams.name, teams.description, teams.category_id,
                categories.name as category_name,
                COUNT(DISTINCT team_members.id) as member_count,
                teams.created_at
         FROM teams
         LEFT JOIN team_members ON teams.id = team_members.team_id
         LEFT JOIN categories ON teams.category_id = categories.id
         GROUP BY teams.id, categories.name
         ORDER BY teams.created_at DESC`
      );
    } else {
      result = await query(
        `SELECT teams.id, teams.name, teams.description, teams.category_id,
                categories.name as category_name,
                COUNT(DISTINCT team_members.id) as member_count,
                teams.created_at
         FROM teams
         LEFT JOIN team_members ON teams.id = team_members.team_id
         LEFT JOIN categories ON teams.category_id = categories.id
         WHERE teams.category_id = $1
         GROUP BY teams.id, categories.name
         ORDER BY teams.created_at DESC`,
        [user.category_id]
      );
    }

    return successResponse({ teams: result.rows });
  } catch (error) {
    console.error('Teams fetch error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify user is admin or category_partner
    const userResult = await query('SELECT role, category_id FROM users WHERE id = $1', [
      payload.userId,
    ]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    if (user.role !== 'admin' && user.role !== 'category_partner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, categoryId } = body;

    if (!name || !categoryId) {
      return validationError('Name and category required');
    }

    // Verify category_partner can only create teams in their category
    if (user.role === 'category_partner' && user.category_id !== categoryId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot create teams in other categories' },
        { status: 403 }
      );
    }

    const result = await query(
      'INSERT INTO teams (name, description, category_id, created_by) VALUES ($1, $2, $3, $4) RETURNING id, name, created_at',
      [name, description || null, categoryId, payload.userId]
    );

    return successResponse({ team: result.rows[0] }, 201);
  } catch (error) {
    console.error('Team creation error:', error);
    return serverError();
  }
}
