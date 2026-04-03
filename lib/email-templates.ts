/**
 * Email HTML templates for campaigns.
 * Admin enters plain text content → wrapped in styled HTML layout.
 */

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  /** Generates full HTML email from user-provided content sections */
  render: (params: EmailTemplateParams) => string;
}

export interface EmailTemplateParams {
  subject: string;
  /** Main body text (supports line breaks → <br>) */
  content: string;
  /** Optional call-to-action button */
  ctaText?: string;
  ctaUrl?: string;
  /** Optional footer note */
  footerNote?: string;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function textToHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

// Shared styles — CD (Corporate Design) Zentral Hack
const brandColor = '#530A5D';       // Primary violet
const accentColor = '#E6FF17';      // Accent yellow
const lightViolet = '#D5C2F7';      // Secondary light violet
const bgColor = '#f4f4f7';
const textColor = '#333333';

function wrapLayout(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zentral Hack</title>
</head>
<body style="margin:0;padding:0;background-color:${bgColor};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${bgColor};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          ${bodyContent}
          <!-- Footer -->
          <tr>
            <td style="padding:20px 30px;text-align:center;">
              <p style="margin:0;color:#999;font-size:12px;font-family:'Inter',sans-serif;">
                © ${new Date().getFullYear()} Zentral Hack · Zentralschweiz<br>
                <a href="\${process.env.NEXT_PUBLIC_APP_URL || 'https://zentralhack.ch'}" style="color:${brandColor};">zentralhack.ch</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:25px auto;">
    <tr>
      <td style="background-color:${accentColor};border-radius:8px;">
        <a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;padding:14px 32px;color:${brandColor};text-decoration:none;font-weight:700;font-size:16px;font-family:'Space Grotesk','Inter',sans-serif;">${escapeHtml(text)}</a>
      </td>
    </tr>
  </table>`;
}

// ── Template: Standard ──
const standardTemplate: EmailTemplate = {
  id: 'standard',
  name: 'Standard',
  description: 'Sauberes Layout mit Logo-Header und optionalem Button',
  render: ({ subject, content, ctaText, ctaUrl, footerNote }) => {
    return wrapLayout(`
      <!-- Header -->
      <tr>
        <td style="background-color:${brandColor};padding:30px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:28px;font-weight:700;letter-spacing:0.05em;font-family:'Space Grotesk','Inter',sans-serif;">
            <span style="color:#ffffff;">ZENTRAL</span> <span style="color:${accentColor};">HACK</span>
          </h1>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="background-color:#ffffff;padding:35px 30px;border-radius:0 0 12px 12px;">
          <h2 style="margin:0 0 20px;color:${brandColor};font-size:22px;font-family:'Space Grotesk','Inter',sans-serif;">${escapeHtml(subject)}</h2>
          <div style="color:${textColor};font-size:16px;line-height:1.6;">
            ${textToHtml(content)}
          </div>
          ${ctaText && ctaUrl ? ctaButton(ctaText, ctaUrl) : ''}
          ${footerNote ? `<p style="margin:25px 0 0;color:#888;font-size:13px;border-top:1px solid #eee;padding-top:15px;">${textToHtml(footerNote)}</p>` : ''}
        </td>
      </tr>
    `);
  },
};

// ── Template: Announcement ──
const announcementTemplate: EmailTemplate = {
  id: 'announcement',
  name: 'Ankündigung',
  description: 'Auffälliges Design für wichtige Ankündigungen',
  render: ({ subject, content, ctaText, ctaUrl, footerNote }) => {
    return wrapLayout(`
      <!-- Header with accent -->
      <tr>
        <td style="background:linear-gradient(135deg, ${brandColor}, #7B1FA2);padding:40px 30px;text-align:center;border-radius:12px 12px 0 0;">
          <p style="margin:0 0 8px;color:${lightViolet};font-size:14px;text-transform:uppercase;letter-spacing:0.1em;font-family:'Space Grotesk','Inter',sans-serif;">📢 Ankündigung</p>
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;font-family:'Space Grotesk','Inter',sans-serif;">${escapeHtml(subject)}</h1>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="background-color:#ffffff;padding:35px 30px;">
          <div style="color:${textColor};font-size:16px;line-height:1.6;">
            ${textToHtml(content)}
          </div>
          ${ctaText && ctaUrl ? ctaButton(ctaText, ctaUrl) : ''}
        </td>
      </tr>
      ${footerNote ? `
      <tr>
        <td style="background-color:${lightViolet}22;padding:20px 30px;border-radius:0 0 12px 12px;">
          <p style="margin:0;color:#666;font-size:13px;">💡 ${textToHtml(footerNote)}</p>
        </td>
      </tr>` : `
      <tr><td style="height:4px;background-color:${accentColor};border-radius:0 0 12px 12px;"></td></tr>`}
    `);
  },
};

// ── Template: Event Reminder ──
const eventReminderTemplate: EmailTemplate = {
  id: 'event-reminder',
  name: 'Event-Erinnerung',
  description: 'Countdown-Stil für Event-bezogene Nachrichten',
  render: ({ subject, content, ctaText, ctaUrl, footerNote }) => {
    return wrapLayout(`
      <!-- Header -->
      <tr>
        <td style="background-color:${brandColor};padding:25px 30px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:24px;font-weight:700;font-family:'Space Grotesk','Inter',sans-serif;">
            <span style="color:#ffffff;">ZENTRAL</span> <span style="color:${accentColor};">HACK</span>
          </h1>
        </td>
      </tr>
      <!-- Event badge -->
      <tr>
        <td style="background-color:#ffffff;padding:30px 30px 0;text-align:center;">
          <div style="display:inline-block;background-color:${accentColor};color:${brandColor};padding:8px 20px;border-radius:20px;font-size:14px;font-weight:700;font-family:'Space Grotesk','Inter',sans-serif;">
            🗓️ Event-Erinnerung
          </div>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="background-color:#ffffff;padding:25px 30px 35px;">
          <h2 style="margin:0 0 20px;color:${brandColor};font-size:22px;text-align:center;font-family:'Space Grotesk','Inter',sans-serif;">${escapeHtml(subject)}</h2>
          <div style="color:${textColor};font-size:16px;line-height:1.6;">
            ${textToHtml(content)}
          </div>
          ${ctaText && ctaUrl ? ctaButton(ctaText, ctaUrl) : ''}
          ${footerNote ? `<p style="margin:20px 0 0;color:#888;font-size:13px;text-align:center;">${textToHtml(footerNote)}</p>` : ''}
        </td>
      </tr>
      <tr><td style="height:4px;background-color:${accentColor};border-radius:0 0 12px 12px;"></td></tr>
    `);
  },
};

// ── Template: Update / Newsletter ──
const updateTemplate: EmailTemplate = {
  id: 'update',
  name: 'Update / Newsletter',
  description: 'Minimales Design für regelmässige Updates',
  render: ({ subject, content, ctaText, ctaUrl, footerNote }) => {
    return wrapLayout(`
      <!-- Minimal header -->
      <tr>
        <td style="background-color:#ffffff;padding:30px 30px 0;border-radius:12px 12px 0 0;">
          <table role="presentation" width="100%">
            <tr>
              <td>
                <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:0.05em;font-family:'Space Grotesk','Inter',sans-serif;">
                  <span style="color:${brandColor};">ZENTRAL</span> <span style="color:${brandColor};background:${accentColor};padding:2px 6px;">HACK</span>
                </p>
              </td>
              <td style="text-align:right;">
                <p style="margin:0;color:${lightViolet};font-size:13px;font-weight:600;">Newsletter</p>
              </td>
            </tr>
          </table>
          <hr style="border:none;border-top:2px solid ${brandColor};margin:15px 0 0;">
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="background-color:#ffffff;padding:25px 30px 35px;border-radius:0 0 12px 12px;">
          <h2 style="margin:0 0 20px;color:${brandColor};font-size:20px;font-family:'Space Grotesk','Inter',sans-serif;">${escapeHtml(subject)}</h2>
          <div style="color:${textColor};font-size:15px;line-height:1.7;">
            ${textToHtml(content)}
          </div>
          ${ctaText && ctaUrl ? ctaButton(ctaText, ctaUrl) : ''}
          ${footerNote ? `<p style="margin:20px 0 0;padding-top:15px;border-top:1px solid #eee;color:#888;font-size:13px;">${textToHtml(footerNote)}</p>` : ''}
        </td>
      </tr>
    `);
  },
};

/** All available email templates */
export const emailTemplates: EmailTemplate[] = [
  standardTemplate,
  announcementTemplate,
  eventReminderTemplate,
  updateTemplate,
];

/** Get template by ID */
export function getEmailTemplate(id: string): EmailTemplate | undefined {
  return emailTemplates.find((t) => t.id === id);
}

/** Render a template with params */
export function renderEmailTemplate(templateId: string, params: EmailTemplateParams): string {
  const template = getEmailTemplate(templateId);
  if (!template) {
    throw new Error(`Template "${templateId}" not found`);
  }
  return template.render(params);
}
