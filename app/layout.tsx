import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { AuthProvider } from "@/lib/auth-context"
import { LanguageProvider } from "@/lib/language-context"
import { Toaster } from "sonner"
import "./globals.css"

const usual = localFont({
  src: [
    { path: "../public/fonts/usual/Light.otf", weight: "300", style: "normal" },
    { path: "../public/fonts/usual/Light Italic.otf", weight: "300", style: "italic" },
    { path: "../public/fonts/usual/Regular.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/usual/Italic.otf", weight: "400", style: "italic" },
    { path: "../public/fonts/usual/Medium.otf", weight: "500", style: "normal" },
    { path: "../public/fonts/usual/Medium Italic.otf", weight: "500", style: "italic" },
    { path: "../public/fonts/usual/Bold.otf", weight: "700", style: "normal" },
    { path: "../public/fonts/usual/Bold Italic.otf", weight: "700", style: "italic" },
    { path: "../public/fonts/usual/ExtraBold.otf", weight: "800", style: "normal" },
    { path: "../public/fonts/usual/ExtraBold Italic.otf", weight: "800", style: "italic" }
  ],
  variable: "--font-usual"
})

export const metadata: Metadata = {
  title: "Zentral Hack 2026 | Hackathon für die Zentralschweiz",
  description:
    "Der grösste Hackathon der Zentralschweiz. 23.-24. Oktober 2026 an der HSLU. Innovation, Nachwuchs und Networking verbinden.",
  keywords: ["Hackathon", "Zentralschweiz", "HSLU", "Innovation", "Tech", "AI", "Coding"],
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)"
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)"
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml"
      }
    ],
    apple: "/apple-icon.png"
  }
}

export const viewport: Viewport = {
  themeColor: "#530A5D"
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <body className={`${usual.variable} font-sans antialiased`}>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
        <Toaster />
      </body>
    </html>
  )
}
