import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, serverError } from '@/lib/api';
import { verifyJWT } from '@/lib/auth';
import { validateFileUpload, generateSecureFilename } from '@/lib/file-upload';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/teams/[teamId]/files
 * Upload file to team folder (team members only)
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

    // Verify user is member of team
    const memberCheck = await query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, payload.userId]
    );

    if (memberCheck.rows.length === 0 && payload.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Not a team member' }), { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'File required' }), { status: 400 });
    }

    // Validate file
    const validation = validateFileUpload(
      {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      'document'
    );

    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
    }

    // Create team upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'teams', teamId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate secure filename
    const secureFileName = generateSecureFilename(file.name);
    const filePath = join(uploadDir, secureFileName);
    const relativePath = `/uploads/teams/${teamId}/${secureFileName}`;

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Save to database
    const result = await query(
      `INSERT INTO team_files (team_id, original_name, file_path, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, original_name, file_path, created_at`,
      [teamId, file.name, relativePath, file.size, payload.userId]
    );

    return successResponse({
      file: result.rows[0],
      message: 'File uploaded successfully',
    }, 201);
  } catch (error) {
    console.error('Team file upload error:', error);
    return serverError('Fehler beim Hochladen der Datei');
  }
}

/**
 * GET /api/teams/[teamId]/files
 * List files in team folder
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = params.teamId;

    const result = await query(
      `SELECT id, original_name, file_path, file_size, uploaded_by, created_at
       FROM team_files
       WHERE team_id = $1
       ORDER BY created_at DESC`,
      [teamId]
    );

    return successResponse({
      files: result.rows,
    });
  } catch (error) {
    console.error('Team files fetch error:', error);
    return serverError('Fehler beim Laden der Dateien');
  }
}
