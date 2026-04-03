import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, validationError, serverError } from '@/lib/api';
import { verifyJWT } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(request: NextRequest) {
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

    // Get document ID from query params
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('id');

    if (!docId) {
      return validationError('Document ID required');
    }

    // Get document info
    const result = await query(
      'SELECT file_path, category_id FROM category_documents WHERE id = $1',
      [docId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const doc = result.rows[0];

    // Verify category_partner can only delete from their category
    if (user.role === 'category_partner' && user.category_id !== doc.category_id) {
      return NextResponse.json({ error: 'Forbidden: Cannot delete from other categories' }, { status: 403 });
    }

    // Delete file from disk
    try {
      const fullPath = join(process.cwd(), 'public', doc.file_path);
      await unlink(fullPath);
    } catch (e) {
      console.warn('File deletion failed, continuing with DB deletion:', e);
    }

    // Delete from database
    await query('DELETE FROM category_documents WHERE id = $1', [docId]);

    return successResponse({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Document deletion error:', error);
    return serverError();
  }
}
