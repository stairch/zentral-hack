import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, serverError } from '@/lib/api';
import { verifyJWT } from '@/lib/auth';
import { z } from 'zod';

const githubLinkSchema = z.object({
  repositoryUrl: z.string().url('Ungültige URL').regex(/github\.com/, 'Muss eine GitHub URL sein'),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

/**
 * POST /api/teams/[teamId]/github
 * Add GitHub repository link to team
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const teamId = params.teamId;

    // Verify user is team member or admin
    const memberCheck = await query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, payload.userId]
    );

    if (memberCheck.rows.length === 0 && payload.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Not a team member' }), { status: 403 });
    }

    const body = await request.json();
    const validation = githubLinkSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Validierungsfehler', details: validation.error.flatten() }),
        { status: 400 }
      );
    }

    const { repositoryUrl, title, description } = validation.data;

    // Insert GitHub link
    const result = await query(
      `INSERT INTO team_github_repos (team_id, repository_url, title, description, added_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, repository_url, title, description, created_at`,
      [teamId, repositoryUrl, title || null, description || null, payload.userId]
    );

    return successResponse({
      repo: result.rows[0],
      message: 'GitHub repository link added successfully',
    }, 201);
  } catch (error) {
    console.error('GitHub link error:', error);
    return serverError('Fehler beim Hinzufügen des GitHub-Links');
  }
}

/**
 * GET /api/teams/[teamId]/github
 * List GitHub repositories for team
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = params.teamId;

    const result = await query(
      `SELECT id, repository_url, title, description, created_at
       FROM team_github_repos
       WHERE team_id = $1
       ORDER BY created_at DESC`,
      [teamId]
    );

    return successResponse({
      repos: result.rows,
    });
  } catch (error) {
    console.error('GitHub repos fetch error:', error);
    return serverError('Fehler beim Laden der GitHub-Links');
  }
}

/**
 * DELETE /api/teams/[teamId]/github/[repoId]
 * Remove GitHub repository link
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string; repoId: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { teamId, repoId } = params;

    // Verify ownership
    const repo = await query(
      'SELECT added_by FROM team_github_repos WHERE id = $1 AND team_id = $2',
      [repoId, teamId]
    );

    if (repo.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Repository not found' }), { status: 404 });
    }

    if (repo.rows[0].added_by !== payload.userId && payload.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    // Delete
    await query('DELETE FROM team_github_repos WHERE id = $1', [repoId]);

    return successResponse({ message: 'Repository deleted successfully' });
  } catch (error) {
    console.error('GitHub delete error:', error);
    return serverError('Fehler beim Löschen des GitHub-Links');
  }
}
