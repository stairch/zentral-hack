import { NewsletterSubscribersPage } from "@/components/admin/newsletter-subscribers-page"
import { adminNewsletterFlag } from "@/lib/flags"
import ComingSoon from "@/components/ui/coming-soon"

export default async function AdminNewsletterPage() {
  const showNewsletter = await adminNewsletterFlag()

  if (!showNewsletter) {
    return <ComingSoon />
  }

  return <NewsletterSubscribersPage />
}
