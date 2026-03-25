/**
 * OAuth callback handler (Google, etc.)
 *
 * After Supabase exchanges the code for a session, we:
 *  1. Check that the user's email already exists in our `users` table.
 *     Only invited users are allowed — anyone not in the system is rejected.
 *  2. Redirect to /auth/me which handles role-based routing (super_admin → /admin, etc.)
 */

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Get the user Supabase just authenticated
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // ── Email whitelist check ──────────────────────────────────────────────
  // Only users whose email exists in our users table (i.e. invited users)
  // are allowed to log in via OAuth. Everyone else is rejected.
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: existingUser } = await db
    .from('users')
    .select('id, password_set')
    .eq('email', user.email)
    .single()

  if (!existingUser) {
    // Not an invited user — sign them out and show a clear error
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=not_invited`)
  }

  // ── Enforce mandatory password setup ──────────────────────────────────
  // New agency owners are created without a password. They must set one
  // before they can access the dashboard (even via Google).
  if (!existingUser.password_set) {
    return NextResponse.redirect(`${origin}/reset-password?reason=setup_required`)
  }

  // ── Route to the correct dashboard based on role ──────────────────────
  // /auth/me handles super_admin vs regular user logic with the service key.
  return NextResponse.redirect(`${origin}/auth/me`)
}
