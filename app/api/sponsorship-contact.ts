import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, validationError, serverError } from '@/lib/api';
import { SponsorContactSchema, validateRequest } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateRequest(SponsorContactSchema, body);
    if (!validation.success) {
      return validationError('Validation failed', validation.errors);
    }

    const { companyName, contactName, email, phone, interestedIn, message } = validation.data;

    const result = await query(
      `INSERT INTO sponsor_contacts (company_name, contact_name, email, phone, interested_in, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [companyName, contactName, email, phone || null, interestedIn, message || null]
    );

    return successResponse({
      message: 'Sponsorship inquiry received. We will contact you soon.',
      id: result.rows[0].id,
    }, 201);
  } catch (error) {
    console.error('Sponsorship contact error:', error);
    return serverError();
  }
}
