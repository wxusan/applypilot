'use client'

export default function AIContextReviewPage() {
  const keywords = ['State Robotics', '3.98 GPA', 'Lincoln-Douglas']

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      {/* Main Content Canvas */}
      <main className="p-12 max-w-7xl">
        <div className="grid grid-cols-12 gap-10">

          {/* Context Summary Header */}
          <div className="col-span-12 mb-4">
            <span className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-2 block">Personalization Engine</span>
            <h2 className="font-headline text-4xl font-extrabold tracking-tight text-primary">Contextual Blueprint</h2>
            <p className="text-on-surface-variant max-w-2xl mt-4 leading-relaxed font-body">
              Review the data points extracted from the dossier. The AI Drafter will prioritize these specific achievements to construct a high-impact outreach email for{' '}
              <span className="text-primary font-semibold">Julianna Thorne</span>.
            </p>
          </div>

          {/* Left Column: Data Points (Bento Layout) */}
          <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-6">

            {/* GPA Card */}
            <div className="col-span-1 bg-surface-container-low p-6 rounded-xl flex flex-col justify-between group hover:bg-surface-bright transition-all duration-300">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined text-primary">school</span>
                  <span className="text-[10px] bg-primary/5 text-primary px-2 py-1 rounded font-bold uppercase tracking-wider">Academic Weight: High</span>
                </div>
                <h3 className="font-headline font-bold text-primary text-lg">Unweighted GPA</h3>
                <p className="text-on-surface-variant text-sm mt-1">Consistency across core curriculum</p>
              </div>
              <div className="mt-8 flex items-baseline gap-2">
                <span className="text-4xl font-black text-primary tracking-tighter">3.98</span>
                <span className="text-on-surface-variant font-medium">/ 4.0</span>
              </div>
            </div>

            {/* Test Scores Card */}
            <div className="col-span-1 bg-surface-container-low p-6 rounded-xl flex flex-col justify-between hover:bg-surface-bright transition-all duration-300">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined text-primary">assignment_turned_in</span>
                  <span className="text-[10px] bg-primary/5 text-primary px-2 py-1 rounded font-bold uppercase tracking-wider">Verification: Official</span>
                </div>
                <h3 className="font-headline font-bold text-primary text-lg">SAT Composite</h3>
                <p className="text-on-surface-variant text-sm mt-1">99th Percentile Performance</p>
              </div>
              <div className="mt-8 flex items-baseline gap-2">
                <span className="text-4xl font-black text-primary tracking-tighter">1560</span>
                <div className="flex flex-col text-[10px] text-on-surface-variant font-bold leading-tight uppercase">
                  <span>M: 790</span>
                  <span>ERW: 770</span>
                </div>
              </div>
            </div>

            {/* Extracurriculars Large Card */}
            <div className="col-span-2 bg-surface-container-low p-8 rounded-xl hover:bg-surface-bright transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>star_rate</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-primary text-xl tracking-tight">Extracurricular Pillars</h3>
                  <p className="text-on-surface-variant text-sm">Identifying leadership &amp; distinctiveness</p>
                </div>
              </div>
              <div className="space-y-6 mt-4">
                <div className="flex items-start gap-4">
                  <div className="w-1 bg-primary/20 h-full rounded-full self-stretch min-h-[60px]"></div>
                  <div>
                    <h4 className="font-bold text-primary text-sm uppercase tracking-wider mb-1">Pillar 01: Robotics Captain</h4>
                    <p className="text-on-surface-variant text-sm leading-relaxed">Led team to State Finals; implemented Python-based autonomous navigation systems.</p>
                    <div className="mt-2 flex gap-2">
                      <span className="px-2 py-0.5 bg-surface-container-highest text-[10px] font-bold text-primary rounded">LEADERSHIP</span>
                      <span className="px-2 py-0.5 bg-surface-container-highest text-[10px] font-bold text-primary rounded">STEM</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-1 bg-primary/20 h-full rounded-full self-stretch min-h-[60px]"></div>
                  <div>
                    <h4 className="font-bold text-primary text-sm uppercase tracking-wider mb-1">Pillar 02: Varsity Debate</h4>
                    <p className="text-on-surface-variant text-sm leading-relaxed">Top 10 National Ranking in Lincoln-Douglas. Expertise in ethical framework analysis.</p>
                    <div className="mt-2 flex gap-2">
                      <span className="px-2 py-0.5 bg-surface-container-highest text-[10px] font-bold text-primary rounded">COMMUNICATION</span>
                      <span className="px-2 py-0.5 bg-surface-container-highest text-[10px] font-bold text-primary rounded">HUMANITIES</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Action Panel */}
          <div className="col-span-12 lg:col-span-5 relative">
            <div
              className="p-8 rounded-2xl shadow-[0_40px_40px_rgba(3,22,53,0.06)] sticky top-24 border border-outline-variant/15"
              style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(24px)' }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <span className="font-headline font-extrabold text-primary tracking-tight">Drafter Pilot</span>
                </div>
                <div className="flex gap-1">
                  <div className="h-1 w-4 bg-primary rounded-full"></div>
                  <div className="h-1 w-1 bg-primary/20 rounded-full"></div>
                  <div className="h-1 w-1 bg-primary/20 rounded-full"></div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-5 bg-surface-container-low rounded-xl">
                  <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">AI Reasoning Strategy</p>
                  <p className="text-on-surface italic text-sm leading-relaxed">
                    &quot;Synthesizing Robotics leadership with Debate achievements to demonstrate a &apos;Polymath Academic Profile&apos;. Email tone will be authoritative yet curious.&quot;
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-bold text-primary mb-2 block">Personalization Depth</span>
                    <div className="relative h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className="absolute top-0 left-0 h-full w-[85%] bg-gradient-to-r from-primary to-primary-container"></div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] font-bold text-on-surface-variant">General</span>
                      <span className="text-[10px] font-bold text-primary">Ultra-Tailored (85%)</span>
                    </div>
                  </label>

                  <div className="space-y-3">
                    <span className="text-sm font-bold text-primary mb-2 block">Injected Keywords</span>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((kw) => (
                        <span key={kw} className="flex items-center gap-1.5 px-3 py-1.5 bg-white shadow-sm border border-outline-variant/10 rounded-lg text-xs font-medium text-primary">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-4 rounded-xl font-headline font-bold text-sm tracking-wide shadow-lg shadow-primary/10 hover:brightness-110 transition-all flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    GENERATE DRAFT
                  </button>
                  <p className="text-center text-[10px] text-on-surface-variant mt-4 font-medium">Estimated Generation Time: 4.2 Seconds</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Meta Info */}
          <div className="col-span-12 mt-12 border-t border-outline-variant/20 pt-8 flex items-center justify-between">
            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">database</span>
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Source: Internal CRM Dossier</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">verified_user</span>
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Encryption: SOC2 Type II</span>
              </div>
            </div>
            <button className="text-primary text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
              Edit Raw Data Points
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </main>

      {/* AI Overlay Status Bar */}
      <div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 border border-primary/10 px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-4"
        style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(24px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-2 w-2 bg-primary rounded-full animate-ping absolute"></div>
            <div className="h-2 w-2 bg-primary rounded-full relative"></div>
          </div>
          <span className="text-xs font-bold text-primary tracking-widest uppercase">Pilot Active</span>
        </div>
        <div className="h-4 w-[1px] bg-outline-variant/30"></div>
        <div className="text-xs font-medium text-on-surface-variant">
          Monitoring <span className="font-bold text-primary">Julianna Thorne</span> application cycle.
        </div>
      </div>
    </div>
  )
}
