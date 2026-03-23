'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      window.location.assign('/dashboard')
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-surface font-body text-on-surface antialiased overflow-hidden">

      {/* Left Column: Branding & Visual */}
      <section className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}>
        {/* Decorative blurs */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-fixed-dim blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-surface-tint blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <h1 className="font-headline font-extrabold text-4xl text-on-primary tracking-tighter">Academic Architect</h1>
          <p className="mt-4 text-on-primary-container font-medium text-lg max-w-sm">The digital dossier for elite college consulting.</p>
        </div>

        <div className="relative z-10">
          <blockquote className="border-l-2 border-primary-fixed pl-6">
            <p className="text-2xl font-headline font-bold text-on-primary leading-tight">
              &ldquo;The difference between an application and a dossier is the strategy behind it.&rdquo;
            </p>
            <cite className="block mt-4 text-on-primary-container not-italic font-label text-sm uppercase tracking-widest">— Senior Consultant</cite>
          </blockquote>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          <div className="flex -space-x-3">
            {['bg-primary-fixed', 'bg-primary-fixed-dim', 'bg-surface-tint'].map((bg, i) => (
              <div key={i} className={`w-10 h-10 rounded-full border-2 border-primary-container ${bg} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-primary text-base">person</span>
              </div>
            ))}
          </div>
          <span className="text-on-primary-container text-xs font-medium tracking-wide">TRUSTED BY 500+ AGENCIES WORLDWIDE</span>
        </div>
      </section>

      {/* Right Column: Login Form */}
      <section className="flex flex-col justify-center items-center p-8 lg:p-16 bg-surface relative">
        <div className="w-full max-w-md space-y-10">
          {/* Form Header */}
          <div className="space-y-2">
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">Welcome to ApplyPilot</h2>
            <p className="text-on-surface-variant text-sm">Sign in to manage your student dossiers and Pilot AI.</p>
          </div>

          {/* Main Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="email">Email Address</label>
              <input
                className="w-full bg-surface-container border-none rounded-xl px-4 py-3.5 text-on-surface focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest transition-all outline-none"
                id="email"
                placeholder="consultant@agency.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="password">Password</label>
                <a className="text-xs font-bold text-primary hover:underline" href="#">Forgot?</a>
              </div>
              <div className="relative">
                <input
                  className="w-full bg-surface-container border-none rounded-xl px-4 py-3.5 pr-12 text-on-surface focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest transition-all outline-none"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary-fixed" id="remember" type="checkbox" />
              <label className="text-sm font-medium text-on-surface-variant" htmlFor="remember">Keep me signed in for 30 days</label>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm bg-error-container text-on-error-container">
                {error}
              </div>
            )}

            <button
              className="w-full text-on-primary font-headline font-bold py-4 rounded-xl shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in…' : (
                <>
                  <span>Sign In to Dashboard</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-surface-container-high"></div>
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">or continue with</span>
            <div className="h-[1px] flex-1 bg-surface-container-high"></div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl hover:bg-surface-container transition-colors shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-sm font-bold text-primary">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl hover:bg-surface-container transition-colors shadow-sm">
              <span className="material-symbols-outlined text-xl text-primary">work</span>
              <span className="text-sm font-bold text-primary">SSO</span>
            </button>
          </div>

          {/* Legal Documentation */}
          <div className="space-y-6">
            <div className="bg-primary-fixed/30 rounded-xl p-6 border border-primary-fixed">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-primary">gavel</span>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">Legal Documentation</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                By signing in, you agree to our professional services agreement and data processing standards.
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <a className="group flex items-center gap-2" href="#">
                  <span className="text-sm font-bold text-primary border-b-2 border-primary/20 group-hover:border-primary transition-all">Terms of Service</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
                <a className="group flex items-center gap-2" href="#">
                  <span className="text-sm font-bold text-primary border-b-2 border-primary/20 group-hover:border-primary transition-all">Privacy Policy</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-on-surface-variant">
                Don&apos;t have an account?{' '}
                <a className="font-bold text-primary hover:underline" href="#">Request Access</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
