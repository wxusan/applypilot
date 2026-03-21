'use client'

import { useState, useMemo } from 'react'
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Check lockout
    if (lockedUntil && new Date() < lockedUntil) {
      const minutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)
      setError(`Account locked. Try again in ${minutes} minute(s).`)
      return
    }

    if (!email || !password) {
      setError('Email and password are required.')
      return
    }

    setLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
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
                className="w-full h-9 px-3 text-[13px] rounded-[6px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand transition"
                style={{ border: '0.5px solid #d1d5db' }}
                placeholder="you@agency.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-9 px-3 text-[13px] rounded-[6px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand transition"
                style={{ border: '0.5px solid #d1d5db' }}
                placeholder="••••••••"
                required
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
              disabled={loading}
              className="w-full h-9 rounded-[6px] text-[13px] font-medium text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1D9E75' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-4">
          Access is by invitation only.
        </p>
      </div>
    </div>
  )
}
