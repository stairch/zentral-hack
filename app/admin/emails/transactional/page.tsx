import { adminEmailsFlag } from "@/lib/flags"
import ComingSoon from "@/components/ui/coming-soon"
import { TransactionalEmailsPage } from "@/components/admin/transactional-emails-page"

export default async function AdminEmailTransactionalPage() {
  const showEmails = await adminEmailsFlag()

  if (!showEmails) {
    return <ComingSoon />
  }

  return <TransactionalEmailsPage />
}
