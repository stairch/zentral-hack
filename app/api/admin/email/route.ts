import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware';
import { sendCampaignEmail } from '@/lib/email';
import { successResponse, validationError, serverError } from '@/lib/api';

async function handler(req: AuthenticatedRequest) {
  try {
    if (req.method === 'POST') {
      const body = await req.json();
      const { subject, htmlContent, campaignType, categoryId } = body;

      if (!subject || !htmlContent || !campaignType) {
        return validationError('Subject, content and type required');
      }

      let recipients: string[] = [];

      if (campaignType === 'participants') {
        if (!categoryId) {
          return validationError('Category required for participant emails');
        }
        const result = await query(
          'SELECT DISTINCT users.email FROM users JOIN registrations ON users.id = registrations.user_id WHERE registrations.category_id = $1',
          [categoryId]
        );
        recipients = result.rows.map(r => r.email);
      } else if (campaignType === 'central_updates') {
        const registeredResult = await query('SELECT DISTINCT email FROM users WHERE role = $1', ['user']);
        const subscribersResult = await query('SELECT email FROM newsletter_subscribers WHERE subscribed = true');
        recipients = [
          ...registeredResult.rows.map(r => r.email),
          ...subscribersResult.rows.map(r => r.email),
        ];
        recipients = [...new Set(recipients)];
      }

      if (recipients.length === 0) {
        return validationError('No recipients found');
      }

      const result = await query(
        'INSERT INTO email_campaigns (subject, content, html_content, campaign_type, category_id, created_by, sent_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id',
        [subject, subject, htmlContent, campaignType, categoryId || null, req.user?.userId]
      );

      await sendCampaignEmail(recipients, subject, htmlContent);

      return successResponse({
        campaignId: result.rows[0].id,
        recipientCount: recipients.length,
        message: 'Emails sent successfully',
      });
    }

    return validationError('Method not allowed');
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export const POST = withAdminAuth(handler);
