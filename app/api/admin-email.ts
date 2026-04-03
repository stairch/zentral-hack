import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';
import { sendCampaignEmail } from '@/lib/email';
import { successResponse, validationError, serverError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { subject, htmlContent, recipientType, categoryId } = body;

    if (!subject || !htmlContent || !recipientType) {
      return validationError('Subject, content and recipient type required');
    }

    let recipients: string[] = [];

    if (recipientType === 'all_registered') {
      // All registered users
      const result = await query('SELECT DISTINCT email FROM users WHERE role IN ($1, $2)', [
        'user',
        'category_partner',
      ]);
      recipients = result.rows.map(r => r.email);
    } else if (recipientType === 'category_registered' && categoryId) {
      // Category-specific registered users
      const result = await query(
        `SELECT DISTINCT u.email FROM users u 
         JOIN registrations r ON u.id = r.user_id 
         WHERE r.category_id = $1`,
        [categoryId]
      );
      recipients = result.rows.map(r => r.email);
    } else if (recipientType === 'newsletter_subscribers') {
      // Newsletter subscribers only
      const result = await query('SELECT email FROM newsletter_subscribers WHERE subscribed = true');
      recipients = result.rows.map(r => r.email);
    } else if (recipientType === 'central_updates') {
      // All registered + newsletter subscribers
      const registeredResult = await query(
        'SELECT DISTINCT email FROM users WHERE role IN ($1, $2)',
        ['user', 'category_partner']
      );
      const subscribersResult = await query('SELECT email FROM newsletter_subscribers WHERE subscribed = true');
      recipients = [
        ...registeredResult.rows.map(r => r.email),
        ...subscribersResult.rows.map(r => r.email),
      ];
      recipients = [...new Set(recipients)]; // Remove duplicates
    }

    if (recipients.length === 0) {
      return validationError('No recipients found');
    }

    // Save campaign to database
    const result = await query(
      'INSERT INTO email_campaigns (subject, content, html_content, campaign_type, category_id, created_by, sent_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id',
      [
        subject,
        subject,
        htmlContent,
        recipientType === 'central_updates' ? 'central_updates' : 'participants',
        categoryId || null,
        payload.userId,
      ]
    );

    // Send emails
    try {
      await sendCampaignEmail(recipients, subject, htmlContent);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue even if email fails - campaign is logged
    }

    return successResponse({
      campaignId: result.rows[0].id,
      recipientCount: recipients.length,
      message: `Email campaign created and sent to ${recipients.length} recipients`,
    });
  } catch (error) {
    console.error('Email campaign error:', error);
    return serverError();
  }
}
