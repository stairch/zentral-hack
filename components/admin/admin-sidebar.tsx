"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  Sparkles,
  MessageSquare,
  UserCog,
  HelpCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/registrations", label: "Anmeldungen", icon: Users },
  { href: "/admin/users", label: "Benutzer", icon: UserCog },
  { href: "/admin/teams", label: "Teams", icon: Users },
  { href: "/admin/documents", label: "Dokumente", icon: FolderOpen },
  { href: "/admin/categories", label: "Kategorien", icon: Sparkles },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/emails", label: "E-Mails & Kampagnen", icon: Mail },
  { href: "/admin/newsletter", label: "Newsletter Abonnenten", icon: Mail },
  { href: "/admin/sponsors", label: "Sponsoren", icon: MessageSquare }
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push("/")
    router.refresh()
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="border-border border-b p-6">
        <Link href="/" className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          <span className="text-[#530A5D]">ZENTRAL</span>{" "}
          <span className="bg-[#530A5D] px-2 text-[#E6FF17]">HACK</span>
        </Link>
        <p className="text-muted-foreground mt-1 text-xs">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#530A5D] text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-border border-t p-4">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground w-full justify-start gap-3"
          onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          Abmelden
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="bg-card border-border hidden border-r lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <header className="bg-card border-border fixed top-0 right-0 left-0 z-40 flex items-center justify-between border-b px-4 py-3 lg:hidden">
        <Link href="/" className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
          <span className="text-[#530A5D]">ZENTRAL</span>{" "}
          <span className="bg-[#530A5D] px-1 text-[#E6FF17]">HACK</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}>
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-card fixed inset-y-0 left-0 flex w-64 flex-col"
              onClick={(e) => e.stopPropagation()}>
              <NavContent />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for mobile header */}
      <div className="h-16 lg:hidden" />
    </>
  )
}
