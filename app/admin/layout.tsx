import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyJWT } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export const metadata = {
  title: "Admin | Zentral Hack 2026",
  description: "Admin Dashboard für den Zentral Hack 2026"
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    console.log("[AdminLayout] No token found, redirecting to login")
    redirect("/auth/login")
  }

  const payload = verifyJWT(token)

  if (!payload) {
    console.log("[AdminLayout] Invalid token payload, redirecting to login")
    redirect("/auth/login")
  }

  if (payload.role !== "admin" && payload.role !== "category_partner") {
    console.log("[AdminLayout] User role not admin/category_partner, redirecting to dashboard:", payload.role)
    redirect("/dashboard")
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <AdminSidebar />
      <main className="lg:pl-64">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  )
}
