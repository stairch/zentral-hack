import { query } from '@/lib/db';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware';
import { successResponse, validationError, serverError } from '@/lib/api';

async function handleGet() {
  try {
    const result = await query(
      'SELECT id, question, answer, order_position, is_active, created_at FROM faqs ORDER BY order_position ASC'
    );
    return successResponse({ faqs: result.rows });
  } catch (error) {
    console.error('[Admin FAQs] GET Error:', error);
    return serverError();
  }
}

async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const { question, answer } = body;

    if (!question?.trim() || !answer?.trim()) {
      return validationError('Frage und Antwort sind erforderlich');
    }

    const maxOrder = await query('SELECT COALESCE(MAX(order_position), 0) + 1 as next_pos FROM faqs');
    const nextPos = maxOrder.rows[0].next_pos;

    const result = await query(
      'INSERT INTO faqs (question, answer, order_position, created_by) VALUES ($1, $2, $3, $4) RETURNING id, question, answer, order_position, is_active, created_at',
      [question.trim(), answer.trim(), nextPos, req.user?.userId]
    );

    return successResponse({ faq: result.rows[0] }, 201);
  } catch (error) {
    console.error('[Admin FAQs] POST Error:', error);
    return serverError();
  }
}

async function handlePut(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const { id, question, answer, order_position, is_active } = body;

    if (!id) return validationError('FAQ ID required');

    const fields: string[] = [];
    const values: (string | number | boolean)[] = [];
    let idx = 1;

    if (question !== undefined) { fields.push('question = $' + idx); values.push(question.trim()); idx++; }
    if (answer !== undefined) { fields.push('answer = $' + idx); values.push(answer.trim()); idx++; }
    if (order_position !== undefined) { fields.push('order_position = $' + idx); values.push(order_position); idx++; }
    if (is_active !== undefined) { fields.push('is_active = $' + idx); values.push(is_active); idx++; }

    if (fields.length === 0) return validationError('No fields to update');

    fields.push('updated_at = NOW()');
    values.push(id);

    await query(
      'UPDATE faqs SET ' + fields.join(', ') + ' WHERE id = $' + idx,
      values
    );

    return successResponse({ message: 'FAQ updated' });
  } catch (error) {
    console.error('[Admin FAQs] PUT Error:', error);
    return serverError();
  }
}

async function handleDelete(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return validationError('FAQ ID required');

    await query('DELETE FROM faqs WHERE id = $1', [id]);
    return successResponse({ message: 'FAQ deleted' });
  } catch (error) {
    console.error('[Admin FAQs] DELETE Error:', error);
    return serverError();
  }
}

export const GET = withAdminAuth(handleGet);
export const POST = withAdminAuth(handlePost);
export const PUT = withAdminAuth(handlePut);
export const DELETE = withAdminAuth(handleDelete);
