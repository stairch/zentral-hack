"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { BrandMark } from "@/components/brand-mark"

const navItems = {
  de: [
    { label: "Über uns", href: "/#about" },
    { label: "Kategorien", href: "/#categories" },
    { label: "Zeitplan", href: "/#schedule" },
    { label: "Partner", href: "/#partners" },
    { label: "FAQ", href: "/#faq" }
  ],
  en: [
    { label: "About", href: "/#about" },
    { label: "Categories", href: "/#categories" },
    { label: "Schedule", href: "/#schedule" },
    { label: "Partners", href: "/#partners" },
    { label: "FAQ", href: "/#faq" }
  ]
}

const copy = {
  de: {
    register: "Registrieren",
    login: "Anmelden",
    dashboard: "Dashboard",
    toggleMenu: "Menü umschalten",
    language: "Sprache"
  },
  en: {
    register: "Register",
    login: "Sign In",
    dashboard: "Dashboard",
    toggleMenu: "Toggle menu",
    language: "Language"
  }
} as const

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { language, setLanguage } = useLanguage()
  const { user } = useAuth()
  const text = copy[language]
  const items = navItems[language]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-background/80 border-border border-b shadow-sm backdrop-blur-lg" : "bg-transparent"
        }`}>
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/">
            <motion.div className="cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <BrandMark className="w-20" imageClassName="drop-shadow-sm" priority />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-4 lg:flex xl:gap-8">
            {items.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="relative h-5 overflow-hidden text-sm font-medium"
                style={{ display: "block" }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}>
                <motion.div
                  className="flex flex-col px-1"
                  initial={{ y: "0%" }}
                  whileHover={{ y: "-50%" }}
                  transition={{ type: "spring", stiffness: 600, damping: 30 }}>
                  <span className="text-foreground/80 flex h-5 items-center">{item.label}</span>
                  <span className="text-primary flex h-5 items-center">{item.label}</span>
                </motion.div>
              </motion.a>
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3">
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as "de" | "en")}
                aria-label={text.language}
                className="border-border bg-background h-9 cursor-pointer rounded-md border px-2 text-sm">
                <option value="de">DE</option>
                <option value="en">EN</option>
              </select>
              {user ? (
                <Link href="/dashboard">
                  <Button className="bg-secondary hover:bg-secondary/90 text-foreground/80 font-semibold">
                    {text.dashboard}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/anmeldung">
                    <Button className="bg-violet hover:bg-violet/90 font-semibold text-white">
                      {text.register}
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button className="bg-secondary hover:bg-secondary/90 text-foreground/80 font-semibold">
                      {text.login}
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="text-foreground cursor-pointer p-2 lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={text.toggleMenu}>
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-background fixed inset-0 z-40 lg:hidden">
            <div className="flex h-full flex-col items-center justify-center gap-8">
              {items.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className="font-display text-foreground hover:text-violet text-2xl font-bold transition-colors"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => setIsMobileMenuOpen(false)}>
                  {item.label}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex w-full flex-col gap-3 px-8">
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as "de" | "en")}
                  aria-label={text.language}
                  className="border-border bg-background h-12 cursor-pointer rounded-md border px-3 text-sm">
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                </select>
                {user ? (
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                    <Button
                      size="lg"
                      className="bg-secondary hover:bg-secondary/90 text-foreground/80 w-full font-semibold">
                      {text.dashboard}
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/anmeldung" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                      <Button
                        size="lg"
                        className="bg-violet hover:bg-violet/90 w-full font-semibold text-white">
                        {text.register}
                      </Button>
                    </Link>
                    <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                      <Button
                        size="lg"
                        className="bg-secondary hover:bg-secondary/90 text-foreground/80 w-full font-semibold">
                        {text.login}
                      </Button>
                    </Link>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
