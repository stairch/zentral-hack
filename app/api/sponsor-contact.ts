import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, serverError } from '@/lib/api';
import { SponsorContactSchema } from '@/lib/validation';
import { getRateLimitHandler } from '@/lib/rate-limit';

const rateLimiter = getRateLimitHandler('sponsor_contact');

/**
 * GET /api/sponsor-contact
 * Fetches all sponsorship packages (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const result = await query(
      'SELECT id, name, display_order, description, color, benefits FROM sponsor_packages ORDER BY display_order ASC'
    );

    return successResponse({
      packages: result.rows,
    });
  } catch (error) {
    console.error('Sponsor packages fetch error:', error);
    return serverError('Fehler beim Laden der Sponsorship-Pakete');
  }
}

/**
 * POST /api/sponsor-contact
 * Submits a sponsorship inquiry (rate limited)
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!rateLimiter.isAllowed(clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' }),
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = SponsorContactSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Validierungsfehler', details: validation.error.flatten() }),
        { status: 400 }
      );
    }

    const { companyName, contactName, email, phone, interestedIn, message } = validation.data;

    // Insert sponsor contact
    const result = await query(
      `INSERT INTO sponsor_contacts (company_name, contact_name, email, phone, interested_in, message, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'new')
       RETURNING id, company_name, email, created_at`,
      [companyName, contactName, email, phone || null, interestedIn, message || null]
    );

    return successResponse({
      contact: result.rows[0],
      message: 'Anfrage erfolgreich gesendet. Wir melden uns in Kürze bei Ihnen!',
    }, 201);
  } catch (error) {
    console.error('Sponsor contact error:', error);
    return serverError('Fehler beim Speichern der Anfrage');
  }
}
