import type { NewsletterTemplateDetail } from "@/lib/resend"
import type { TransactionalEmailDef } from "@/lib/transactional-emails"

/** HTML-escapes a value for safe interpolation into template markup. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Escapes a string for literal use inside a `RegExp`. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Matches a `{{{tag}}}` merge tag, optionally with a `{{{tag|default}}}` fallback. */
export function mergeTagPattern(tag: string, flags = ""): RegExp {
  return new RegExp(`\\{\\{\\{\\s*${escapeRegExp(tag)}\\s*(\\|[^}]*)?\\}\\}\\}`, flags)
}

/**
 * Renders a Resend template's declared variables into its HTML: editable
 * (`admin_`-prefixed) keys take their value from `adminValues`, every other
 * variable uses its fallback. All values are HTML-escaped.
 */
export function renderHtml(template: NewsletterTemplateDetail, adminValues: Record<string, string>): string {
  let html = template.html ?? ""
  for (const variable of template.variables) {
    const raw = variable.editable
      ? (adminValues[variable.key] ?? variable.fallbackValue ?? "")
      : (variable.fallbackValue ?? "")
    html = html.replace(mergeTagPattern(variable.key, "g"), escapeHtml(raw))
  }
  return html
}

/** Replaces every `{{{tag}}}` occurrence for the given values (HTML-escaped). */
export function renderMergeTags(html: string, values: Record<string, string>): string {
  let out = html
  for (const [tag, value] of Object.entries(values)) {
    out = out.replace(mergeTagPattern(tag, "g"), escapeHtml(value))
  }
  return out
}

/**
 * Renders the final HTML for a system message: template-declared variables get
 * their fallback values, then the email's merge tags are replaced with `values`.
 * The admin preview and the real send both go through here.
 */
export function renderTransactionalHtml(
  template: NewsletterTemplateDetail,
  values: Record<string, string>
): string {
  const filtered: NewsletterTemplateDetail = {
    ...template,
    variables: template.variables.filter((variable) => !(variable.key in values))
  }
  return renderMergeTags(renderHtml(filtered, {}), values)
}

/** Admin live preview: the final render using the definition's sample values. */
export function renderTransactionalPreview(
  template: NewsletterTemplateDetail,
  def: TransactionalEmailDef
): string {
  return renderTransactionalHtml(template, def.previewValues)
}

/** Merge tags a system message injects at send time and therefore requires in its template. */
export function getRequiredTemplateVariables(def: TransactionalEmailDef): string[] {
  return Object.keys(def.previewValues)
}

/**
 * Returns the required merge tags that the given template neither declares as a
 * variable nor references via a `{{{tag}}}` placeholder in its HTML.
 */
export function findMissingTemplateVariables(
  template: NewsletterTemplateDetail,
  def: TransactionalEmailDef
): string[] {
  const html = template.html ?? ""
  return getRequiredTemplateVariables(def).filter((tag) => {
    const declared = template.variables.some((variable) => variable.key === tag)
    const referenced = mergeTagPattern(tag).test(html)
    return !declared && !referenced
  })
}
