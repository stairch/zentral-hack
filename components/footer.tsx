"use client"

import { motion } from "framer-motion"
import { Github, Linkedin, Instagram, Mail } from "lucide-react"

const footerLinks = {
  event: [
    { label: "Über uns", href: "#about" },
    { label: "Kategorien", href: "#categories" },
    { label: "Zeitplan", href: "#schedule" },
    { label: "FAQ", href: "#faq" },
  ],
  legal: [
    { label: "Impressum", href: "#" },
    { label: "Datenschutz", href: "#" },
    { label: "AGB", href: "#" },
  ],
  social: [
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Mail, href: "mailto:info@zentralhack.ch", label: "E-Mail" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <motion.a
              href="#"
              className="inline-block font-display font-bold text-2xl mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-light-violet">ZENTRAL</span>
              <span className="text-yellow">HACK</span>
            </motion.a>
            <p className="text-muted-foreground max-w-sm leading-relaxed">
              Ein Hackathon für die Zentralschweiz. Verbindung von Bildung, Wirtschaft und Community
              für Innovation und Nachwuchsförderung.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              {footerLinks.social.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:text-yellow hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Event Links */}
          <div>
            <h4 className="font-display font-bold text-light-violet mb-4">EVENT</h4>
            <ul className="space-y-3">
              {footerLinks.event.map((link) => (
                <li key={link.label}>
                  <motion.a
                    href={link.href}
                    className="text-muted-foreground hover:text-yellow transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    {link.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-display font-bold text-light-violet mb-4">RECHTLICHES</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <motion.a
                    href={link.href}
                    className="text-muted-foreground hover:text-yellow transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    {link.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2026 Zentral Hack. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>Made with <span className="text-red-500">♥ by</span></span>
            <span className="text-light-violet font-semibold">STAIR</span>
          
          </div>
        </div>
      </div>
    </footer>
  )
}
