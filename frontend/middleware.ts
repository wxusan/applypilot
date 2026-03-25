import { NextResponse, type NextRequest } from 'next/server'

/**
 * Lightweight session check — reads the Supabase auth cookie directly
 * instead of calling supabase.auth.getSession(), which makes a network
 * round-trip in the Edge runtime and can cause request hangs.
 */
function hasAuthSession(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) =>
    c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const loggedIn = hasAuthSession(request)

  // Protected routes — redirect to /login if not authenticated
  const protectedPrefixes = [
    '/dashboard', '/students', '/approvals', '/analytics',
    '/settings', '/kanban', '/emails', '/staff', '/admin',
  ]
  if (!loggedIn && protectedPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in users away from / and /login → /auth/me
  // /auth/me is a server route that checks the user's role (using the
  // service key, bypassing RLS) and redirects to /admin or /dashboard.
  // IMPORTANT: Do NOT redirect if there's an ?error= param — that means
  // /auth/me already ran and hit an error (e.g. no_agency). Redirecting
  // again would cause an infinite loop (ERR_TOO_MANY_REDIRECTS).
  if (loggedIn && (pathname === '/' || pathname === '/login')) {
    const hasError = request.nextUrl.searchParams.has('error')
    if (!hasError) {
      return NextResponse.redirect(new URL('/auth/me', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
