"use client"

import { useState, useEffect } from "react"
import { useUnseenChangelog } from "@/hooks/use-unseen-changelog"
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
  Lock,
  ShieldCheck,
  Bug,
  ArrowLeft,
  ScrollText
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandMark } from "@/components/brand-mark"
import { DEFAULT_CATEGORY_PARTNER_PERMISSIONS } from "@/lib/admin-permissions"
import { Urls } from "@/lib/constants"

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
    backToDashboard: "Zurück",
    home: "Zentral Hack Startseite",
    bugReport: "Fehler melden",
    featureRequest: "Feature anfragen",
    changelog: "Changelog"
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
    backToDashboard: "Back",
    home: "Zentral Hack Home",
    bugReport: "Report bug",
    featureRequest: "Request feature",
    changelog: "Changelog"
  }
} as const

interface AdminSidebarPropsType {
  releasedItems: { id: string; isReleased: boolean }[]
}

export default function AdminSidebarInner({ releasedItems }: AdminSidebarPropsType) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuth()
  const { language, setLanguage } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // deactivate scroll when menu open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : ""
  }, [mobileMenuOpen])

  const isAdmin = user?.role === "admin"
  const text = copy[language]
  const { hasUnseen, latestEntry, isMinorOrMajor } = useUnseenChangelog()

  // permissionKey: matches admin_roles.permissions entries to gate visibility for custom-role users
  const allNavItems = [
    {
      id: "root",
      href: "/admin",
      label: text.dashboard,
      icon: LayoutDashboard,
      permissionKey: null,
      adminOnly: false
    },
    {
      id: "registrations",
      href: "/admin/registrations",
      label: text.registrations,
      icon: Users,
      permissionKey: "registrations",
      adminOnly: false
    },
    {
      id: "users",
      href: "/admin/users",
      label: text.users,
      icon: UserCog,
      permissionKey: "users",
      adminOnly: false
    },
    {
      id: "teams",
      href: "/admin/teams",
      label: text.teams,
      icon: Users,
      permissionKey: "teams",
      adminOnly: false
    },
    {
      id: "documents",
      href: "/admin/documents",
      label: text.documents,
      icon: FolderOpen,
      permissionKey: "documents",
      adminOnly: false
    },
    {
      id: "categories",
      href: "/admin/categories",
      label: text.categories,
      icon: Sparkles,
      permissionKey: "categories",
      adminOnly: false
    },
    {
      id: "challenges",
      href: "/admin/challenges",
      label: text.challenges,
      icon: Trophy,
      permissionKey: "challenges",
      adminOnly: false
    },
    {
      id: "about",
      href: "/admin/about",
      label: text.about,
      icon: BarChart3,
      permissionKey: "about",
      adminOnly: true
    },
    {
      id: "schedule",
      href: "/admin/schedule",
      label: text.schedule,
      icon: CalendarDays,
      permissionKey: "schedule",
      adminOnly: true
    },
    {
      id: "partner-logos",
      href: "/admin/partner-logos",
      label: text.partnerLogos,
      icon: Image,
      permissionKey: "partner-logos",
      adminOnly: true
    },
    {
      id: "faqs",
      href: "/admin/faqs",
      label: text.faqs,
      icon: HelpCircle,
      permissionKey: "faqs",
      adminOnly: true
    },
    {
      id: "emails",
      href: "/admin/emails",
      label: text.emails,
      icon: Mail,
      permissionKey: "emails",
      adminOnly: true
    },
    {
      id: "newsletter",
      href: "/admin/newsletter",
      label: text.newsletter,
      icon: Mail,
      permissionKey: "newsletter",
      adminOnly: true
    },
    {
      id: "sponsors",
      href: "/admin/sponsors",
      label: text.sponsors,
      icon: MessageSquare,
      permissionKey: "sponsors",
      adminOnly: true
    },
    {
      id: "roles",
      href: "/admin/roles",
      label: text.roles,
      icon: ShieldCheck,
      permissionKey: null,
      adminOnly: true
    }
  ]

  // Merge feature-flag release state into nav items
  const merged = allNavItems.map((navItem) => {
    const match = releasedItems.find((link) => link.id === navItem.id)
    return match ? { ...navItem, ...match } : { ...navItem, isReleased: true }
  })

  const navItems = merged.filter((item) => {
    if (isAdmin) return true
    // Custom-role user: sidebar driven entirely by their permissions array
    if (user?.permissions) {
      if (item.permissionKey === null) return true // dashboard + admin-only items without a key never shown
      return user.permissions.includes(item.permissionKey)
    }
    // Legacy category_partner without custom role: use default permission set
    if (user?.role === "category_partner") {
      if (item.permissionKey === null) return !item.adminOnly
      return DEFAULT_CATEGORY_PARTNER_PERMISSIONS.includes(item.permissionKey)
    }
    return !item.adminOnly
  })

  const handleLogout = async () => {
    await logout()
    router.push("/")
    router.refresh()
  }

  const handleBackToDashboard = async () => {
    router.push("/dashboard")
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="border-border border-b p-6">
        <div className="flex items-start justify-between">
          <Link href="/" className="inline-block" aria-label={text.home}>
            <BrandMark className="w-32" imageClassName="drop-shadow-sm" priority />
          </Link>
          <button
            className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 p-1 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
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
                "flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                {item.label}
              </div>
              {!item.isReleased && (
                <div
                  className={`border px-1.5 py-0.5 ${isActive ? "border-white text-white" : "text-muted-foreground border-neutral-200 bg-neutral-50"} flex items-center gap-1 rounded-sm text-xs`}>
                  <Lock className="h-3 w-3 stroke-[2.5px]" />
                </div>
              )}
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
        <div>
          <Link href={Urls.changelog} className="hover:text-primary transition-colors duration-300">
            <Button
              variant="ghost"
              size="default"
              // we need to add px-3 manually because svg is inside div
              className="text-muted-foreground hover:text-foreground w-full justify-start gap-3 px-3">
              <div className="relative">
                <ScrollText className="h-5 w-5" />
                {hasUnseen && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                  </span>
                )}
              </div>
              <span className="flex-1 text-left">{text.changelog}</span>
              {hasUnseen && isMinorOrMajor && latestEntry && (
                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                  v{latestEntry.version}
                </span>
              )}
            </Button>
          </Link>
        </div>
        <div>
          <Link
            href={Urls.featureRequest}
            target="_blank"
            className="hover:text-primary transition-colors duration-300">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground w-full justify-start gap-3">
              <MessageSquare className="h-5 w-5" />
              {text.featureRequest}
            </Button>
          </Link>
        </div>
        <div>
          <Link
            href={Urls.bugReport}
            target="_blank"
            className="hover:text-primary transition-colors duration-300">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground w-full justify-start gap-3">
              <Bug className="h-5 w-5" />
              {text.bugReport}
            </Button>
          </Link>
        </div>
        {/* Back to dashboard */}
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground w-full justify-start gap-3"
          onClick={handleBackToDashboard}>
          <ArrowLeft className="h-5 w-5" />
          {text.backToDashboard}
        </Button>
        {/* Logout */}
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
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
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
