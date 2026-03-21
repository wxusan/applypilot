'use client'

/**
 * /auth/callback
 *
 * Handles the OAuth / magic-link redirect from Supabase.
 * Exchanges the authorization code for a session, then sends the user to
 * the dashboard (or a `next` query param if provided).
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase-browser'

export default function AuthCallbackPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient()
    const next = params.get('next') ?? '/dashboard'

    async function handleCallback() {
      const code = params.get('code')
      const errorParam = params.get('error')
      const errorDescription = params.get('error_description')

      if (errorParam) {
        setError(errorDescription ?? errorParam)
        return
      }

      if (!code) {
        // No code — could be a fragment-based flow; Supabase handles it automatically
        // Just check if we already have a session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.replace(next)
        } else {
          setError('No authentication code received.')
        }
        return
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        setError(exchangeError.message)
        return
      }

      router.replace(next)
    }

    handleCallback()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-[12px] p-8 w-full max-w-sm text-center shadow-sm" style={{ border: '0.5px solid #e5e7eb' }}>
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600 text-[20px]">
            ✗
          </div>
          <h1 className="text-[16px] font-semibold text-gray-900 mb-2">Authentication failed</h1>
          <p className="text-[13px] text-red-600 mb-5">{error}</p>
          <a
            href="/auth/login"
            className="inline-block h-9 px-5 rounded-[6px] text-[13px] font-medium text-white"
            style={{ backgroundColor: '#1D9E75', lineHeight: '36px' }}
          >
            Back to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#1D9E75', borderTopColor: 'transparent' }}
        />
        <p className="text-[13px] text-gray-500">Signing you in…</p>
      </div>
    </div>
  )
}
