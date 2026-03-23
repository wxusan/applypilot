'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createBrowserClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) {
        setError(resetError.message)
      } else {
        setSent(true)
      }
    } catch {
      setError('Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-fixed/20 blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-secondary-fixed/30 blur-[120px]" />
      </div>

      <div className="w-full max-w-md z-10 space-y-10">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 flex items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            <span className="material-symbols-outlined text-white text-xl">school</span>
          </div>
          <span className="font-headline text-2xl font-extrabold text-primary tracking-tighter">ApplyPilot</span>
        </div>

        {sent ? (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-secondary-fixed flex items-center justify-center rounded-2xl">
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                mark_email_read
              </span>
            </div>
            <div>
              <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-2">Check your inbox</h1>
              <p className="text-on-surface-variant font-medium">
                We sent a password reset link to <strong>{email}</strong>.
              </p>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                Local dev: Check Inbucket at{' '}
                <a href="http://localhost:54324" target="_blank" rel="noopener noreferrer" className="underline font-bold">
                  localhost:54324
                </a>{' '}
                for the reset email (real emails don&apos;t send locally).
              </p>
            )}
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 text-on-surface-variant hover:text-primary transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span>Back to Login</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-2">Forgot Password</h1>
              <p className="text-on-surface-variant font-medium">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-primary tracking-wide" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3.5 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/50"
                  placeholder="consultant@agency.com"
                  required
                />
              </div>

              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  Local dev: Check Inbucket at{' '}
                  <a href="http://localhost:54324" target="_blank" rel="noopener noreferrer" className="underline font-bold">
                    localhost:54324
                  </a>{' '}
                  for the reset email (real emails don&apos;t send locally).
                </p>
              )}

              {error && (
                <div className="bg-error-container/30 border border-error/20 rounded-lg px-4 py-3 text-sm text-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-headline font-bold py-4 rounded-lg shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>

              <div className="flex items-center justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center space-x-2 text-on-surface-variant hover:text-primary transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  <span>Back to Login</span>
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full h-1 opacity-20"
        style={{ background: 'linear-gradient(to right, #031635, #1a2b4b, #515f74)' }}
      />
    </div>
  )
}
