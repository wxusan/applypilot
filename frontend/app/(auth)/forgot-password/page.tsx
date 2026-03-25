'use client'

import { useState } from 'react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [telegramSent, setTelegramSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email) { setError('Please enter your email address.'); return }

    setLoading(true)
    try {
      // Custom API route sends a branded email from nasux1222@gmail.com
      // and also sends a Telegram message if the user has linked their account.
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Something went wrong.'); return }
      setTelegramSent(!!json.telegram_sent)
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f7f9fb] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-10 space-y-8">
          <div className="space-y-2">
            <Link href="/login" className="text-xs font-bold text-[#031635] opacity-50 hover:opacity-100 flex items-center gap-1 mb-4">
              <span>←</span> Back to login
            </Link>
            <h1 className="text-2xl font-extrabold text-[#031635]">Reset your password</h1>
            <p className="text-sm text-[#64748b]">
              Enter your email and we&apos;ll send you a reset link. If you have Telegram linked, we&apos;ll send it there too.
            </p>
          </div>

          {sent ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center space-y-3">
              <span className="text-3xl">✉️</span>
              <p className="font-bold text-green-800">Check your inbox</p>
              <p className="text-sm text-green-700">
                We sent a reset link to <strong>{email}</strong>.
                Click it to set a new password — it expires in 1 hour and works only once.
              </p>
              {telegramSent && (
                <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  📱 We also sent the link to your connected Telegram account.
                </p>
              )}
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-1">
                  Local dev: Check Inbucket at{' '}
                  <a href="http://localhost:54324" target="_blank" className="underline font-bold">localhost:54324</a>
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-[#64748b]" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="consultant@agency.com"
                  className="w-full bg-[#f7f9fb] border-none rounded-xl px-4 py-3.5 text-[#031635] focus:ring-2 focus:ring-[#031635]/20 outline-none transition-all"
                />
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
