import { createServerClient as _createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = cookies()

  const supabase = _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: any) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )

  // Sign out — this clears the session from Supabase and removes the cookies
  await supabase.auth.signOut()

  // Hard redirect to login — no stale cookie remains
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
  const response = NextResponse.redirect(new URL('/login', baseUrl))

  // Belt-and-suspenders: delete the cookie directly on the response too
  response.cookies.delete('sb-hhvgwniixxmawdsryrep-auth-token')
  response.cookies.delete('sb-hhvgwniixxmawdsryrep-auth-token-code-verifier')

  return response
}
