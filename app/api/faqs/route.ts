import { query } from '@/lib/db';
import { successResponse, serverError } from '@/lib/api';

export async function GET() {
  try {
    const result = await query(
      'SELECT id, question, answer FROM faqs WHERE is_active = true ORDER BY order_position ASC'
    );
    return successResponse({ faqs: result.rows });
  } catch (error) {
    console.error('[FAQs] GET Error:', error);
    return serverError();
  }
}
