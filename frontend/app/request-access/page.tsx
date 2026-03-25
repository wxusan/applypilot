'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trackContact } from '@/lib/trackContact'

export const dynamic = 'force-dynamic'

export default function RequestAccessPage() {
  const [form, setForm] = useState({ name: '', phone: '', agency: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.name || !form.phone || !form.agency) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed')
      trackContact({
        name: form.name,
        phone: form.phone,
        source: 'access_request',
        role: 'prospect',
        note: form.agency ? `Agency: ${form.agency}${form.message ? ' · ' + form.message.slice(0, 100) : ''}` : undefined,
      })
      setSent(true)
    } catch {
      setError('Something went wrong. Please contact us directly on Telegram.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-10 space-y-8">
          <div className="space-y-2">
            <Link href="/" className="text-xs font-bold text-[#031635] opacity-50 hover:opacity-100 flex items-center gap-1 mb-4">
              <span>←</span> Back to home
            </Link>
            <h1 className="text-2xl font-extrabold text-[#031635]">Request Access</h1>
            <p className="text-sm text-[#64748b]">
              Tell us about your agency and we&apos;ll get you set up. We&apos;ll reach out via Telegram or phone call.
            </p>
          </div>

          {sent ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center space-y-3">
              <div className="text-3xl">🎉</div>
              <p className="font-bold text-green-800">Request sent!</p>
              <p className="text-sm text-green-700">
                We'll reach out to you via Telegram or phone call shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { id: 'name', label: 'Full Name *', placeholder: 'John Smith', type: 'text' },
                { id: 'phone', label: 'Phone / Telegram *', placeholder: '+1 555 000 0000 or @username', type: 'text' },
                { id: 'agency', label: 'Agency Name *', placeholder: 'Premier Consulting', type: 'text' },
              ].map(({ id, label, placeholder, type }) => (
                <div key={id} className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#64748b]" htmlFor={id}>
                    {label}
                  </label>
                  <input
                    id={id}
                    type={type}
                    required={label.includes('*')}
                    value={(form as any)[id]}
                    onChange={(e) => setForm(f => ({ ...f, [id]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-[#f7f9fb] border-none rounded-xl px-4 py-3.5 text-[#031635] focus:ring-2 focus:ring-[#031635]/20 outline-none transition-all"
                  />
                </div>
              ))}

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-[#64748b]" htmlFor="message">
                  Message (optional)
                </label>
                <textarea
                  id="message"
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Tell us about your agency and how you plan to use ApplyPilot…"
                  className="w-full bg-[#f7f9fb] border-none rounded-xl px-4 py-3.5 text-[#031635] focus:ring-2 focus:ring-[#031635]/20 outline-none transition-all resize-none"
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
                {loading ? 'Sending…' : 'Send Request'}
              </button>

              <p className="text-center text-xs text-[#94a3b8]">
                Or reach us directly on{' '}
                <a href="https://t.me/wwxusan" target="_blank" rel="noopener noreferrer" className="font-bold text-[#229ED9] hover:underline">
                  Telegram
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
