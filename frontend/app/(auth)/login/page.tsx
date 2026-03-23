'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase-browser'
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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
      const supabase = createBrowserClient()
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
      // Hard navigation ensures middleware re-reads fresh session cookies
      window.location.assign('/dashboard')
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0B1629' }}>

      {/* LEFT PANEL — branding (desktop only) */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-12"
        style={{ backgroundColor: '#091320', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
          <span className="text-[15px] font-semibold text-white tracking-wide">
            ApplyPilot<span className="text-white/30">.</span>
          </span>
        </div>

        {/* Headline */}
        <div>
          <h1 className="text-[36px] font-bold text-white leading-tight tracking-tight mb-4">
            The Operating System<br />
            for Elite Consulting<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Agencies.
            </span>
          </h1>
          <p className="text-[14px] text-white/40 leading-relaxed mb-8">
            Manage 1,000+ students with 7 autonomous AI agents — no extra headcount required.
          </p>
          <ul className="space-y-3">
            {[
              'Automated essay writing & revision',
              'Real-time deadline tracking',
              'AI-powered browser form filling',
              'Telegram-native parent intake',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span className="text-[13px] text-white/50">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trust badge */}
        <div className="flex items-center gap-2 text-[12px] text-white/25">
          <ShieldCheck size={14} className="text-emerald-500/50 shrink-0" />
          <span>Trusted by 50+ elite educational agencies globally</span>
        </div>
      </div>

      {/* RIGHT PANEL — form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 justify-center mb-8 lg:hidden">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[15px] font-semibold text-white">ApplyPilot</span>
          </div>

          <h2 className="text-[24px] font-bold text-white mb-1.5">Welcome back</h2>
          <p className="text-[13px] text-white/40 mb-8">
            Sign in to your agency dashboard.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-medium text-white/40 uppercase tracking-[0.6px] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3.5 text-[13px] rounded-[8px] text-white placeholder:text-white/20 focus:outline-none transition"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                placeholder="you@agency.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-medium text-white/40 uppercase tracking-[0.6px] mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3.5 text-[13px] rounded-[8px] text-white placeholder:text-white/20 focus:outline-none transition"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div
                className="rounded-[6px] px-3.5 py-2.5 text-[12px]"
                style={{
                  backgroundColor: 'rgba(220,38,38,0.1)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  color: '#f87171',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-[8px] text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1D9E75' }}
            >
              {loading ? 'Signing in…' : (
                <>Sign in <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-white/20 mt-6">
            Access is by invitation only.
          </p>
        </div>
      </div>

    </div>
  )
}
