/** @type {import('next').NextConfig} */

// The Python backend URL — never exposed to the browser.
// Locally: http://localhost:8000
// Production: set BACKEND_URL in your Vercel environment variables.
// Force https:// in production so Railway's HTTP→HTTPS redirect doesn't
// leak to the browser and cause "Failed to fetch" on POST/PATCH/DELETE.
const _rawBackendURL = process.env.BACKEND_URL || 'http://localhost:8000'
const BACKEND_URL = _rawBackendURL.startsWith('http://localhost')
  ? _rawBackendURL
  : _rawBackendURL.replace(/^http:\/\//, 'https://')

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.cloudflare.com',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // No rewrites needed — app/api/[...path]/route.ts is a runtime catch-all
  // proxy that reads BACKEND_URL at request time and forces https://.
  // Keeping rewrites here causes afterFiles to intercept base-path requests
  // (/api/students) before the catch-all can handle them, leaking Railway's
  // http→https 301 redirect to the browser as a 307 → CORS "Failed to fetch".
}

module.exports = nextConfig
