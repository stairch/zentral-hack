import AdminSidebarInner from "./admin-sidebar-inner"
import { adminDocumentsFlag } from "@/lib/flags"

const adminFeatureFlags = [{ id: "documents", featureFlag: adminDocumentsFlag }]

export default async function AdminSidebar() {
  const items = await Promise.all(
    adminFeatureFlags.map(async (e) => ({
      id: e.id,
      isReleased: e.featureFlag ? await e.featureFlag() : true
    }))
  )

  return <AdminSidebarInner releasedItems={items} />
}
