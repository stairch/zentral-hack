import AdminSidebarInner from "./admin-sidebar-inner"
import { adminDocumentsFlag, adminEmailsFlag, adminNewsletterFlag, adminTeamsFlag } from "@/lib/flags"

const adminFeatureFlags = [
  { id: "documents", featureFlag: adminDocumentsFlag },
  { id: "emails", featureFlag: adminEmailsFlag },
  { id: "newsletter", featureFlag: adminNewsletterFlag },
  { id: "teams", featureFlag: adminTeamsFlag }
]

export default async function AdminSidebar() {
  const items = await Promise.all(
    adminFeatureFlags.map(async (e) => ({
      id: e.id,
      isReleased: e.featureFlag ? await e.featureFlag() : true
    }))
  )

  return <AdminSidebarInner releasedItems={items} />
"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Mail,
  LogOut,
  Menu,
  X,
  Sparkles,
  MessageSquare,
  UserCog,
  HelpCircle,
  CalendarDays,
  BarChart3,
  Image,
  Trophy,
  ShieldCheck
} from "lucide-react"
import { DEFAULT_CATEGORY_PARTNER_PERMISSIONS } from "@/lib/admin-permissions"
import { cn } from "@/lib/utils"
import { BrandMark } from "@/components/brand-mark"

const copy = {
  de: {
    dashboard: "Dashboard",
    registrations: "Anmeldungen",
    users: "Benutzer",
    teams: "Teams",
    documents: "Dokumente",
    categories: "Kategorien",
    challenges: "Challenges",
    about: "About Stats",
    schedule: "Zeitplan",
    partnerLogos: "Partner-Logos",
    faqs: "FAQs",
    emails: "E-Mails & Kampagnen",
    newsletter: "Newsletter",
    sponsors: "Sponsoren",
    roles: "Rollen",
    adminPanel: "Admin Panel",
    categoryAdmin: "Kategorien-Admin",
    logout: "Abmelden",
    home: "Zentral Hack Startseite"
  },
  en: {
    dashboard: "Dashboard",
    registrations: "Registrations",
    users: "Users",
    teams: "Teams",
    documents: "Documents",
    categories: "Categories",
    challenges: "Challenges",
    about: "About Stats",
    schedule: "Schedule",
    partnerLogos: "Partner Logos",
    faqs: "FAQs",
    emails: "Emails & Campaigns",
    newsletter: "Newsletter",
    sponsors: "Sponsors",
    roles: "Roles",
    adminPanel: "Admin Panel",
    categoryAdmin: "Category Admin",
    logout: "Log Out",
    home: "Zentral Hack Home"
  }
} as const

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuth()
  const { language, setLanguage } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAdmin = user?.role === "admin"
  const text = copy[language]

  // permissionKey: the string in admin_roles.permissions that unlocks this item for custom-role users
  const allNavItems = [
    { href: "/admin", label: text.dashboard, icon: LayoutDashboard, permissionKey: null, adminOnly: false },
    {
      href: "/admin/registrations",
      label: text.registrations,
      icon: Users,
      permissionKey: "registrations",
      adminOnly: false
    },
    { href: "/admin/users", label: text.users, icon: UserCog, permissionKey: "users", adminOnly: false },
    { href: "/admin/teams", label: text.teams, icon: Users, permissionKey: "teams", adminOnly: false },
    {
      href: "/admin/documents",
      label: text.documents,
      icon: FolderOpen,
      permissionKey: "documents",
      adminOnly: false
    },
    {
      href: "/admin/categories",
      label: text.categories,
      icon: Sparkles,
      permissionKey: "categories",
      adminOnly: false
    },
    {
      href: "/admin/challenges",
      label: text.challenges,
      icon: Trophy,
      permissionKey: "challenges",
      adminOnly: true
    },
    { href: "/admin/about", label: text.about, icon: BarChart3, permissionKey: "about", adminOnly: true },
    {
      href: "/admin/schedule",
      label: text.schedule,
      icon: CalendarDays,
      permissionKey: "schedule",
      adminOnly: true
    },
    {
      href: "/admin/partner-logos",
      label: text.partnerLogos,
      icon: Image,
      permissionKey: "partner-logos",
      adminOnly: true
    },
    { href: "/admin/faqs", label: text.faqs, icon: HelpCircle, permissionKey: "faqs", adminOnly: true },
    { href: "/admin/emails", label: text.emails, icon: Mail, permissionKey: "emails", adminOnly: true },
    {
      href: "/admin/newsletter",
      label: text.newsletter,
      icon: Mail,
      permissionKey: "newsletter",
      adminOnly: true
    },
    {
      href: "/admin/sponsors",
      label: text.sponsors,
      icon: MessageSquare,
      permissionKey: "sponsors",
      adminOnly: true
    },
    { href: "/admin/roles", label: text.roles, icon: ShieldCheck, permissionKey: null, adminOnly: true }
  ]

  const navItems = allNavItems.filter((item) => {
    if (isAdmin) return true
    // Custom-role user: sidebar driven entirely by their permissions array
    if (user?.permissions) {
      if (item.permissionKey === null) return true // dashboard always visible
      return user.permissions.includes(item.permissionKey)
    }
    // Legacy category_partner without custom role: use DEFAULT_CATEGORY_PARTNER_PERMISSIONS
    if (user?.role === "category_partner") {
      if (item.permissionKey === null) return true
      return DEFAULT_CATEGORY_PARTNER_PERMISSIONS.includes(item.permissionKey)
    }
    return !item.adminOnly
  })

  const handleLogout = async () => {
    await logout()
    router.push("/")
    router.refresh()
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="border-border border-b p-6">
        <Link href="/" className="inline-block" aria-label={text.home}>
          <BrandMark className="w-32" imageClassName="drop-shadow-sm" priority />
        </Link>
        <p className="text-muted-foreground mt-1 text-xs">{isAdmin ? text.adminPanel : text.categoryAdmin}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
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
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-border space-y-2 border-t p-4">
        {/* Language toggle */}
        <div className="flex items-center gap-2 px-1">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "de" | "en")}
            className="border-border bg-background text-muted-foreground w-full cursor-pointer rounded-md border px-3 py-2 text-sm">
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground w-full justify-start gap-3"
          onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          {text.logout}
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
        <Link href="/" className="inline-block" aria-label={text.home}>
          <BrandMark className="w-28" imageClassName="drop-shadow-sm" priority />
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
