'use client'

import { motion } from 'framer-motion'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: 'easeOut' as const },
})

const cardVariants = {
  initial: { opacity: 0, x: 40 },
  animate: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay: 0.4 + i * 0.12, ease: 'easeOut' as const },
  }),
}

export default function Hero() {
  return (
    <section className="px-8 pt-32 pb-20 bg-surface overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left Column */}
        <div>
          <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold tracking-wider uppercase mb-8">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            Intelligence for Institutions
          </motion.div>

          <motion.h1 {...fadeUp(0.12)} className="text-5xl lg:text-6xl font-extrabold font-headline text-primary tracking-tight leading-[1.1] mb-6">
            Orchestrate Excellence in College Consulting
          </motion.h1>

          <motion.p {...fadeUp(0.24)} className="text-xl text-on-surface-variant mb-10 leading-relaxed max-w-[520px]">
            The bespoke digital atelier for elite admissions teams. Secure, deliberate, and powered by institutional-grade intelligence.
          </motion.p>

          <motion.div {...fadeUp(0.36)} className="flex items-center gap-4 flex-wrap">
            <motion.a
              href="/login"
              whileHover={{ scale: 1.04, boxShadow: '0 12px 32px rgba(3,22,53,0.22)' }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-primary text-on-primary rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-primary/10 transition-colors"
            >
              Get Started
              <span className="material-symbols-outlined">arrow_forward</span>
            </motion.a>
            <motion.a
              href="#features"
              whileHover={{ scale: 1.04, boxShadow: '0 8px 24px rgba(3,22,53,0.08)' }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-white border border-outline-variant text-primary rounded-2xl font-bold hover:bg-surface-bright transition-colors"
            >
              View Dossier Demo
            </motion.a>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="relative h-[520px] hidden lg:block">
          {/* Blob backgrounds */}
          <div
            className="animate-blob absolute top-[-60px] right-[-60px] w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'rgba(3,22,53,0.04)' }}
          />
          <div
            className="animate-blob-delayed absolute bottom-[-40px] left-[-40px] w-72 h-72 rounded-full pointer-events-none"
            style={{ background: 'rgba(78,94,129,0.06)' }}
          />

          {/* Card 1 — Student Status */}
          <motion.div
            custom={0}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            className="animate-float absolute top-0 left-4 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-20"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-bold">AJ</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-primary truncate">Alex Johnson</p>
                <p className="text-xs text-slate-400">Essay Review →</p>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Active
              </span>
            </div>
          </motion.div>

          {/* Card 2 — Acceptance */}
          <motion.div
            custom={1}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            className="animate-float-delayed absolute top-20 right-0 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-20"
          >
            <p className="text-sm font-bold text-primary mb-1">🎉 Admitted to Stanford University</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">2 mins ago</span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Accepted</span>
            </div>
          </motion.div>

          {/* Card 3 — Pipeline Stats */}
          <motion.div
            custom={2}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            className="animate-float-slow absolute top-52 left-8 w-[280px] bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-20"
          >
            <p className="text-xs font-semibold text-slate-500 mb-2">Pipeline Overview</p>
            <p className="text-sm font-bold text-primary mb-3">14 students · 3 pending review · 91% on track</p>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '91%' }} />
            </div>
          </motion.div>

          {/* Card 4 — AI Suggestion */}
          <motion.div
            custom={3}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            className="animate-float absolute bottom-8 right-4 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-20"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 text-[18px]">psychology</span>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">AI Suggestion</p>
                <p className="text-sm font-bold text-primary">AI drafted 3 recommendations today</p>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  )
}
