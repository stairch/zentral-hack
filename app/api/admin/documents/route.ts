import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withCategoryPartnerAuth, AuthenticatedRequest } from '@/lib/middleware';
import { successResponse, validationError, serverError } from '@/lib/api';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { validateFileUpload, generateSecureFilename, validateCategoryFilePath } from '@/lib/file-upload';

async function handler(req: AuthenticatedRequest) {
  try {
    if (req.method === 'GET') {
      const categoryId = req.query?.categoryId;

      if (req.user?.role === 'category_partner' && !categoryId) {
        const result = await query(
          'SELECT id, name, description, file_path, file_size, created_at FROM category_documents WHERE category_id = $1',
          [req.user.categoryId]
        );
        return successResponse({ documents: result.rows });
      }

      if (categoryId) {
        const result = await query(
          'SELECT id, name, description, file_path, file_size, created_at FROM category_documents WHERE category_id = $1',
          [categoryId]
        );
        return successResponse({ documents: result.rows });
      }

      return validationError('Category required');
    }

    if (req.method === 'POST') {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const categoryId = formData.get('categoryId') as string;
      const name = formData.get('name') as string;

      if (!file || !categoryId || !name) {
        return validationError('File, category and name required');
      }

      // Verify user can upload to this category
      if (req.user?.role === 'category_partner' && req.user.categoryId !== categoryId) {
        return validationError('Cannot upload to other categories');
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
        'INSERT INTO category_documents (name, file_path, file_size, category_id, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, name',
        [name, relativePath, file.size, categoryId, req.user?.userId]
      );

      return successResponse({ document: result.rows[0] }, 201);
    }

    return validationError('Method not allowed');
  } catch (error) {
    console.error('Document upload error:', error);
    return serverError();
  }
}

export const GET = async (req: NextRequest) => handler(req as unknown as AuthenticatedRequest);
export const POST = withCategoryPartnerAuth(handler);
