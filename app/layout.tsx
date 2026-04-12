import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import "./globals.css"

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
      <body>
        {children}
      </body>
    </html>
  )
}
