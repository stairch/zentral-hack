import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';
import { successResponse, validationError, serverError } from '@/lib/api';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { validateFileUpload, generateSecureFilename, validateCategoryFilePath } from '@/lib/file-upload';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if admin or category_partner
    const userResult = await query('SELECT role, category_id FROM users WHERE id = $1', [
      payload.userId,
    ]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Fetch documents
    let result;
    if (user.role === 'admin') {
      result = await query(
        'SELECT id, name, description, file_path, file_size, created_at FROM category_documents ORDER BY created_at DESC'
      );
    } else if (user.role === 'category_partner') {
      result = await query(
        'SELECT id, name, description, file_path, file_size, created_at FROM category_documents WHERE category_id = $1 ORDER BY created_at DESC',
        [user.category_id]
      );
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return successResponse({ documents: result.rows });
  } catch (error) {
    console.error('Documents fetch error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if admin or category_partner
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const categoryId = formData.get('categoryId') as string;
    const name = (formData.get('name') as string) || file.name;

    if (!file || !categoryId) {
      return validationError('File and category required');
    }

    // Verify category_partner can only upload to their category
    if (user.role === 'category_partner' && user.category_id !== categoryId) {
      return NextResponse.json({ error: 'Forbidden: Cannot upload to other categories' }, { status: 403 });
    }

    // Validate file upload
    const validation = validateFileUpload(
      {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      'document'
    );

    if (!validation.valid) {
      return validationError(validation.error);
    }

    // Create category-specific upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'categories', categoryId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate secure filename
    const secureFileName = generateSecureFilename(file.name);
    const filePath = join(uploadDir, secureFileName);
    const relativePath = `/uploads/categories/${categoryId}/${secureFileName}`;

    // Validate path to prevent directory traversal
    if (!validateCategoryFilePath(categoryId, filePath)) {
      return validationError('Invalid file path');
    }

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Save to database
    const result = await query(
      'INSERT INTO category_documents (name, file_path, file_size, category_id, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, created_at',
      [name, relativePath, file.size, categoryId, payload.userId]
    );

    return successResponse({ document: result.rows[0] }, 201);
  } catch (error) {
    console.error('Document upload error:', error);
    return serverError();
  }
}
