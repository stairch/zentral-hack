import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware';
import { sendCampaignEmail, sendEmail } from '@/lib/email';
import { successResponse, validationError, serverError } from '@/lib/api';
import { renderEmailTemplate } from '@/lib/email-templates';

async function handler(req: AuthenticatedRequest) {
  try {
    if (req.method === 'POST') {
      const body = await req.json();
      const { subject, content, templateId, ctaText, ctaUrl, footerNote, campaignType, categoryId, testEmail } = body;

      if (!subject || !content) {
        return validationError('Betreff und Inhalt erforderlich');
      }

      // Build HTML from template or use raw content as fallback
      let htmlContent: string;
      if (templateId) {
        try {
          htmlContent = renderEmailTemplate(templateId, {
            subject,
            content,
            ctaText: ctaText || undefined,
            ctaUrl: ctaUrl || undefined,
            footerNote: footerNote || undefined,
          });
        } catch {
          return validationError('Ungültige Vorlage');
        }
      } else {
        htmlContent = body.htmlContent || content;
      }

      // ── Test email mode ──
      if (testEmail) {
        await sendEmail({
          to: testEmail,
          subject: `[TEST] ${subject}`,
          html: htmlContent,
          text: content,
        });
        return successResponse({
          message: `Test-E-Mail an ${testEmail} gesendet`,
          testEmail,
        });
      }

      // ── Campaign mode ──
      if (!campaignType) {
        return validationError('Kampagnentyp erforderlich');
      }

      let recipients: string[] = [];

      if (campaignType === 'participants') {
        if (!categoryId) {
          return validationError('Kategorie erforderlich für Teilnehmer-E-Mails');
        }
        const result = await query(
          'SELECT DISTINCT users.email FROM users JOIN registrations ON users.id = registrations.user_id WHERE registrations.category_id = $1',
          [categoryId]
        );
        recipients = result.rows.map((r: { email: string }) => r.email);
      } else if (campaignType === 'newsletter_subscribers') {
        const subscribersResult = await query('SELECT email FROM newsletter_subscribers WHERE subscribed = true');
        recipients = subscribersResult.rows.map((r: { email: string }) => r.email);
      } else if (campaignType === 'central_updates') {
        const registeredResult = await query('SELECT DISTINCT email FROM users WHERE role = $1', ['user']);
        const subscribersResult = await query('SELECT email FROM newsletter_subscribers WHERE subscribed = true');
        recipients = [
          ...registeredResult.rows.map((r: { email: string }) => r.email),
          ...subscribersResult.rows.map((r: { email: string }) => r.email),
        ];
        recipients = [...new Set(recipients)];
      }

      if (recipients.length === 0) {
        return validationError('Keine Empfänger gefunden');
      }

      const result = await query(
        'INSERT INTO email_campaigns (subject, content, html_content, campaign_type, category_id, created_by, sent_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id',
        [subject, content, htmlContent, campaignType, categoryId || null, req.user?.userId ?? null]
      );

      await sendCampaignEmail(recipients, subject, htmlContent);

      return successResponse({
        campaignId: result.rows[0].id,
        recipientCount: recipients.length,
        message: `E-Mail an ${recipients.length} Empfänger versendet`,
      });
    }

    return validationError('Method not allowed');
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export const POST = withAdminAuth(handler);
