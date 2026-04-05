"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, FileText, Mail, LogOut, Menu, X } from "lucide-react"

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const menuItems = [
    { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Teams", href: "/dashboard/admin/teams", icon: Users },
    { label: "Kategorien", href: "/dashboard/admin/categories", icon: FileText },
    { label: "Emails", href: "/dashboard/admin/email", icon: Mail }
  ]

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-card fixed top-4 left-4 z-50 cursor-pointer rounded-lg border p-2 md:hidden">
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="bg-card border-border fixed top-0 left-0 z-40 flex h-screen w-64 flex-col border-r p-4 md:relative md:z-auto md:translate-x-0">
        <h1 className="mt-12 mb-8 text-2xl font-bold md:mt-0">Admin</h1>

        <nav className="flex-1 space-y-2">
          {menuItems.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant={pathname === href ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setIsOpen(false)}>
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full justify-start text-red-600 hover:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </motion.aside>
    </>
  )
}
