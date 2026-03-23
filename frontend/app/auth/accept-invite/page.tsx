'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase-browser'
import Link from 'next/link'

type Stage = 'loading' | 'success' | 'error'

export default function AcceptInvitePage() {
  const router = useRouter()
  const params = useSearchParams()
  const [stage, setStage] = useState<Stage>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const supabase = createBrowserClient()

    async function exchange() {
      const tokenHash = params.get('token_hash')
      const type = (params.get('type') ?? 'invite') as 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'signup'
      const code = params.get('code')

      try {
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
          if (error) throw error
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else {
          throw new Error('No invitation token found in the link. Please request a new invitation.')
        }

        setStage('success')
        setTimeout(() => router.replace('/dashboard'), 2000)
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to accept invitation.')
        setStage('error')
      }
    }

    exchange()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-fixed/20 blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-secondary-fixed/30 blur-[120px]" />
      </div>

      <div className="w-full max-w-[480px] z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/10"
              style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
            >
              <span
                className="material-symbols-outlined text-white text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                school
              </span>
            </div>
            <span className="font-headline text-2xl font-extrabold tracking-tight text-primary">
              ApplyPilot
            </span>
          </div>
          <p className="font-label text-sm text-on-surface-variant tracking-wide font-medium uppercase">
            College Consulting
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-xl p-10 shadow-[0_40px_80px_-20px_rgba(3,22,53,0.06)] border border-outline-variant/30 backdrop-blur-sm text-center">
          {stage === 'loading' && (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
              <div>
                <h1 className="font-headline text-2xl font-bold text-primary mb-2">
                  Verifying Invitation
                </h1>
                <p className="text-on-surface-variant">Please wait while we verify your invitation link...</p>
              </div>
            </div>
          )}

          {stage === 'success' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                <span
                  className="material-symbols-outlined text-emerald-600 text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>
              <div>
                <h1 className="font-headline text-3xl font-bold text-primary tracking-tight mb-2">
                  Welcome to the Team
                </h1>
                <p className="text-on-surface-variant leading-relaxed">
                  Your invitation has been accepted. Redirecting you to the dashboard...
                </p>
              </div>
            </div>
          )}

          {stage === 'error' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-error-container rounded-2xl flex items-center justify-center mx-auto">
                <span
                  className="material-symbols-outlined text-error text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  error
                </span>
              </div>
              <div>
                <h1 className="font-headline text-3xl font-bold text-primary tracking-tight mb-2">
                  Invitation Failed
                </h1>
                <p className="text-error text-sm mb-6">{errorMsg}</p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-white font-headline font-bold py-3 px-8 rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
                  style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Go to Login
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-center gap-8 items-center">
          <div className="flex items-center gap-2 text-on-surface-variant/60">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="text-[11px] font-label font-medium uppercase tracking-tighter">Secure Enterprise SSL</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-outline-variant" />
          <div className="flex items-center gap-2 text-on-surface-variant/60">
            <span className="material-symbols-outlined text-sm">support</span>
            <span className="text-[11px] font-label font-medium uppercase tracking-tighter">Help Center</span>
          </div>
        </div>
      </div>

      {/* Bottom gradient bar */}
      <div
        className="fixed bottom-0 left-0 w-full h-1 opacity-20"
        style={{ background: 'linear-gradient(to right, #031635, #1a2b4b, #515f74)' }}
      />
    </div>
  )
}
