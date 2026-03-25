/**
 * POST /api/auth/mark-password-set
 *
 * Called by the reset-password page after the user successfully sets their password.
 * Marks users.password_set = true so the auth callback knows they've been onboarded.
 *
 * Requires the user to be authenticated (reads session from cookies).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()

  // Get current user from session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Update via service key (bypasses RLS)
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )

  const { error: updateError } = await db
    .from('users')
    .update({ password_set: true })
    .eq('id', user.id)

  if (updateError) {
    console.error('[mark-password-set] DB error:', updateError)
    return NextResponse.json({ error: 'Failed to update account.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
