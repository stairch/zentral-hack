/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.1.*"],
  typescript: {
    // Remove ignoreBuildErrors to catch issues early
  },
  images: {
    localPatterns: [
      {
        pathname: "/api/sponsor-logo"
      },
      {
        pathname: "/api/partner-logo"
      }
    ],
    // Reduces Image Optimization - Transformations on Vercel
    // Images are compressed as WebP in Vercel Blob anyways
    unoptimized: true
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
  },

  turbopack: {
    rules: {
      "*.md": {
        loaders: ["raw-loader"],
        as: "*.js"
      },
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js"
      }
    }
  }
}

export default nextConfig
