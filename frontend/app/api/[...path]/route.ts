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
  for (const [key, value] of req.headers.entries()) {
    const lower = key.toLowerCase()
    if (['host', 'connection', 'transfer-encoding', 'te'].includes(lower)) continue
    forwardHeaders.set(key, value)
  }

  let upstreamRes: Response
  try {
    // Use redirect:'manual' so we can re-issue with the original headers.
    // redirect:'follow' is unsafe because Node.js fetch drops the
    // Authorization header on redirects — which FastAPI triggers for every
    // trailing-slash normalisation (redirect_slashes=True). Without this fix,
    // routes like GET /api/reports return 403 because the auth header is
    // silently stripped before the request reaches the protected endpoint.
    upstreamRes = await fetch(targetURL, {
      method: req.method,
      headers: forwardHeaders,
      body: body ? Buffer.from(body) : undefined,
      // @ts-ignore — Node 18 fetch supports this
      duplex: hasBody ? 'half' : undefined,
      redirect: 'manual',
    })

    // Re-issue to the redirect Location with all original headers preserved.
    if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
      const location = upstreamRes.headers.get('location')
      if (location) {
        const redirectURL = location.startsWith('http') ? location : `${backendURL}${location}`
        upstreamRes = await fetch(redirectURL, {
          method: req.method,
          headers: forwardHeaders,
          body: body ? Buffer.from(body) : undefined,
          // @ts-ignore
          duplex: hasBody ? 'half' : undefined,
          redirect: 'manual',
        })
      }
    }
  } catch (err) {
    console.error('[proxy] fetch failed:', targetURL, err)
    return NextResponse.json({ detail: 'Backend unreachable' }, { status: 502 })
  }

  // Stream the response back
  const responseHeaders = new Headers()
  for (const [key, value] of upstreamRes.headers.entries()) {
    const lower = key.toLowerCase()
    // Don't forward hop-by-hop headers
    if (['connection', 'transfer-encoding', 'keep-alive', 'upgrade'].includes(lower)) continue
    responseHeaders.set(key, value)
  }

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
