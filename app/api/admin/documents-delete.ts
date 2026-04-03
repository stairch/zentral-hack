import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, serverError } from '@/lib/api';
import { verifyJWT } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';

/**
 * DELETE /api/admin/documents/[id]
 * Deletes a document (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin only' }), { status: 401 });
    }

    const docId = params.id;

    // Get document info
    const result = await query(
      'SELECT file_path FROM category_documents WHERE id = $1',
      [docId]
    );

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Document not found' }), { status: 404 });
    }

    const filePath = result.rows[0].file_path;

    // Delete file from disk
    try {
      const fullPath = join(process.cwd(), 'public', filePath);
      await unlink(fullPath);
    } catch (e) {
      console.warn('File deletion failed, continuing with DB deletion:', e);
    }

    // Delete from database
    await query(
      'DELETE FROM category_documents WHERE id = $1',
      [docId]
    );

    return successResponse({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Document deletion error:', error);
    return serverError('Fehler beim Löschen des Dokuments');
  }
}
