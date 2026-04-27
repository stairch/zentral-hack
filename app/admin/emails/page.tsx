import { EmailManagementPage } from "@/components/admin/email-management"
import { adminEmailsFlag } from "@/lib/flags"
import ComingSoon from "@/components/ui/coming-soon"

export default async function AdminEmailsPage() {
  const showEmails = await adminEmailsFlag()

  if (!showEmails) {
    return <ComingSoon />
  }

  return <EmailManagementPage />
}
