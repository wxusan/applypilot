'use client'

/**
 * /auth/accept-invite
 *
 * Supabase sends new staff members to this URL with a one-time code in the
 * query string.  We exchange that code for a session, then redirect to the
 * dashboard so the user lands already logged in and is prompted to set their
 * profile.
 */

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase-browser'

type Stage = 'loading' | 'success' | 'error'

function AcceptInviteContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [stage, setStage] = useState<Stage>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const supabase = createBrowserClient()

    async function exchange() {
      // Supabase puts the one-time token in `token_hash` + `type=invite`
      // or in the URL fragment as an access_token (older flows).
      const tokenHash = params.get('token_hash')
      const type = (params.get('type') ?? 'invite') as 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'signup'
      const code = params.get('code')

      try {
        if (tokenHash) {
          // PKCE / token_hash flow (Supabase v2 default)
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
          if (error) throw error
        } else if (code) {
          // Authorization code flow
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else {
          throw new Error('No invitation token found in the link. Please request a new invitation.')
        }

        setStage('success')
        // Give the user a moment to see the success message, then redirect to the students page
        setTimeout(() => router.replace('/students'), 1500)
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to accept invitation.')
        setStage('error')
      }
    }

    exchange()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white rounded-[12px] p-8 w-full max-w-sm text-center shadow-sm" style={{ border: '0.5px solid #e5e7eb' }}>
      {stage === 'loading' && (
        <>
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: '#1D9E75', borderTopColor: 'transparent' }}
          />
          <p className="text-[14px] text-gray-600">Accepting your invitation…</p>
        </>
      )}

      {stage === 'success' && (
        <>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-[20px]"
            style={{ backgroundColor: '#1D9E75' }}
          >
            ✓
          </div>
          <h1 className="text-[16px] font-semibold text-gray-900 mb-1">Welcome aboard!</h1>
          <p className="text-[13px] text-gray-500">Redirecting you to the dashboard…</p>
        </>
      )}

      {stage === 'error' && (
        <>
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600 text-[20px]">
            ✗
          </div>
          <h1 className="text-[16px] font-semibold text-gray-900 mb-2">Invitation failed</h1>
          <p className="text-[13px] text-red-600 mb-5">{errorMsg}</p>
          <a
            href="/login"
            className="inline-block h-9 px-5 rounded-[6px] text-[13px] font-medium text-white"
            style={{ backgroundColor: '#1D9E75', lineHeight: '36px' }}
          >
            Go to Login
          </a>
        </>
      )}
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense
        fallback={
          <div className="bg-white rounded-[12px] p-8 w-full max-w-sm text-center shadow-sm" style={{ border: '0.5px solid #e5e7eb' }}>
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
              style={{ borderColor: '#1D9E75', borderTopColor: 'transparent' }}
            />
            <p className="text-[14px] text-gray-600">Loading…</p>
          </div>
        }
      >
        <AcceptInviteContent />
      </Suspense>
    </div>
  )
}
