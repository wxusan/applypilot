'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export default function CTASection() {
  const [form, setForm] = useState({ name: '', phone: '', agency: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Request failed')
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again or contact us on Telegram.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact" className="px-8 py-24">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-primary rounded-[3rem] p-16 lg:p-24 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container rounded-full -mr-48 -mt-48 opacity-20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-on-primary-container rounded-full -ml-48 -mb-48 opacity-10 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <h2 className="text-5xl lg:text-6xl font-extrabold font-headline text-on-primary mb-4">Secure Your Command</h2>
            <p className="text-on-primary-container text-xl mb-12 leading-relaxed">
              Join the next generation of academic architects. Request early access to the Pilot Dashboard.
            </p>

            {submitted ? (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-on-primary">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-xl font-bold">Request sent!</p>
                <p className="text-on-primary-container mt-2">We&apos;ll contact you on Telegram shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-primary-container mb-1.5">Full Name</label>
                    <input
                      required
                      type="text"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-on-primary placeholder:text-on-primary-container/60 focus:ring-2 focus:ring-white/30 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-primary-container mb-1.5">Phone Number</label>
                    <input
                      required
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-on-primary placeholder:text-on-primary-container/60 focus:ring-2 focus:ring-white/30 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-primary-container mb-1.5">Agency Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Your consulting firm"
                    value={form.agency}
                    onChange={(e) => setForm({ ...form, agency: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-on-primary placeholder:text-on-primary-container/60 focus:ring-2 focus:ring-white/30 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-primary-container mb-1.5">Message (optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about your needs..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-on-primary placeholder:text-on-primary-container/60 focus:ring-2 focus:ring-white/30 outline-none resize-none"
                  />
                </div>

                {error && <p className="text-sm text-red-300 bg-red-900/20 rounded-xl px-4 py-3">{error}</p>}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full btn-shimmer bg-on-primary text-primary font-bold px-10 py-4 rounded-xl hover:bg-surface-bright transition-all text-lg disabled:opacity-60"
                >
                  {loading ? 'Sending…' : 'Request Access'}
                </motion.button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
