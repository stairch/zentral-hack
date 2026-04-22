import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Ensure API directories exist for App Router migration
function ensureApiDirectories() {
  const apiDir = path.join(__dirname, "app", "api")
  const dirs = [
    "categories",
    "categories/[id]",
    "admin/registrations",
    "admin/email-subscribers",
    "admin/newsletter-unsubscribe",
    "admin/dashboard-stats",
    "check-auth",
    "teams-files",
    "teams-github",
    "download-file",
    "auth/verify"
  ]

  dirs.forEach((dir) => {
    const fullPath = path.join(apiDir, dir)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true })
      console.log(`[Next.js Config] Created directory: ${dir}`)
    }
  })
}

// Run setup on config load
ensureApiDirectories()

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.1.*"],
  typescript: {
    // Remove ignoreBuildErrors to catch issues early
  },
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: []
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()"
          }
        ]
      }
    ]
  },
  // CORS configuration
  async rewrites() {
    return {
      beforeFiles: []
    }
  }
}

export default nextConfig
