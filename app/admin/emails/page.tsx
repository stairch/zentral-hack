import { adminEmailsFlag } from "@/lib/flags"
import ComingSoon from "@/components/ui/coming-soon"
import ResendRedirect from "./ResendRedirect"

export default async function AdminEmailsPage() {
  const showEmails = await adminEmailsFlag()

  if (!showEmails) {
    return <ComingSoon />
  }

  return <ResendRedirect />
}
