'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => createBrowserClient(), [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null)
  const [lockCountdown, setLockCountdown] = useState(0)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  // Countdown timer when locked out
  useEffect(() => {
    if (!lockedUntil) return
    const tick = () => {
      const remaining = Math.max(0, lockedUntil.getTime() - Date.now())
      setLockCountdown(remaining)
      if (remaining === 0) setLockedUntil(null)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [lockedUntil])

  const formatCountdown = (ms: number) => {
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Check lockout
    if (lockedUntil && new Date() < lockedUntil) return

    // Sanitize inputs
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail || !trimmedPassword) {
      setError('Email and password are required.')
      return
    }

    setLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      })

      if (authError) {
        const newAttempts = loginAttempts + 1
        setLoginAttempts(newAttempts)

        if (newAttempts >= 10) {
          const unlock = new Date(Date.now() + 30 * 60 * 1000)
          setLockedUntil(unlock)
          setError('Too many failed attempts. Account locked for 30 minutes.')
        } else {
          setError(`Invalid email or password. (${10 - newAttempts} attempts remaining)`)
        }
        return
      }

      setLoginAttempts(0)
      router.push('/dashboard')
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Enter your email address above first.')
      return
    }
    setResetLoading(true)
    setError(null)
    try {
      await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })
      setResetSent(true)
    } catch {
      setError('Failed to send reset email. Please try again.')
    } finally {
      setResetLoading(false)
    }
  }

  const isLocked = lockedUntil !== null && lockCountdown > 0

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-2 h-2 rounded-full bg-brand" />
          <span className="text-[15px] font-semibold text-gray-900">ApplyPilot</span>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-[10px] p-6"
          style={{ border: '0.5px solid #e5e7eb' }}
        >
          <h1 className="text-[22px] font-semibold text-gray-900 mb-1">Sign in</h1>
          <p className="text-[13px] text-gray-500 mb-6">
            Enter your credentials to access your agency dashboard.
          </p>

          {/* Lockout countdown banner */}
          {isLocked && (
            <div
              className="rounded-[6px] px-3 py-3 mb-4 text-center"
              style={{ backgroundColor: '#FFF7ED', border: '0.5px solid #FED7AA' }}
            >
              <p className="text-[12px] font-medium text-orange-700">Account temporarily locked</p>
              <p className="text-[28px] font-mono font-bold text-orange-800 mt-1">
                {formatCountdown(lockCountdown)}
              </p>
              <p className="text-[11px] text-orange-600 mt-0.5">Try again after the countdown</p>
            </div>
          )}

          {resetSent ? (
            <div
              className="rounded-[6px] px-3 py-3 text-center"
              style={{ backgroundColor: '#E1F5EE', border: '0.5px solid #A7F3D0' }}
            >
              <p className="text-[13px] font-medium text-green-800">Password reset email sent!</p>
              <p className="text-[12px] text-green-700 mt-1">Check your inbox and follow the link.</p>
              <button
                onClick={() => setResetSent(false)}
                className="text-[12px] text-brand-dark underline mt-2"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] rounded-[6px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  style={{ border: '0.5px solid #d1d5db' }}
                  placeholder="you@agency.com"
                  required
                  disabled={isLocked}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading || isLocked}
                    className="text-[11px] text-brand hover:text-brand-dark transition-colors disabled:opacity-50"
                  >
                    {resetLoading ? 'Sending…' : 'Forgot password?'}
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] rounded-[6px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  style={{ border: '0.5px solid #d1d5db' }}
                  placeholder="••••••••"
                  required
                  disabled={isLocked}
                />
              </div>

              {error && (
                <div
                  className="rounded-[6px] px-3 py-2 text-[12px] text-danger-text"
                  style={{ backgroundColor: '#FCEBEB', border: '0.5px solid #f5c2c2' }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || isLocked}
                className="w-full h-9 rounded-[6px] text-[13px] font-medium text-white transition disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
                style={{ backgroundColor: '#1D9E75' }}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-4">
          Access is by invitation only.
        </p>
      </div>
    </div>
  )
}
