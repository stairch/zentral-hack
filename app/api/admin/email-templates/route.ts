import { query } from "@/lib/db"
import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, serverError, validationError } from "@/lib/api"

async function handleGet(_req: AuthenticatedRequest) {
  try {
    const result = await query(
      `SELECT id, name, description, base_template_id, subject, content,
              cta_text, cta_url, footer_note, created_at, updated_at
       FROM email_templates
       ORDER BY updated_at DESC`
    )
    return successResponse({ templates: result.rows })
  } catch (error) {
    console.error("[Email Templates] GET Error:", error)
    return serverError("Failed to load templates")
  }
}

async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const { name, description, baseTemplateId, subject, content, ctaText, ctaUrl, footerNote } = body

    if (!name || !subject || !content) {
      return validationError("name, subject, and content are required")
    }

    const result = await query(
      `INSERT INTO email_templates (name, description, base_template_id, subject, content, cta_text, cta_url, footer_note, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, description, base_template_id, subject, content, cta_text, cta_url, footer_note, created_at`,
      [
        name,
        description || null,
        baseTemplateId || "standard",
        subject,
        content,
        ctaText || null,
        ctaUrl || null,
        footerNote || null,
        req.user!.userId
      ]
    )
    return successResponse({ template: result.rows[0] })
  } catch (error) {
    console.error("[Email Templates] POST Error:", error)
    return serverError("Failed to save template")
  }
}

async function handlePut(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const { id, name, description, baseTemplateId, subject, content, ctaText, ctaUrl, footerNote } = body

    if (!id) return validationError("Template ID is required")

    await query(
      `UPDATE email_templates
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           base_template_id = COALESCE($3, base_template_id),
           subject = COALESCE($4, subject),
           content = COALESCE($5, content),
           cta_text = $6,
           cta_url = $7,
           footer_note = $8,
           updated_at = NOW()
       WHERE id = $9`,
      [
        name,
        description,
        baseTemplateId,
        subject,
        content,
        ctaText || null,
        ctaUrl || null,
        footerNote || null,
        id
      ]
    )
    return successResponse({ message: "Template updated" })
  } catch (error) {
    console.error("[Email Templates] PUT Error:", error)
    return serverError("Failed to update template")
  }
}

async function handleDelete(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    if (!id) return validationError("Template ID is required")

    await query("DELETE FROM email_templates WHERE id = $1", [id])
    return successResponse({ message: "Template deleted" })
  } catch (error) {
    console.error("[Email Templates] DELETE Error:", error)
    return serverError("Failed to delete template")
  }
}

export const GET = withAdminAuth(handleGet)
export const POST = withAdminAuth(handlePost)
export const PUT = withAdminAuth(handlePut)
export const DELETE = withAdminAuth(handleDelete)
