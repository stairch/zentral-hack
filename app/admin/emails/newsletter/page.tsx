import { adminEmailsFlag } from "@/lib/flags"
import ComingSoon from "@/components/ui/coming-soon"
import { NewsletterPage } from "@/components/admin/newsletter-page"

export default async function AdminEmailNewsletterPage() {
  const showEmails = await adminEmailsFlag()

  if (!showEmails) {
    return <ComingSoon />
  }

  return <NewsletterPage />
}
