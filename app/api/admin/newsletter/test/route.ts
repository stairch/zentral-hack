import { withAdminAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { getEmailTemplate } from "@/lib/resend"
import { renderHtml } from "@/lib/email-render"
import { sendNewsletterTestEmail } from "@/lib/transactional-emails"
import { emailSchema } from "@/lib/validation"

async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const subject = typeof body.subject === "string" ? body.subject.trim() : ""
    const templateId = typeof body.templateId === "string" ? body.templateId : ""
    const adminValues = typeof body.adminValues === "object" && body.adminValues ? body.adminValues : {}

    const parsedEmail = emailSchema.safeParse(body.to)
    if (!parsedEmail.success) return validationError("A valid recipient email is required")
    if (!subject) return validationError("Subject is required")
    if (!templateId) return validationError("Template is required")

    const to = parsedEmail.data
    const template = await getEmailTemplate(templateId)
    const html = renderHtml(template, adminValues)
    await sendNewsletterTestEmail(to, subject, html)

    return successResponse({ message: "Test email sent" })
  } catch (error) {
    console.error("[Admin Newsletter Test] POST Error:", error)
    return serverError(error instanceof Error ? error.message : undefined)
  }
}

export const POST = withAdminAuth(handlePost)
