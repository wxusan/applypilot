'use client'

import { useState, useMemo, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase-browser'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    // Check if we have a valid recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
    })
  }, [supabase])

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-2 h-2 rounded-full bg-brand" />
          <span className="text-[15px] font-semibold text-gray-900">ApplyPilot</span>
        </div>

        <div className="bg-white rounded-[10px] p-6" style={{ border: '0.5px solid #e5e7eb' }}>
          <h1 className="text-[22px] font-semibold text-gray-900 mb-1">Reset password</h1>
          <p className="text-[13px] text-gray-500 mb-6">Enter a new password for your account.</p>

          {done ? (
            <div
              className="rounded-[6px] px-3 py-4 flex items-center gap-3 text-[13px]"
              style={{ backgroundColor: '#E1F5EE', border: '0.5px solid #86efac', color: '#0F6E56' }}
            >
              <CheckCircle size={18} />
              Password updated! Redirecting to dashboard…
            </div>
          ) : !hasSession ? (
            <div
              className="rounded-[6px] px-3 py-3 text-[13px] text-danger-text"
              style={{ backgroundColor: '#FCEBEB', border: '0.5px solid #f5c2c2' }}
            >
              This reset link has expired or is invalid. Please{' '}
              <a href="/login" className="underline">request a new one</a>.
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-9 pl-3 pr-9 text-[13px] rounded-[6px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand transition"
                    style={{ border: '0.5px solid #d1d5db' }}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] rounded-[6px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand transition"
                  style={{ border: '0.5px solid #d1d5db' }}
                  placeholder="Re-enter password"
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
                className="w-full h-9 rounded-[6px] text-[13px] font-medium text-white transition disabled:opacity-60"
                style={{ backgroundColor: '#1D9E75' }}
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-4">
          <a href="/login" className="text-[12px] text-brand hover:text-brand-dark transition">
            ← Back to sign in
          </a>
        </p>
      </div>
    </div>
  )
}
