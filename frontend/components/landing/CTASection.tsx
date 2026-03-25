'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { trackContact } from '@/lib/trackContact'

export default function CTASection() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone) return
    setLoading(true)
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email: '',
          agency: 'Unknown',
          message: 'Access requested from landing page CTA',
        }),
      })
    } catch { /* silent */ }
    trackContact({ name, phone, source: 'waitlist', role: 'prospect' })
    setSent(true)
    setLoading(false)
  }

  return (
    <section id="contact" className="px-6 py-24">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-primary rounded-[3rem] p-14 lg:p-20 relative overflow-hidden"
        >
          {/* Background blobs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -mr-64 -mt-64 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full -ml-48 -mb-48 pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-10">
            {/* Heading */}
            <div className="space-y-4">
              <h2 className="text-5xl lg:text-6xl font-extrabold font-headline text-on-primary leading-tight">
                Secure Your Command
              </h2>
              <p className="text-on-primary/70 text-lg leading-relaxed">
                Join the next generation of academic architects.<br />
                Request early access to the Pilot Dashboard.
              </p>
            </div>

            {/* Form or success */}
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/15 backdrop-blur-md rounded-2xl px-8 py-7 space-y-2"
              >
                <div className="text-3xl">✅</div>
                <p className="text-on-primary font-bold text-xl">You're on the list.</p>
                <p className="text-on-primary/70 text-sm">
                  We'll reach out via Telegram or phone call within 24 hours.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-primary/40 text-sm pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <input
                      className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-4 text-on-primary placeholder:text-on-primary/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all text-[15px]"
                      placeholder="Your full name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-primary/40 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </span>
                    <input
                      className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-4 text-on-primary placeholder:text-on-primary/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all text-[15px]"
                      placeholder="+998 XX XXX XX XX"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-on-primary text-primary font-bold py-4 rounded-xl hover:bg-white transition-all text-[15px] disabled:opacity-60 shadow-lg shadow-black/20"
                >
                  {loading ? 'Sending…' : 'Request Early Access →'}
                </motion.button>

                <p className="text-on-primary/40 text-xs pt-1">
                  We'll reach out via Telegram or phone call — no spam, ever.
                </p>
              </form>
            )}

            {/* Telegram link — no username */}
            <a
              href="https://t.me/wwxusan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-on-primary/50 hover:text-on-primary transition-colors text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
              </svg>
              Message us on Telegram
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
