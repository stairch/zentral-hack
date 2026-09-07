export interface EmailTemplate {
  id: string
  name: string
  description: string
  /** Generates full HTML email from user-provided content sections */
  render: (params: EmailTemplateParams) => string
}

export interface EmailTemplateParams {
  subject: string
  content: string
  subjectEn?: string
  contentEn?: string
  ctaText?: string
  ctaTextEn?: string
  ctaUrl?: string
  footerNote?: string
  footerNoteEn?: string
  unsubscribeUrl?: string
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function textToHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br>")
}

// Shared styles — CD (Corporate Design) Zentral Hack
const brandColor = "#530A5D"
const accentColor = "#E6FF17"
const lightViolet = "#D5C2F7"
const backgroundColor = "#f3f1f8"
const cardColor = "#ffffff"
const textColor = "#222222"
const mutedTextColor = "#5f5a68"
const borderColor = "#ece7f5"

function brandWordmark(baseUrl: string): string {
  return `<img src="${escapeHtml(baseUrl)}/branding/logo-light.svg" alt="Zentral Hack" width="150" style="display:block;width:150px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" />`
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
  </table>`
}

function topBanner(label: string, baseUrl: string): string {
  return `<tr>
    <td style="padding:0 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brandColor};border-radius:16px 16px 0 0;overflow:hidden;">
        <tr>
          <td style="padding:26px 26px 14px;">${brandWordmark(baseUrl)}</td>
          <td align="right" style="padding:26px 26px 14px 10px;">
            <span style="display:inline-block;background:rgba(230,255,23,0.14);border:1px solid rgba(230,255,23,0.42);border-radius:999px;padding:6px 12px;color:${accentColor};font-size:11px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;font-family:'Inter','Segoe UI',Arial,sans-serif;">${escapeHtml(label)}</span>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="height:4px;background:linear-gradient(90deg,#E6FF17 0%,#D5C2F7 100%);"></td>
        </tr>
      </table>
    </td>
  </tr>`
}

interface LayoutOptions {
  label: string
  headline: string
  intro?: string
  contentHtml: string
  ctaText?: string
  ctaUrl?: string
  footerNote?: string
  englishHeadline?: string
  englishIntro?: string
  englishContentHtml?: string
  englishCtaText?: string
  englishFooterNote?: string
  unsubscribeUrl?: string
}

function wrapLayout({
  label,
  headline,
  intro,
  contentHtml,
  ctaText,
  ctaUrl,
  footerNote,
  englishHeadline,
  englishIntro,
  englishContentHtml,
  englishCtaText,
  englishFooterNote,
  unsubscribeUrl
}: LayoutOptions): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zentralhack.ch"
  const hasEnglishSection = Boolean(englishContentHtml || englishHeadline || englishIntro)

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
          ${topBanner(label, baseUrl)}
          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${cardColor};border:1px solid ${borderColor};border-top:none;border-radius:0 0 16px 16px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 26px 10px;">
                    <h1 style="margin:0;color:${brandColor};font-size:28px;line-height:1.2;font-weight:800;font-family:'Space Grotesk','Inter','Segoe UI',Arial,sans-serif;">${escapeHtml(headline)}</h1>
                  </td>
                </tr>
                ${intro ? `<tr><td style="padding:0 26px 8px;"><p style="margin:0;color:${mutedTextColor};font-size:15px;line-height:1.6;">${textToHtml(intro)}</p></td></tr>` : ""}
                <tr>
                  <td style="padding:10px 26px 8px;">
                    <div style="color:${textColor};font-size:16px;line-height:1.75;">${contentHtml}</div>
                  </td>
                </tr>
                ${ctaText && ctaUrl ? `<tr><td style="padding:0 26px 2px;">${ctaButton(ctaText, ctaUrl)}</td></tr>` : ""}
                ${footerNote ? `<tr><td style="padding:8px 26px 26px;"><p style="margin:14px 0 0;padding-top:14px;border-top:1px solid ${borderColor};color:${mutedTextColor};font-size:13px;line-height:1.6;">${textToHtml(footerNote)}</p></td></tr>` : '<tr><td style="height:20px;"></td></tr>'}
                ${
                  hasEnglishSection
                    ? `
                  <tr>
                    <td style="padding:0 26px 8px;">
                      <div style="margin-top:6px;border-top:2px dashed ${borderColor};padding-top:16px;">
                        <p style="margin:0 0 10px;color:${mutedTextColor};font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">English Version</p>
                        ${englishHeadline ? `<h2 style="margin:0 0 12px;color:${brandColor};font-size:24px;line-height:1.2;font-weight:800;font-family:'Space Grotesk','Inter','Segoe UI',Arial,sans-serif;">${escapeHtml(englishHeadline)}</h2>` : ""}
                        ${englishIntro ? `<p style="margin:0 0 10px;color:${mutedTextColor};font-size:15px;line-height:1.6;">${textToHtml(englishIntro)}</p>` : ""}
                        ${englishContentHtml ? `<div style="color:${textColor};font-size:16px;line-height:1.75;">${englishContentHtml}</div>` : ""}
                        ${englishCtaText && ctaUrl ? ctaButton(englishCtaText, ctaUrl) : ""}
                        ${englishFooterNote ? `<p style="margin:12px 0 0;padding-top:12px;border-top:1px solid ${borderColor};color:${mutedTextColor};font-size:13px;line-height:1.6;">${textToHtml(englishFooterNote)}</p>` : ""}
                      </div>
                    </td>
                  </tr>
                `
                    : ""
                }
                ${unsubscribeUrl ? `<tr><td style="padding:0 26px 22px;"><p style="margin:0;color:${mutedTextColor};font-size:12px;line-height:1.6;">Du moechtest keine Weekly Updates mehr erhalten? <a href="${escapeHtml(unsubscribeUrl)}" style="color:${brandColor};text-decoration:underline;">Weekly Updates abmelden</a>.<br>Do you want to stop receiving weekly updates? <a href="${escapeHtml(unsubscribeUrl)}" style="color:${brandColor};text-decoration:underline;">Unsubscribe from weekly updates</a>.</p></td></tr>` : ""}
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
</html>`
}

export function renderAuthCodeEmail({
  headline,
  intro,
  code,
  footerNote,
  label = "Sicherheit",
  englishHeadline,
  englishIntro,
  englishFooterNote
}: {
  headline: string
  intro: string
  code: string
  footerNote?: string
  label?: string
  englishHeadline?: string
  englishIntro?: string
  englishFooterNote?: string
}): string {
  const codeHtml = `<div style="text-align:center;margin:20px 0 8px;">
    <span style="display:inline-block;letter-spacing:0.2em;font-size:36px;font-weight:800;color:${brandColor};font-family:'Space Grotesk','Inter','Segoe UI',Arial,sans-serif;background:${lightViolet}40;border:1px solid ${borderColor};border-radius:12px;padding:16px 32px;">${escapeHtml(code)}</span>
  </div>`

  return wrapLayout({
    label,
    headline,
    intro,
    contentHtml: codeHtml,
    footerNote,
    englishHeadline,
    englishIntro,
    englishFooterNote
  })
}
