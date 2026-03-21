'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function PublicNav() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          <span className="text-[16px] font-semibold text-white tracking-wide">
            ApplyPilot<span className="text-gray-500">.</span>
          </span>
        </div>

        {/* MID LINKS */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-[13px] text-gray-400 hover:text-white transition-colors">Features</Link>
          <Link href="#agents" className="text-[13px] text-gray-400 hover:text-white transition-colors">AI Agents</Link>
          <Link href="#pricing" className="text-[13px] text-gray-400 hover:text-white transition-colors">Pricing</Link>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-[13px] font-medium text-gray-300 hover:text-white transition-colors"
          >
            Log in
          </Link>
          <div className="h-4 w-px bg-white/10 hidden md:block" />
          <Link 
            href="/login"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-4 py-1.5 text-[12px] font-semibold text-black transition-all hover:scale-105 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <Sparkles size={12} className="text-emerald-600" />
              Book a Demo
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>

      </div>
    </nav>
  )
}
