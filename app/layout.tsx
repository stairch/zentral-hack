import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Inter, Space_Grotesk, Geist_Mono } from "next/font/google"
import { AuthProvider } from "@/lib/auth-context"
import { LanguageProvider } from "@/lib/language-context"
import { Toaster } from "@/components/ui/sonner"
import { ChatWidget } from "@/components/chat/chat-widget"
import { headers } from "next/headers"
import { EVENT_PHASE_HEADER, type EventPhase } from "@/lib/event-phase"
import { EventPhaseProvider } from "@/lib/event-phase-context"
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
    "Der grösste Hackathon der Zentralschweiz. 23.-24. Oktober 2026 an der HSLU. Innovation, Nachwuchs und Networking verbinden. Unterstützt von Kanton Schwyz, OpenAI, Kanton Luzern und weiteren Sponsoren.",
  keywords: [
    "Hackathon",
    "Zentralschweiz",
    "HSLU",
    "Kanton Schwyz",
    "OpenAI",
    "Kanton Luzern",
    "Rotkreuz",
    "HSLU Informatik",
    "Informatik",
    "Innovation",
    "Tech",
    "AI",
    "Coding"
  ],
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

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const phase: EventPhase = (await headers()).get(EVENT_PHASE_HEADER) === "post" ? "post" : "live"

  return (
    <html lang="de">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${geistMono.variable} font-sans antialiased`}>
        <LanguageProvider>
          <EventPhaseProvider phase={phase}>
            <AuthProvider>
              {children}
              <ChatWidget />
            </AuthProvider>
          </EventPhaseProvider>
        </LanguageProvider>
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
