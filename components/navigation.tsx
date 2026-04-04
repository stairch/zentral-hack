"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

const navItems = {
  de: [
    { label: "Über uns", href: "#about" },
    { label: "Kategorien", href: "#categories" },
    { label: "Zeitplan", href: "#schedule" },
    { label: "Partner", href: "#partners" },
    { label: "FAQ", href: "#faq" },
  ],
  en: [
    { label: "About", href: "#about" },
    { label: "Categories", href: "#categories" },
    { label: "Schedule", href: "#schedule" },
    { label: "Partners", href: "#partners" },
    { label: "FAQ", href: "#faq" },
  ],
}

const copy = {
  de: { register: "Anmelden", toggleMenu: "Menü umschalten", language: "Sprache" },
  en: { register: "Register", toggleMenu: "Toggle menu", language: "Language" },
} as const

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { language, setLanguage } = useLanguage()
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <motion.div
              className="font-display font-bold text-xl cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-violet">ZENTRAL</span>
              <span className="text-yellow" style={{ textShadow: "1px 1px 0px #530A5D" }}>
                HACK
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {items.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-foreground/80 hover:text-violet transition-colors relative group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3"
            >
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as "de" | "en")}
                aria-label={text.language}
                className="h-9 rounded-md border border-border bg-background px-2 text-sm"
              >
                <option value="de">DE</option>
                <option value="en">EN</option>
              </select>
              <Link href="/anmeldung">
                <Button className="bg-violet hover:bg-violet/90 text-white font-semibold">
                  {text.register}
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={text.toggleMenu}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
            className="fixed inset-0 z-40 bg-background md:hidden"
          >
            <div className="flex flex-col items-center justify-center h-full gap-8">
              {items.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className="text-2xl font-display font-bold text-foreground hover:text-violet transition-colors"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col gap-3 w-full px-8"
              >
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as "de" | "en")}
                  aria-label={text.language}
                  className="h-12 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                </select>
                <Link href="/anmeldung" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                  <Button
                    size="lg"
                    className="w-full bg-violet hover:bg-violet/90 text-white font-semibold"
                  >
                    {text.register}
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
