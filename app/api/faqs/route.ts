import { query } from '@/lib/db';
import { successResponse, serverError } from '@/lib/api';
import { buildFaqSelectClause, getAvailableFaqColumns } from '@/lib/faq-db';

export async function GET() {
  try {
    const availableColumns = await getAvailableFaqColumns();
    const result = await query(
      `SELECT ${buildFaqSelectClause(availableColumns)}
       FROM faqs
       WHERE is_active = true
       ORDER BY order_position ASC`
    );
    return successResponse({ faqs: result.rows });
  } catch (error) {
    console.error('[FAQs] GET Error:', error);
    return serverError();
  }
}
