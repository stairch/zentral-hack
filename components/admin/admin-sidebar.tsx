import AdminSidebarInner from "./admin-sidebar-inner"
import { adminDocumentsFlag, adminEmailsFlag, adminNewsletterFlag } from "@/lib/flags"

const adminFeatureFlags = [
  { id: "documents", featureFlag: adminDocumentsFlag },
  { id: "emails", featureFlag: adminEmailsFlag },
  { id: "newsletter", featureFlag: adminNewsletterFlag }
]

export default async function AdminSidebar() {
  const items = await Promise.all(
    adminFeatureFlags.map(async (e) => ({
      id: e.id,
      isReleased: e.featureFlag ? await e.featureFlag() : true
    }))
  )

  return <AdminSidebarInner releasedItems={items} />
}
