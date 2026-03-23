'use client'

import { ArrowRight, PlayCircle, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden min-h-[90vh] flex flex-col items-center justify-center">
      
      {/* GLOW EFFECTS */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />

      {/* SVG BACKGROUND GRID */}
      <div 
        className="absolute inset-0 pointer-events-none [mask-image:linear-gradient(to_bottom,white,transparent)]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 .5H39.5V40' stroke='rgba(255,255,255,0.05)' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        
        {/* BADGE */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[12px] text-gray-300 font-medium">ApplyPilot Autonomous Engine 2.0 Live</span>
        </div>

        {/* HEADLINE */}
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
          Your Entire Consulting Firm,<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            Beautifully Automated.
          </span>
        </h1>

        {/* SUBTITLE */}
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Scale your college consulting agency to 1,000+ students without hiring.
          Replace rigid spreadsheets with 7 autonomous AI agents that write essays, track deadlines, and auto-fill the Common App.
        </p>

        {/* CTA BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link 
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-white text-black text-[15px] font-semibold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Start Free Trial <ArrowRight size={16} />
          </Link>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 h-12 px-8 rounded-full border border-white/10 bg-white/5 text-white text-[15px] font-medium hover:bg-white/10 transition-colors">
            <PlayCircle size={16} className="text-emerald-400" /> Watch the Demo
          </button>
        </div>

        {/* SOCIAL PROOF */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-1 text-yellow-500">
            {[1,2,3,4,5].map(i => <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
          </div>
          <p className="text-[13px] text-gray-500 font-medium flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            Trusted by 50+ elite educational agencies globally
          </p>
        </div>

      </div>

      {/* FLOATING DASHBOARD MOCKUP */}
      <div className="w-full max-w-6xl mx-auto px-6 mt-20 relative z-20 perspective-1000">
        <div className="relative rounded-2xl bg-[#111] border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] p-2">
          {/* Faux browser header */}
          <div className="h-6 flex items-center gap-1.5 px-3 border-b border-white/5 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <img 
            src="https://images.unsplash.com/photo-1618761714954-0b8cd0026356?auto=format&fit=crop&w=1200&q=80" 
            alt="ApplyPilot Dashboard" 
            className="rounded-xl w-full h-[300px] md:h-[600px] object-cover opacity-60"
          />
          {/* Overlay gradient to fade it into background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1629] via-transparent to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  )
}
