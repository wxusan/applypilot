'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const features = [
  {
    icon: 'psychology',
    iconBg: 'bg-primary-fixed',
    iconColor: 'text-primary',
    title: 'AI Counselor',
    description: 'Autonomous drafting of recommendation letters and application critiques with a personal touch.',
    chip: { label: 'GPT-4o powered', bg: 'bg-violet-50', text: 'text-violet-700' },
    extra: null,
  },
  {
    icon: 'folder_managed',
    iconBg: 'bg-secondary-fixed',
    iconColor: 'text-secondary',
    title: 'Secure Dossiers',
    description: 'Enterprise-grade storage for transcripts, portfolios, and sensitive student records.',
    chip: null,
    extra: 'dossiers',
  },
  {
    icon: 'monitoring',
    iconBg: 'bg-tertiary-fixed',
    iconColor: 'text-tertiary',
    title: 'Unified Pipeline',
    description: 'Real-time tracking of application statuses across hundreds of institutions.',
    chip: null,
    extra: 'chart',
  },
  {
    icon: 'brand_awareness',
    iconBg: 'bg-primary',
    iconColor: 'text-on-primary',
    title: 'Branded Portals',
    description: "Your agency's look and feel, delivering a premium student-facing experience.",
    chip: null,
    extra: 'avatars',
  },
  {
    icon: 'smart_toy',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'Auto-Fill Agent',
    description: 'Fills CommonApp and Coalition forms automatically. No copy-paste, no missed fields.',
    chip: { label: 'Steel.dev powered', bg: 'bg-blue-50', text: 'text-blue-700' },
    extra: null,
  },
  {
    icon: 'analytics',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    title: 'Real-Time Analytics',
    description: 'Track agency performance, student outcomes, and team productivity in one view.',
    chip: null,
    extra: 'stat',
  },
]

export default function FeaturesBento() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="features" className="px-8 py-20 bg-surface-container-low">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl font-extrabold font-headline text-primary mb-4">Intelligence at Every Touchpoint</h2>
          <div className="w-20 h-1.5 bg-primary rounded-full"></div>
        </div>
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: i * 0.06, ease: 'easeOut' }}
              whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(3,22,53,0.12)' }}
              className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm flex flex-col gap-4 cursor-default"
            >
              <motion.div
                whileHover={{ scale: 1.15, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center`}
              >
                <span className={`material-symbols-outlined text-[20px] ${f.iconColor}`}>{f.icon}</span>
              </motion.div>

              <div>
                <h3 className="text-base font-bold font-headline text-primary mb-1">{f.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{f.description}</p>
              </div>

              {f.chip && (
                <span className={`self-start text-[10px] font-bold px-2.5 py-1 rounded-full ${f.chip.bg} ${f.chip.text}`}>
                  {f.chip.label}
                </span>
              )}

              {f.extra === 'dossiers' && (
                <div className="flex gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-surface-container-low px-2.5 py-1 rounded-lg border border-outline-variant/20">
                    <span className="material-symbols-outlined text-[13px]">description</span>Portfolio_V2.pdf
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-surface-container-low px-2.5 py-1 rounded-lg border border-outline-variant/20">
                    <span className="material-symbols-outlined text-[13px]">description</span>Transcript.docx
                  </span>
                </div>
              )}

              {f.extra === 'chart' && (
                <div className="h-16 bg-surface-container-low rounded-xl flex items-end gap-2 px-4 pb-2">
                  <div className="flex-1 bg-primary/20 rounded-t" style={{ height: '40%' }} />
                  <div className="flex-1 bg-primary/40 rounded-t" style={{ height: '60%' }} />
                  <div className="flex-1 bg-primary/70 rounded-t" style={{ height: '85%' }} />
                  <div className="flex-1 bg-primary rounded-t" style={{ height: '55%' }} />
                </div>
              )}

              {f.extra === 'avatars' && (
                <div className="flex -space-x-2.5">
                  {['bg-slate-300', 'bg-slate-400', 'bg-slate-500'].map((c, idx) => (
                    <div key={idx} className={`w-8 h-8 rounded-full border-2 border-white ${c}`} />
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-fixed flex items-center justify-center text-[9px] font-bold text-primary">+12</div>
                </div>
              )}

              {f.extra === 'stat' && (
                <span className="self-start text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">↑ 34% admit rate</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
