'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
    })
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const supabase = createBrowserClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
      } else {
        setDone(true)
        setTimeout(() => { window.location.href = '/dashboard' }, 2000)
      }
    } catch {
      setError('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-fixed/20 blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-secondary-fixed/30 blur-[120px]" />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
        {/* Illustration - left side */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 pr-12">
          <div className="relative w-full aspect-square max-w-md mx-auto">
            <div className="absolute inset-0 bg-primary-fixed opacity-20 rounded-full blur-3xl" />
            <div className="relative z-10 w-full h-full bg-surface-container-lowest rounded-xl shadow-2xl flex items-center justify-center p-8 overflow-hidden border border-outline-variant/10">
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-48 h-64 bg-surface-container border border-outline-variant rounded-lg rotate-[-6deg] absolute translate-x-4 shadow-sm" />
                <div className="w-48 h-64 bg-surface-container-high border border-outline-variant rounded-lg rotate-3 absolute -translate-x-4 shadow-md" />
                <div className="w-48 h-64 bg-white border border-outline-variant/30 rounded-lg flex flex-col p-6 shadow-xl relative z-20">
                  <div className="w-12 h-12 bg-primary-fixed rounded-full flex items-center justify-center mb-6">
                    <span
                      className="material-symbols-outlined text-primary text-2xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      lock
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full mb-3" />
                  <div className="h-2 w-3/4 bg-surface-container rounded-full mb-3" />
                  <div className="h-2 w-1/2 bg-surface-container rounded-full mb-8" />
                  <div className="mt-auto h-8 w-full bg-primary-container/10 rounded-lg border border-primary-container/20" />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="font-headline text-3xl font-extrabold text-primary tracking-tight">
              Secure Portal Access
            </h2>
            <p className="text-on-surface-variant leading-relaxed max-w-sm">
              Accessing your college consulting dashboard requires verified credentials. Use your institutional email to verify your identity.
            </p>
          </div>
        </div>

        {/* Form - right side */}
        <div className="flex flex-col space-y-10">
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

          {done ? (
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
                <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-2">
                  Password Updated!
                </h1>
                <p className="text-on-surface-variant font-medium">
                  Redirecting you to the dashboard...
                </p>
              </div>
            </div>
          ) : !hasSession ? (
            <div>
              <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-4">
                Reset Password
              </h1>
              <div className="bg-error-container/30 p-6 rounded-xl border border-error/20">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-error mt-0.5">error</span>
                  <div>
                    <p className="font-semibold text-error mb-1">Link expired</p>
                    <p className="text-sm text-on-surface-variant">
                      This reset link has expired or is invalid. Please{' '}
                      <Link href="/login" className="text-primary font-bold hover:underline">
                        request a new one
                      </Link>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-2">
                  Reset Password
                </h1>
                <p className="text-on-surface-variant font-medium">
                  Enter your email and we&#39;ll send you a recovery link.
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <label
                    className="block text-sm font-semibold text-primary tracking-wide"
                    htmlFor="new-password"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3.5 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/50"
                      placeholder="Min. 8 characters"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className="block text-sm font-semibold text-primary tracking-wide"
                    htmlFor="confirm-password"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3.5 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/50"
                    placeholder="Re-enter password"
                    required
                  />
                </div>

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
                  {loading ? 'Updating…' : 'Update Password'}
                </button>

                <div className="pt-2 flex items-center justify-center">
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
      </div>

      {/* Bottom gradient bar */}
      <div className="fixed bottom-0 left-0 w-full h-1 opacity-20"
        style={{ background: 'linear-gradient(to right, #031635, #1a2b4b, #515f74)' }}
      />
    </div>
  )
}
