import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable experimental features for Next.js 15
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': ['@svgr/webpack'],
    },
    root: __dirname,
  },

  // Performance optimizations
  poweredByHeader: false,
  reactStrictMode: true,

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig