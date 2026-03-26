'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Detects Supabase auth tokens in the URL hash (e.g. from invite/recovery emails)
 * and redirects to the appropriate page.
 * Supabase sends: /#access_token=...&type=recovery  or  /#access_token=...&type=invite
 */
export default function AuthHashRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.replace('#', ''))
    const type = params.get('type')

    if (type === 'recovery' || type === 'invite') {
      // Supabase JS already picks up the session from the hash automatically.
      // Just navigate to reset-password — it will find the active session.
      router.replace('/reset-password')
    }
  }, [router])

  return null
}
