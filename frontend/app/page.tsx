import PublicNav from '@/components/landing/PublicNav'
import Hero from '@/components/landing/Hero'
import FeaturesBento from '@/components/landing/FeaturesBento'
import Pricing from '@/components/landing/Pricing'
import ScrollToTop from '@/components/landing/ScrollToTop'
import CookieBanner from '@/components/landing/CookieBanner'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ApplyPilot — AI College Application Management',
  description: 'AI-powered college application management for consulting agencies. Automate student pipelines, essays, deadlines, and more.',
  openGraph: {
    title: 'ApplyPilot — AI College Application Management',
    description: 'AI-powered college application management for consulting agencies.',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-emerald-500/30 font-sans w-full">
      <PublicNav />
      <section id="hero"><Hero /></section>
      <section id="features"><FeaturesBento /></section>
      <section id="pricing"><Pricing /></section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black pt-16 pb-8" id="footer">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-8 border-b border-white/5">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-4 h-4 rounded-full bg-emerald-500" />
              <span className="text-[18px] font-semibold text-white tracking-wide">
                ApplyPilot<span className="text-gray-500">.</span>
              </span>
            </div>
            <div className="flex gap-6 text-[13px] font-medium text-gray-500">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">System Status</a>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-gray-600 font-mono">
              &copy; 2026 ApplyPilot Core Systems Inc. All rights reserved.
            </p>
            <a
              href="#hero"
              className="text-[12px] text-gray-500 hover:text-white transition-colors flex items-center gap-1"
            >
              ↑ Back to top
            </a>
          </div>
        </div>
      </footer>

      <ScrollToTop />
      <CookieBanner />
    </div>
  )
}
