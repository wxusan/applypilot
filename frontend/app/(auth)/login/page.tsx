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
    <div className="bg-surface font-body text-on-surface min-h-screen flex items-center justify-center overflow-hidden">
      {/* Intentional Asymmetry Layout */}
      <div className="flex w-full min-h-screen">

        {/* Left Side: Editorial Content/Identity */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary-container relative flex-col justify-between p-16 text-white overflow-hidden">
          {/* Decorative Gradient Overlay */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-secondary-container via-transparent to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <span className="material-symbols-outlined text-4xl">account_balance</span>
              <h1 className="font-headline font-extrabold text-2xl tracking-tighter">ApplyPilot</h1>
            </div>
            <div className="max-w-md">
              <h2 className="font-headline text-5xl font-bold leading-tight mb-6">Navigating the future of education with precision.</h2>
              <p className="text-on-primary-container text-lg leading-relaxed">The premier digital dossier for college consultants and academic advisors.</p>
            </div>
          </div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
              <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">security</span>
              </div>
              <div>
                <p className="font-headline font-semibold text-sm">Institutional Security</p>
                <p className="text-xs text-on-primary-container">AES-256 encrypted application data</p>
              </div>
            </div>
          </div>
          {/* Abstract Background Visual */}
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary opacity-50 rounded-full blur-[100px]"></div>
        </div>

        {/* Right Side: The Login Canvas */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-surface">
          <div className="w-full max-w-md">
            {/* Header Section */}
            <div className="mb-10">
              <h3 className="font-headline text-3xl font-bold text-primary mb-2">Welcome Back</h3>
              <p className="text-on-surface-variant font-medium">Please enter your credentials to access the Pilot interface.</p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleLogin} className="space-y-6">

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-primary font-label" htmlFor="email">
                  Institutional Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-xl">mail</span>
                  </div>
                  <input
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 text-on-surface placeholder:text-outline outline-none"
                    id="email"
                    name="email"
                    placeholder="name@consultancy.edu"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-primary font-label" htmlFor="password">
                    Password
                  </label>
                  <a className="text-xs font-bold text-primary hover:underline transition-all" href="#">Forgot Password?</a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-xl">lock</span>
                  </div>
                  <input
                    className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 text-on-surface placeholder:text-outline outline-none"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    className="absolute inset-y-0 right-4 flex items-center text-outline hover:text-primary transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm bg-error-container text-on-error-container">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                className="w-full btn-primary-gradient text-white py-4 rounded-xl font-headline font-bold text-base shadow-lg shadow-primary/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Signing in…' : (
                  <>
                    Sign In to Dashboard
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-surface-container-high"></div>
                <span className="flex-shrink mx-4 text-xs font-bold text-outline uppercase tracking-widest">or continue with</span>
                <div className="flex-grow border-t border-surface-container-high"></div>
              </div>

              {/* OAuth Button */}
              <button
                className="w-full bg-surface-container-lowest border border-outline-variant hover:border-primary/40 hover:bg-surface-bright text-primary py-3.5 rounded-xl font-body font-semibold text-sm transition-all flex items-center justify-center gap-3 shadow-sm"
                type="button"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google Workspace
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-12 text-center">
              <p className="text-on-surface-variant text-sm font-medium">
                New to ApplyPilot?{' '}
                <a className="text-primary font-bold hover:underline ml-1" href="#">Request institutional access</a>
              </p>
            </div>

            {/* Subtle Security Badge */}
            <div className="mt-16 flex items-center justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">verified_user</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">SOC2 Compliant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">encrypted</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">SSL Secure</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
