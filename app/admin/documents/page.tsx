import { DocumentsManagementPage } from "@/components/admin/documents-page"
import { adminDocumentsFlag } from "@/lib/flags"
import ComingSoon from "@/components/ui/coming-soon"

export default async function AdminDocumentsPageRoute() {
  const showDocuments = await adminDocumentsFlag()

  if (!showDocuments) {
    return <ComingSoon />
  }

  return <DocumentsManagementPage />
}
