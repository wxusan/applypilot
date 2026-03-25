/** @type {import('next').NextConfig} */

// The Python backend URL — never exposed to the browser.
// Locally: http://localhost:8000
// Production: set BACKEND_URL in your Vercel environment variables.
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

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
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  /**
   * Proxy all backend API calls through Next.js so the browser never makes
   * cross-origin requests (eliminates CORS "Failed to fetch" issues for
   * DELETE, PATCH, and preflighted POST requests).
   *
   * How it works:
   *  Browser → GET /api/students         (relative, same-origin)
   *  Next.js → forwards to http://localhost:8000/api/students
   *  Response flows back through Next.js → browser (no CORS needed)
   *
   * Next.js processes rewrites AFTER its own /api/* routes, so our
   * /api/auth/* API routes are NOT affected by these rewrites.
   */
  async rewrites() {
    return {
      // afterFiles: checked after Next.js pages/API routes.
      // Our /api/auth/* Next.js routes take priority; everything else is proxied.
      afterFiles: [
        { source: '/api/super-admin/:path*', destination: `${BACKEND_URL}/api/super-admin/:path*` },
        { source: '/api/students/:path*',    destination: `${BACKEND_URL}/api/students/:path*` },
        { source: '/api/applications/:path*',destination: `${BACKEND_URL}/api/applications/:path*` },
        { source: '/api/documents/:path*',   destination: `${BACKEND_URL}/api/documents/:path*` },
        { source: '/api/emails/:path*',      destination: `${BACKEND_URL}/api/emails/:path*` },
        { source: '/api/essays/:path*',      destination: `${BACKEND_URL}/api/essays/:path*` },
        { source: '/api/deadlines/:path*',   destination: `${BACKEND_URL}/api/deadlines/:path*` },
        { source: '/api/admin/:path*',       destination: `${BACKEND_URL}/api/admin/:path*` },
        { source: '/api/agent-jobs/:path*',  destination: `${BACKEND_URL}/api/agent-jobs/:path*` },
        { source: '/api/settings/:path*',    destination: `${BACKEND_URL}/api/settings/:path*` },
        { source: '/api/audit/:path*',       destination: `${BACKEND_URL}/api/audit/:path*` },
        { source: '/api/agents/:path*',      destination: `${BACKEND_URL}/api/agents/:path*` },
        { source: '/api/staff/:path*',       destination: `${BACKEND_URL}/api/staff/:path*` },
        { source: '/api/billing/:path*',     destination: `${BACKEND_URL}/api/billing/:path*` },
        { source: '/api/reports/:path*',     destination: `${BACKEND_URL}/api/reports/:path*` },
        { source: '/api/contacts/:path*',    destination: `${BACKEND_URL}/api/contacts/:path*` },
        // Catch-all for any other /api/* not matched above and not a Next.js route
        { source: '/api/:path*',             destination: `${BACKEND_URL}/api/:path*` },
      ],
    }
  },
}

module.exports = nextConfig
