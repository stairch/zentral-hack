import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, serverError } from '@/lib/api';
import { verifyJWT } from '@/lib/auth';
import { validateFileUpload, generateSecureFilename } from '@/lib/file-upload';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const payload = verifyJWT(token);
    if (!payload) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const teamId = request.nextUrl.searchParams.get('teamId');
    if (!teamId) return new NextResponse(JSON.stringify({ error: 'teamId parameter required' }), { status: 400 });

    const memberCheck = await query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, payload.userId]
    );

    if (memberCheck.rows.length === 0 && payload.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Not a team member' }), { status: 403 });
    }

    const result = await query(
      `SELECT id, original_name, file_path, file_size, mime_type, uploaded_by, created_at
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

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const payload = verifyJWT(token);
    if (!payload) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const teamId = request.nextUrl.searchParams.get('teamId');
    if (!teamId) return new NextResponse(JSON.stringify({ error: 'teamId parameter required' }), { status: 400 });

    const memberCheck = await query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, payload.userId]
    );

    if (memberCheck.rows.length === 0 && payload.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Not a team member' }), { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) return new NextResponse(JSON.stringify({ error: 'File required' }), { status: 400 });

    const validation = validateFileUpload(
      { name: file.name, size: file.size, type: file.type },
      'document'
    );

    if (!validation.valid) {
      return new NextResponse(JSON.stringify({ error: validation.error }), { status: 400 });
    }

    const uploadDir = join(process.cwd(), 'data', 'uploads', 'teams', teamId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const secureFileName = generateSecureFilename(file.name);
    const filePath = join(uploadDir, secureFileName);
    const relativePath = `/uploads/teams/${teamId}/${secureFileName}`;

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const result = await query(
      `INSERT INTO team_files (team_id, original_name, file_path, file_size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, original_name, file_path, file_size, created_at`,
      [teamId, file.name, relativePath, file.size, file.type, payload.userId]
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

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const payload = verifyJWT(token);
    if (!payload) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const teamId = request.nextUrl.searchParams.get('teamId');
    const fileId = request.nextUrl.searchParams.get('fileId');

    if (!teamId) return new NextResponse(JSON.stringify({ error: 'teamId parameter required' }), { status: 400 });
    if (!fileId) return new NextResponse(JSON.stringify({ error: 'fileId parameter required' }), { status: 400 });

    const memberCheck = await query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, payload.userId]
    );

    if (memberCheck.rows.length === 0 && payload.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Not a team member' }), { status: 403 });
    }

    const fileRecord = await query(
      'SELECT id, file_path FROM team_files WHERE id = $1 AND team_id = $2',
      [fileId, teamId]
    );

    if (fileRecord.rows.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'File not found' }), { status: 404 });
    }

    const file = fileRecord.rows[0];
    const filePath = join(process.cwd(), 'data', 'uploads', file.file_path.replace(/^\/uploads\//, ''));

    if (existsSync(filePath)) {
      await rm(filePath, { force: true });
    }

    await query('DELETE FROM team_files WHERE id = $1', [fileId]);

    return successResponse({
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Team file delete error:', error);
    return serverError('Fehler beim Löschen der Datei');
  }
}
