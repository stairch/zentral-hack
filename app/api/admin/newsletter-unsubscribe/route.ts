import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, serverError } from '@/lib/api';
import { verifyJWT } from '@/lib/auth';
import { z } from 'zod';
import { getNewsletterColumnSupport } from '@/lib/newsletter-db';

const bulkUnsubscribeSchema = z.object({
  emails: z.array(z.string().email()),
});

/**
 * POST /api/admin/newsletter-unsubscribe
 * Bulk unsubscribe emails from newsletter (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin only' }), { status: 401 });
    }

    const body = await request.json();
    const validation = bulkUnsubscribeSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Validierungsfehler' }),
        { status: 400 }
      );
    }

    const { emails } = validation.data;

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Keine E-Mails angegeben' }),
        { status: 400 }
      );
    }

    const columnSupport = await getNewsletterColumnSupport();
    const sql = columnSupport.weeklyUpdatesSubscribed
      ? `UPDATE newsletter_subscribers
         SET weekly_updates_subscribed = false${columnSupport.updatedAt ? ', updated_at = NOW()' : ''}
         WHERE email = ANY($1::text[])`
      : `UPDATE newsletter_subscribers
         SET subscribed = false
         WHERE email = ANY($1::text[])`;

    const result = await query(sql, [emails]);

    return successResponse({
      unsubscribed: result.rowCount,
      message: `${result.rowCount} Abonnenten von Weekly Updates abgemeldet`,
    });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return serverError('Fehler beim Abmelden');
  }
}
