/**
 * /auth/me — Central role-based redirect handler.
 *
 * Every login flow (email+password, Google OAuth, direct navigation)
 * funnels through here. We use the service key to bypass RLS and
 * reliably read the user's role, then redirect accordingly.
 *
 *   super_admin  → /admin
 *   agency user  → /dashboard
 *   unknown/no session → /login
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  const cookieStore = cookies()

  // 1. Get the session via the anon SSR client (reads the session cookie)
  const anonClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: any) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )

  const { data: { user } } = await anonClient.auth.getUser()

  if (!user) {
    // Use ?error=session_expired so the middleware won't redirect back
    // to /auth/me (which would cause ERR_TOO_MANY_REDIRECTS).
    return NextResponse.redirect(`${origin}/login?error=session_expired`)
  }

  // 2. Use the service key (bypasses RLS) to reliably read the role
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: profile } = await db
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'super_admin') {
    return NextResponse.redirect(`${origin}/admin`)
  }

  // 3. Regular agency user — verify they have an active agency_members row
  const { data: member } = await db
    .from('agency_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!member) {
    // Authenticated but not part of any agency — show a clear error instead of a loop
    return NextResponse.redirect(`${origin}/login?error=no_agency`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
