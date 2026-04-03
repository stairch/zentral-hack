/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Remove ignoreBuildErrors to catch issues early
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
    ];
  },
  // CORS configuration
  async rewrites() {
    return {
      beforeFiles: [],
    };
  },
}

export default nextConfig
