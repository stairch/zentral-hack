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
  /** Optional unsubscribe link (e.g. weekly updates opt-out) */
  unsubscribeUrl?: string;
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
const brandColor = '#530A5D';
const accentColor = '#E6FF17';
const lightViolet = '#D5C2F7';
const backgroundColor = '#f3f1f8';
const cardColor = '#ffffff';
const textColor = '#222222';
const mutedTextColor = '#5f5a68';
const borderColor = '#ece7f5';

function brandWordmark(): string {
  return `<p style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.08em;font-family:'Space Grotesk','Inter','Segoe UI',Arial,sans-serif;line-height:1.1;">
    <span style="color:#ffffff;">ZENTRAL</span> <span style="color:${accentColor};">HACK</span>
  </p>`;
}

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 8px;">
    <tr>
      <td style="background-color:${accentColor};border-radius:10px;border:1px solid #d0e500;">
        <a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;padding:14px 28px;color:${brandColor};text-decoration:none;font-weight:800;font-size:15px;letter-spacing:0.02em;font-family:'Inter','Segoe UI',Arial,sans-serif;">
          ${escapeHtml(text)}
        </a>
      </td>
    </tr>
  </table>`;
}

function topBanner(label: string): string {
  return `<tr>
    <td style="padding:0 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brandColor};border-radius:16px 16px 0 0;overflow:hidden;">
        <tr>
          <td style="padding:26px 26px 14px;">${brandWordmark()}</td>
          <td align="right" style="padding:26px 26px 14px 10px;">
            <span style="display:inline-block;background:rgba(230,255,23,0.14);border:1px solid rgba(230,255,23,0.42);border-radius:999px;padding:6px 12px;color:${accentColor};font-size:11px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;font-family:'Inter','Segoe UI',Arial,sans-serif;">${escapeHtml(label)}</span>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="height:4px;background:linear-gradient(90deg,#E6FF17 0%,#D5C2F7 100%);"></td>
        </tr>
      </table>
    </td>
  </tr>`;
}

interface LayoutOptions {
  label: string;
  headline: string;
  intro?: string;
  contentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
  unsubscribeUrl?: string;
}

function wrapLayout({ label, headline, intro, contentHtml, ctaText, ctaUrl, footerNote, unsubscribeUrl }: LayoutOptions): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zentralhack.ch';

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zentral Hack</title>
</head>
<body style="margin:0;padding:0;background-color:${backgroundColor};font-family:'Inter','Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${backgroundColor};">
    <tr>
      <td align="center" style="padding:34px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          ${topBanner(label)}
          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${cardColor};border:1px solid ${borderColor};border-top:none;border-radius:0 0 16px 16px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 26px 10px;">
                    <h1 style="margin:0;color:${brandColor};font-size:28px;line-height:1.2;font-weight:800;font-family:'Space Grotesk','Inter','Segoe UI',Arial,sans-serif;">${escapeHtml(headline)}</h1>
                  </td>
                </tr>
                ${intro ? `<tr><td style="padding:0 26px 8px;"><p style="margin:0;color:${mutedTextColor};font-size:15px;line-height:1.6;">${textToHtml(intro)}</p></td></tr>` : ''}
                <tr>
                  <td style="padding:10px 26px 8px;">
                    <div style="color:${textColor};font-size:16px;line-height:1.75;">${contentHtml}</div>
                  </td>
                </tr>
                ${ctaText && ctaUrl ? `<tr><td style="padding:0 26px 2px;">${ctaButton(ctaText, ctaUrl)}</td></tr>` : ''}
                ${footerNote ? `<tr><td style="padding:8px 26px 26px;"><p style="margin:14px 0 0;padding-top:14px;border-top:1px solid ${borderColor};color:${mutedTextColor};font-size:13px;line-height:1.6;">${textToHtml(footerNote)}</p></td></tr>` : '<tr><td style="height:20px;"></td></tr>'}
                ${unsubscribeUrl ? `<tr><td style="padding:0 26px 22px;"><p style="margin:0;color:${mutedTextColor};font-size:12px;line-height:1.6;">Du moechtest keine Weekly Updates mehr erhalten? <a href="${escapeHtml(unsubscribeUrl)}" style="color:${brandColor};text-decoration:underline;">Weekly Updates abmelden</a>.</p></td></tr>` : ''}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 30px 6px;text-align:center;">
              <p style="margin:0;color:${mutedTextColor};font-size:12px;font-family:'Inter','Segoe UI',Arial,sans-serif;line-height:1.7;">
                © ${new Date().getFullYear()} Zentral Hack · Zentralschweiz<br>
                <a href="${baseUrl}" style="color:${brandColor};text-decoration:underline;">zentralhack.ch</a>
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

// ── Template: Standard ──
const standardTemplate: EmailTemplate = {
  id: 'standard',
  name: 'Standard',
  description: 'Klares CD-Layout mit starkem Branding und ruhigem Lesefluss',
  render: ({ subject, content, ctaText, ctaUrl, footerNote, unsubscribeUrl }) => {
    return wrapLayout({
      label: 'Community Update',
      headline: subject,
      intro: 'Danke, dass du Teil der Zentral-Hack-Community bist. Hier kommt dein aktuelles Update.',
      contentHtml: textToHtml(content),
      ctaText,
      ctaUrl,
      footerNote,
      unsubscribeUrl,
    });
  },
};

// ── Template: Announcement ──
const announcementTemplate: EmailTemplate = {
  id: 'announcement',
  name: 'Ankündigung',
  description: 'Starker Fokus für wichtige News und Entscheidungen',
  render: ({ subject, content, ctaText, ctaUrl, footerNote, unsubscribeUrl }) => {
    return wrapLayout({
      label: 'Wichtige Ankuendigung',
      headline: subject,
      intro: 'Bitte nimm dir kurz Zeit fuer diese wichtige Information vom Orga-Team.',
      contentHtml: textToHtml(content),
      ctaText,
      ctaUrl,
      footerNote,
      unsubscribeUrl,
    });
  },
};

// ── Template: Event Reminder ──
const eventReminderTemplate: EmailTemplate = {
  id: 'event-reminder',
  name: 'Event-Erinnerung',
  description: 'Fokussiert auf naechste Schritte vor dem Event',
  render: ({ subject, content, ctaText, ctaUrl, footerNote, unsubscribeUrl }) => {
    const checklistHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 0;">
      <tr>
        <td style="background:${lightViolet}40;border:1px solid ${borderColor};border-radius:12px;padding:14px 14px 10px;">
          <p style="margin:0 0 8px;color:${brandColor};font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Naechste Schritte</p>
          <div style="color:${textColor};font-size:15px;line-height:1.7;">${textToHtml(content)}</div>
        </td>
      </tr>
    </table>`;

    return wrapLayout({
      label: 'Event Reminder',
      headline: subject,
      intro: 'Damit am Eventtag alles reibungslos laeuft, hier die wichtigsten Punkte auf einen Blick.',
      contentHtml: checklistHtml,
      ctaText,
      ctaUrl,
      footerNote,
      unsubscribeUrl,
    });
  },
};

// ── Template: Update / Newsletter ──
const updateTemplate: EmailTemplate = {
  id: 'update',
  name: 'Update / Newsletter',
  description: 'Editorial-Layout fuer regelmaessige Updates und Rueckblicke',
  render: ({ subject, content, ctaText, ctaUrl, footerNote, unsubscribeUrl }) => {
    const paragraphBlocks = content
      .split(/\n\s*\n/g)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => `<p style="margin:0 0 16px;">${textToHtml(block)}</p>`)
      .join('');

    return wrapLayout({
      label: 'Newsletter',
      headline: subject,
      intro: 'Kuratiert fuer dich: die wichtigsten News, Fristen und Community-Highlights.',
      contentHtml: paragraphBlocks || textToHtml(content),
      ctaText,
      ctaUrl,
      footerNote,
      unsubscribeUrl,
    });
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
