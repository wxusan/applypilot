'use client'

import { CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-[#0A0A0A] relative border-t border-white/5">
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Predictable Scaling Economics.
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-[15px] leading-relaxed">
            Only pay for the structural hardware compute time you actually burn. Start with zero technical overhead.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* GROWTH TIER */}
          <div className="rounded-3xl bg-[#111111] border border-emerald-500/30 p-8 shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400" />
            <h3 className="text-[20px] font-semibold text-white mb-2">Growth Partner</h3>
            <p className="text-[13px] text-gray-400 mb-6 font-light">The definitive toolkit for scaling educational agencies.</p>
            
            <div className="mb-6">
              <span className="text-5xl font-bold text-white tracking-tighter">$199</span>
              <span className="text-[15px] text-gray-500 font-medium ml-2">/ month</span>
            </div>

            <Link href="/login" className="flex items-center justify-center gap-2 w-full h-12 rounded-full bg-white text-black font-semibold text-[14px] hover:scale-105 transition-all mb-8">
              Start Building Now
            </Link>

            <ul className="space-y-4">
              {[
                "Deploy up to 3 dedicated Admin accounts",
                "Execute and track 50 simultaneous student profiles",
                "500,000 Base AI Agent Tokens per month included",
                "Advanced Telemetry and Telegram bot integration",
                "Unlimited R2 Cloud Document Storage"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-[14px] text-gray-300 font-light">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ENTERPRISE TIER */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-8">
            <h3 className="text-[20px] font-semibold text-white mb-2">Enterprise Scale</h3>
            <p className="text-[13px] text-gray-400 mb-6 font-light">Volume discounts for institutional operators.</p>
            
            <div className="mb-6 pt-2">
              <span className="text-4xl font-semibold text-white tracking-tight">Custom Plan</span>
            </div>

            <Link href="mailto:owner@applypilot.com" className="flex items-center justify-center gap-2 w-full h-12 rounded-full bg-white/10 text-white font-medium text-[14px] hover:bg-white/20 transition-all mb-8">
              Contact Sales <ArrowRight size={14} />
            </Link>

            <ul className="space-y-4">
              {[
                "Unlock limitless AI token consumption thresholds",
                "White-label branding and custom domain routing",
                "Thousands of concurrent student processing slots",
                "Direct database access and dedicated engineering support"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-gray-500 shrink-0 mt-0.5" />
                  <span className="text-[14px] text-gray-400 font-light">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </section>
  )
}
