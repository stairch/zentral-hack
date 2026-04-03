import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const transporter = getTransporter();
    
    await transporter.sendMail({
      from: `${process.env.SMTP_FROM_NAME || 'Zentral Hack'} <${process.env.SMTP_FROM}>`,
      ...options,
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
}

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const html = `
    <h2>Bestätige deine E-Mail-Adresse</h2>
    <p>Dein Verifikationscode ist:</p>
    <h1 style="letter-spacing: 0.2em; font-size: 32px; margin: 20px 0;">${code}</h1>
    <p>Dieser Code verfällt in 15 Minuten.</p>
  `;

  return sendEmail({
    to,
    subject: 'Zentral Hack - Email Verifikation',
    html,
    text: `Dein Verifikationscode: ${code}`,
  });
}

export async function send2FACodeEmail(to: string, code: string): Promise<void> {
  const html = `
    <h2>Dein 2FA-Code für Zentral Hack</h2>
    <p>Um dich anzumelden, verwende bitte folgenden Verifizierungscode:</p>
    <h1 style="letter-spacing: 0.1em; font-size: 36px; margin: 20px 0; font-family: monospace; color: #530A5D;">${code}</h1>
    <p>Dieser Code verfällt in 15 Minuten.</p>
    <p style="color: #666; font-size: 12px;">Falls du dich nicht angemeldet hast, ignoriere diese E-Mail und ändern dein Passwort.</p>
  `;

  return sendEmail({
    to,
    subject: 'Zentral Hack - Dein 2FA Code',
    html,
    text: `Dein 2FA Code: ${code}`,
  });
}

export async function send2FAEmail(to: string, link: string): Promise<void> {
  const html = `
    <h2>Admin Zugang - Bestätige deine Identität</h2>
    <p>Um auf das Admin-Modul zuzugreifen, bestätige bitte deine Identität:</p>
    <p><a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #530A5D; color: white; text-decoration: none; border-radius: 5px;">Bestätigen</a></p>
    <p>Dieser Link verfällt in 15 Minuten.</p>
    <p style="color: #666; font-size: 12px;">Falls du diesen Link nicht angefordert hast, ignoriere diese E-Mail.</p>
  `;

  return sendEmail({
    to,
    subject: 'Zentral Hack - Admin Zugang Bestätigung',
    html,
    text: `Bestätigung erforderlich: ${link}`,
  });
}

export async function sendCampaignEmail(
  recipients: string[],
  subject: string,
  html: string
): Promise<void> {
  if (recipients.length === 0) return;

  return sendEmail({
    to: recipients,
    subject,
    html,
  });
}
