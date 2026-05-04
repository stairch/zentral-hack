import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk, Geist_Mono } from "next/font/google"
import { AuthProvider } from "@/lib/auth-context"
import { LanguageProvider } from "@/lib/language-context"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono"
})

export const metadata: Metadata = {
  title: "Zentral Hack 2026 | Hackathon für die Zentralschweiz",
  description:
    "Der grösste Hackathon der Zentralschweiz. 23.-24. Oktober 2026 an der HSLU. Innovation, Nachwuchs und Networking verbinden.",
  keywords: ["Hackathon", "Zentralschweiz", "HSLU", "Innovation", "Tech", "AI", "Coding"],
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml"
      }
    ],
    apple: "/apple-icon.svg"
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
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${geistMono.variable} font-sans antialiased`}>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
        <Toaster />
      </body>
    </html>
  )
}
