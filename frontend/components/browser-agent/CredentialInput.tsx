'use client'

import { useState } from 'react'

interface CredentialInputProps {
  studentName?: string
  applicationCycle?: string
  portalName?: string
  portalUrl?: string
  onAuthorize?: (email: string, password: string) => void
  onCancel?: () => void
}

export default function CredentialInput({
  studentName = 'Alexander Sterling',
  applicationCycle = '2024-2025',
  portalName = 'CommonApp Portal',
  portalUrl = 'https://apply.commonapp.org/login',
  onAuthorize,
  onCancel,
}: CredentialInputProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <main className="min-h-screen flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-secondary-container blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary-fixed blur-[120px]"></div>
      </div>

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-[0_40px_80px_rgba(3,22,53,0.08)] overflow-hidden flex flex-col md:flex-row">
        {/* Left Panel: Security Branding */}
        <div className="md:w-5/12 bg-gradient-to-br from-primary to-primary-container p-8 text-on-primary flex flex-col justify-between">
          <div>
            <div className="mb-8">
              <span className="material-symbols-outlined text-4xl text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            </div>
            <h1 className="font-headline font-extrabold text-2xl leading-tight tracking-tighter mb-4">
              Secure Portal Link
            </h1>
            <p className="text-on-primary-container text-sm font-medium leading-relaxed">
              Establishing a secure handshake between Academic Architect and the {portalName}.
            </p>
          </div>
          <div className="mt-12 space-y-6">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary-fixed-dim text-lg">verified_user</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary-fixed">End-to-End</p>
                <p className="text-[11px] text-on-primary-container opacity-80">AES-256 Bit Encryption</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary-fixed-dim text-lg">shield_person</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary-fixed">Student Privacy</p>
                <p className="text-[11px] text-on-primary-container opacity-80">FERPA Compliant Infrastructure</p>
              </div>
            </div>
          </div>
          <div className="mt-auto pt-8 border-t border-on-primary/10">
            <p className="text-[10px] text-on-primary-container font-mono tracking-tighter uppercase">
              Node: secure-gateway-04.aa.int
            </p>
          </div>
        </div>

        {/* Right Panel: Input Form */}
        <div className="md:w-7/12 p-8 md:p-10 bg-surface-container-lowest">
          <div className="flex justify-between items-start mb-10">
            <div>
              <span className="inline-block px-2 py-0.5 rounded-md bg-secondary-container text-on-secondary-fixed text-[10px] font-bold uppercase tracking-wider mb-2">Target Profile</span>
              <h2 className="font-headline font-bold text-xl text-primary">{studentName}</h2>
              <p className="text-on-surface-variant text-xs">Application Cycle: {applicationCycle}</p>
            </div>
            <button onClick={onCancel} className="text-on-surface-variant hover:text-error transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-6">
            {/* Portal Identity */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/10">
              <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">language</span>
              </div>
              <div>
                <p className="font-headline font-bold text-sm text-primary">{portalName}</p>
                <p className="text-[11px] text-on-surface-variant">{portalUrl}</p>
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              <div className="group">
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 ml-1">Portal Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">alternate_email</span>
                  <input
                    className="w-full pl-11 pr-4 py-3 bg-surface-container border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm transition-all placeholder:text-on-surface-variant/40 font-medium outline-none"
                    placeholder="a.sterling@example.edu"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 ml-1">Access Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">key</span>
                  <input
                    className="w-full pl-11 pr-12 py-3 bg-surface-container border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm transition-all placeholder:text-on-surface-variant/40 font-medium outline-none"
                    placeholder="••••••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Warning notice */}
            <div className="p-4 bg-surface-container-high rounded-lg flex gap-3 items-start">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">info</span>
              <p className="text-[11px] leading-normal text-on-surface-variant italic">
                The Pilot AI agent will only use these credentials to sync application statuses and deadline requirements. Personal essays remain private.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={() => onAuthorize?.(email, password)}
                className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-4 rounded-xl font-headline font-bold text-sm tracking-tight shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>Authorize Secure Sync</span>
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </button>
              <button
                onClick={onCancel}
                className="w-full bg-transparent text-on-surface-variant py-3 rounded-xl font-headline font-bold text-xs tracking-tight hover:bg-surface-container transition-all"
              >
                Cancel &amp; Manual Entry
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Pilot Status */}
      <div className="fixed top-8 right-8 z-50 bg-white/80 backdrop-blur-2xl p-4 rounded-full border border-outline-variant/10 shadow-xl flex items-center gap-3 pr-6">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Pilot Agent</span>
          <span className="text-[9px] text-on-surface-variant font-mono">IDLE_WAITING_AUTH</span>
        </div>
      </div>
    </main>
  )
}
