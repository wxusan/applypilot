export default function StudentEssaysPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <nav className="flex items-center gap-2 text-on-surface-variant text-xs mb-2">
            <span>Students</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span>Julian Vance</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary font-bold">Stanford Supplemental</span>
          </nav>
          <h2 className="text-4xl font-headline font-extrabold text-primary tracking-tight">AI Institutional Alignment</h2>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded-xl text-primary font-bold text-sm bg-surface-container-low border border-outline-variant/20 hover:bg-surface-container transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">share</span>
            Share Report
          </button>
          <button className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/10">
            <span className="material-symbols-outlined text-sm">auto_fix_high</span>
            Generate AI Revisions
          </button>
        </div>
      </div>

      {/* Bento Comparison Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Student Draft */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-headline font-bold text-lg text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Current Draft (V3.2)
            </h3>
            <span className="text-xs text-on-surface-variant font-medium">Last Edited: 2h ago</span>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_4px_20px_rgba(3,22,53,0.04)] border border-outline-variant/10 min-h-[600px]">
            <p className="text-on-surface leading-relaxed text-sm mb-6">
              When I first entered the robotics lab, I was overwhelmed by the complexity of the circuits. Over the last four years, I have dedicated myself to understanding not just the mechanics of engineering, but the potential for technology to bridge social gaps. My work with local non-profits has shown me that code is a tool for equity.
            </p>
            <div className="bg-blue-50/50 p-4 rounded-xl border-l-4 border-blue-400 mb-6">
              <p className="text-sm font-medium text-blue-900">
                <span className="material-symbols-outlined text-xs align-middle mr-1">info</span>
                <span className="font-bold">AI Insight:</span> Strong narrative arc in the opening, but the transition to &quot;social gaps&quot; feels abrupt. Consider expanding on the specific non-profit project.
              </p>
            </div>
            <p className="text-on-surface leading-relaxed text-sm">
              At Stanford, I hope to continue this journey within the CS+Social Good community. I am particularly interested in how the &quot;Design Thinking&quot; methodology can be applied to urban planning issues in my hometown of Chicago.
            </p>
          </div>
        </div>

        {/* Center: Alignment Bridge */}
        <div className="col-span-12 lg:col-span-2 flex flex-col gap-6 items-center py-12">
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="h-16 w-[2px] bg-gradient-to-b from-blue-400 via-primary to-emerald-400 opacity-30"></div>
            {/* Alignment Score */}
            <div className="w-24 h-24 rounded-full bg-primary-container flex flex-col items-center justify-center text-white ring-8 ring-surface-container-low relative">
              <span className="text-2xl font-bold font-headline">78%</span>
              <span className="text-[10px] uppercase tracking-tighter opacity-70">Match</span>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined text-[12px] text-white">check_circle</span>
              </div>
            </div>
            <div className="flex flex-col gap-6 w-full mt-4">
              <div className="text-center">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-2">High Overlap</span>
                <div className="bg-blue-100 text-blue-900 text-[10px] px-2 py-1 rounded font-bold inline-block mx-1 mb-1">Social Impact</div>
                <div className="bg-blue-100 text-blue-900 text-[10px] px-2 py-1 rounded font-bold inline-block mx-1 mb-1">Robotics</div>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Critical Gaps</span>
                <div className="bg-error-container text-on-error-container text-[10px] px-2 py-1 rounded font-bold inline-block mx-1 mb-1">Interdisciplinary Flex</div>
                <div className="bg-error-container text-on-error-container text-[10px] px-2 py-1 rounded font-bold inline-block mx-1 mb-1">Intellectual Vitality</div>
              </div>
            </div>
            <div className="h-16 w-[2px] bg-gradient-to-b from-emerald-400 via-primary to-blue-400 opacity-30"></div>
          </div>
        </div>

        {/* Right: Institutional Ideal */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-headline font-bold text-lg text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Stanford Ideal Alignment
            </h3>
            <div className="flex items-center gap-1 text-[10px] text-on-surface-variant">
              <span className="material-symbols-outlined text-xs">verified</span>
              Institutional Profile
            </div>
          </div>
          <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/10 min-h-[600px]">
            <div className="space-y-8">
              {/* Pillar 1 */}
              <div className="relative pl-6 border-l-2 border-emerald-400/30">
                <h4 className="font-headline font-bold text-primary mb-2 flex items-center gap-2">
                  Intellectual Vitality
                  <span className="bg-error-container text-on-error-container text-[10px] px-1.5 py-0.5 rounded">Gap Detected</span>
                </h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Admissions looks for &quot;The Fire&quot;—a self-directed pursuit of knowledge. Current draft mentions &quot;complexity&quot; but doesn&apos;t demonstrate the specific intellectual obsession required for this pillar.
                </p>
                <div className="mt-3 bg-surface-container-lowest p-3 rounded-lg border border-emerald-100 flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-500 text-sm">lightbulb</span>
                  <p className="text-xs font-medium text-primary">Suggest: Detail the specific &quot;unsolvable&quot; circuit problem that kept you up until 3 AM.</p>
                </div>
              </div>
              {/* Pillar 2 */}
              <div className="relative pl-6 border-l-2 border-emerald-400">
                <h4 className="font-headline font-bold text-primary mb-2 flex items-center gap-2">
                  CS+X Interdisciplinary
                  <span className="bg-secondary-container text-on-secondary-container text-[10px] px-1.5 py-0.5 rounded">Strong Match</span>
                </h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  The connection between engineering and urban planning is exactly what the d.school community values. This aligns with the &quot;Interdisciplinary Flex&quot; Stanford prioritizes.
                </p>
              </div>
              {/* Pillar 3 */}
              <div className="relative pl-6 border-l-2 border-emerald-400/30">
                <h4 className="font-headline font-bold text-primary mb-2 flex items-center gap-2">
                  Community Contribution
                  <span className="bg-error-container text-on-error-container text-[10px] px-1.5 py-0.5 rounded">Gap Detected</span>
                </h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  The essay states interest in &quot;CS+Social Good&quot; but lacks a specific &quot;Contribution Persona.&quot; How will Julian specifically change the community on campus?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action AI Bar */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-3xl flex items-center justify-between shadow-2xl shadow-primary/5">
        <div className="flex items-center gap-6">
          <div className="flex -space-x-2">
            <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-900 text-lg">psychology</span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-900 text-lg">school</span>
            </div>
          </div>
          <div>
            <h4 className="font-headline font-bold text-primary">Pilot Agent Recommendation</h4>
            <p className="text-xs text-on-surface-variant">Synthesized from 450+ successful Stanford admits in the &apos;23-&apos;24 cycle.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right mr-4">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Recommended Action</span>
            <span className="text-sm font-bold text-primary">Shift tone to &quot;Aggressive Inquiry&quot;</span>
          </div>
          <button className="bg-primary px-8 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2">
            Execute Pivot
            <span className="material-symbols-outlined text-sm">auto_mode</span>
          </button>
        </div>
      </div>
    </div>
  )
}
