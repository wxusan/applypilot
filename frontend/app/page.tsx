import PublicNav from '@/components/landing/PublicNav'
import Hero from '@/components/landing/Hero'
import FeaturesBento from '@/components/landing/FeaturesBento'
import Pricing from '@/components/landing/Pricing'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0B1629] text-white selection:bg-emerald-500/30 font-sans w-full">
      <PublicNav />
      <Hero />
      <FeaturesBento />
      <Pricing />

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#070E1A] pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-8 border-b border-white/5">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-4 h-4 rounded-full bg-emerald-500" />
              <span className="text-[18px] font-semibold text-white tracking-wide">
                ApplyPilot<span className="text-gray-500">.</span>
              </span>
            </div>
            <div className="flex gap-6 text-[13px] font-medium text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">System Status</a>
            </div>
          </div>
          <p className="text-center text-[12px] text-gray-600 font-mono">
            &copy; 2026 ApplyPilot Core Systems Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}
