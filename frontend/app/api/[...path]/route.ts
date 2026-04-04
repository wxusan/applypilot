/**
 * Catch-all server-side proxy route.
 *
 * Why this exists:
 *   next.config.js rewrites bake the BACKEND_URL at BUILD time. If Vercel's
 *   env has `http://` Railway URL, the proxy follows a 301 redirect and
 *   Next.js passes the Location header back to the browser — causing CORS
 *   "Failed to fetch" on POST/PATCH/DELETE requests.
 *
 *   This route handler reads BACKEND_URL at RUNTIME, forces https://,
 *   and proxies transparently server-side. No CORS. No redirect leakage.
 *
 * Priority:
 *   Next.js App Router resolves more-specific routes first, so
 *   app/api/auth/**, app/api/contacts/route.ts, app/api/public/** etc.
 *   all still work. Only unmatched /api/* requests land here.
 */

import { NextRequest, NextResponse } from 'next/server'

function getBackendURL(): string {
  const raw = process.env.BACKEND_URL || 'http://localhost:8000'
  // Keep localhost as-is for local dev; force https:// in production
  if (raw.startsWith('http://localhost')) return raw
  return raw.replace(/^http:\/\//, 'https://')
}

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const backendURL = getBackendURL()
  const pathSegments = params.path ?? []
  const search = req.nextUrl.search ?? ''
  const targetURL = `${backendURL}/api/${pathSegments.join('/')}${search}`

  // Forward the request body for non-GET/HEAD methods
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const body = hasBody ? await req.arrayBuffer() : undefined

  // Forward relevant headers; strip host to avoid upstream rejection
  const forwardHeaders = new Headers()
  Array.from(req.headers.entries()).forEach(([key, value]) => {
    const lower = key.toLowerCase()
    if (['host', 'connection', 'transfer-encoding', 'te'].includes(lower)) return
    forwardHeaders.set(key, value)
  })

  let upstreamRes: Response
  try {
    // Follow redirects manually so the Authorization header is never dropped.
    // Node.js fetch with redirect:'follow' strips auth on cross-origin redirects.
    // Railway produces TWO redirects for routes like GET /api/reports:
    //   1. /api/reports  →  http://railway.../api/reports/  (trailing-slash, 307)
    //   2. http://...    →  https://...                     (http→https, 301)
    // We loop up to 5 times, upgrading http→https on each hop, so all headers
    // (including Authorization) reach the final endpoint intact.
    let fetchURL = targetURL
    const MAX_REDIRECTS = 5
    upstreamRes = await fetch(fetchURL, {
      method: req.method,
      headers: forwardHeaders,
      body: body ? Buffer.from(body) : undefined,
      // @ts-ignore — Node 18 fetch supports this
      duplex: hasBody ? 'half' : undefined,
      redirect: 'manual',
    })

    for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
      if (upstreamRes.status < 300 || upstreamRes.status >= 400) break
      const location = upstreamRes.headers.get('location')
      if (!location) break
      // Resolve relative URLs and always upgrade http → https (except localhost)
      let nextURL = location.startsWith('http') ? location : `${backendURL}${location}`
      if (!nextURL.startsWith('http://localhost')) {
        nextURL = nextURL.replace(/^http:\/\//, 'https://')
      }
      upstreamRes = await fetch(nextURL, {
        method: req.method,
        headers: forwardHeaders,
        body: body ? Buffer.from(body) : undefined,
        // @ts-ignore
        duplex: hasBody ? 'half' : undefined,
        redirect: 'manual',
      })
    }
  } catch (err) {
    console.error('[proxy] fetch failed:', targetURL, err)
    return NextResponse.json({ detail: 'Backend unreachable' }, { status: 502 })
  }

  // Stream the response back
  const responseHeaders = new Headers()
  Array.from(upstreamRes.headers.entries()).forEach(([key, value]) => {
    const lower = key.toLowerCase()
    // Don't forward hop-by-hop headers
    if (['connection', 'transfer-encoding', 'keep-alive', 'upgrade'].includes(lower)) return
    responseHeaders.set(key, value)
  })

  const responseBody = await upstreamRes.arrayBuffer()
  return new NextResponse(responseBody, {
    status: upstreamRes.status,
    headers: responseHeaders,
  })
}

export const GET     = proxy
export const POST    = proxy
export const PUT     = proxy
export const PATCH   = proxy
export const DELETE  = proxy
export const OPTIONS = proxy

// Prevent Next.js from caching these proxy responses
export const dynamic = 'force-dynamic'
