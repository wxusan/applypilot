export default function BrowserAgentWorkspacePage() {
  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
            <span>Applications</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span>CommonApp Portal</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary">Pilot Execution</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tighter text-primary font-headline">Browser Agent Workspace</h2>
          <p className="text-on-surface-variant max-w-md">
            Automated submission process for{' '}
            <span className="text-primary font-semibold">Julian Alvarez — Stanford &apos;28</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-6 py-3 bg-white text-primary border border-outline-variant/30 rounded-xl text-sm font-bold shadow-sm hover:bg-surface-bright transition-all">
            Pause Agent
          </button>
          <button className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-xl hover:shadow-primary/20 transition-all flex items-center gap-2">
            Review &amp; Approve
            <span className="material-symbols-outlined text-sm">verified</span>
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Live Browser Preview (Main Stage) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0_40px_60px_rgba(3,22,53,0.06)] border border-outline-variant/10">
            {/* Browser Chrome UI */}
            <div className="bg-surface-container-low px-4 py-3 flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/40"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400/20 border border-yellow-400/40"></div>
                <div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400/40"></div>
              </div>
              <div className="flex-1 bg-white rounded-lg px-3 py-1 flex items-center gap-2 border border-outline-variant/10">
                <span className="material-symbols-outlined text-xs text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                <span className="text-xs text-on-surface-variant font-medium">commonapp.org/apply/stanford/personal-info</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
            </div>
            {/* Portal Placeholder */}
            <div className="relative aspect-video bg-surface-container">
              <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-outline-variant/30">web</span>
              </div>
              {/* AI Indicator Overlay */}
              <div className="absolute inset-0 bg-primary/5 pointer-events-none flex items-center justify-center">
                <div className="absolute top-1/4 left-1/3 w-48 h-10 border-2 border-primary-fixed-dim bg-white/60 backdrop-blur-sm rounded-lg flex items-center px-3 gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Pilot Filling...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Execution Progress */}
          <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-lg text-primary">Application Flow</h3>
              <span className="text-sm font-bold text-primary">74% Complete</span>
            </div>
            <div className="relative h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-[74%] bg-gradient-to-r from-primary to-surface-tint rounded-full"></div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-8">
              <div className="flex flex-col gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-xs font-bold text-primary">Profile Data</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-xs font-bold text-primary">Academic History</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                <span className="text-xs font-bold text-primary">Supporting Docs</span>
              </div>
              <div className="flex flex-col gap-2 opacity-40">
                <span className="material-symbols-outlined text-on-surface-variant">radio_button_unchecked</span>
                <span className="text-xs font-bold text-on-surface-variant">Final Review</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Logs & Sidebar Data */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Live Status Log */}
          <div className="bg-primary text-white rounded-3xl p-8 h-[480px] flex flex-col shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.5)]"></div>
              <h3 className="font-headline font-bold">Pilot Execution Log</h3>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto pr-2">
              <div className="flex gap-4">
                <span className="text-[10px] font-mono text-on-primary-container mt-1">14:22:01</span>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Filling Personal Information...</p>
                  <p className="text-xs text-on-primary-container">Source: dossier_j_alvarez_v2.pdf</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="text-[10px] font-mono text-on-primary-container mt-1">14:23:45</span>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Validating Zip Code &amp; Address</p>
                  <p className="text-xs text-on-primary-container">Verified: 94305, Stanford, CA</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="text-[10px] font-mono text-on-primary-container mt-1">14:25:12</span>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Uploading Transcripts...</p>
                  <p className="text-xs text-on-primary-container">File: high_school_records_official.pdf</p>
                </div>
              </div>
              <div className="flex gap-4 border-l-2 border-surface-tint pl-4">
                <span className="text-[10px] font-mono text-on-primary-container mt-1">14:27:08</span>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Action: Detecting Supplementary Essay Prompt</p>
                  <p className="text-xs text-on-primary-container">Querying knowledge base for Stanford-specific drafts...</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="text-[10px] font-mono text-on-primary-container mt-1">14:28:30</span>
                <div className="space-y-1">
                  <p className="text-sm font-medium opacity-50">Mapping extracurricular activities...</p>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-on-primary-container/20">
              <div className="flex items-center justify-between text-xs text-on-primary-container">
                <span>Agent ID: PX-909</span>
                <span>Latency: 42ms</span>
              </div>
            </div>
          </div>

          {/* Meta Info Card */}
          <div className="bg-white rounded-3xl p-8 border border-outline-variant/10 space-y-6">
            <h4 className="font-headline font-bold text-primary">Contextual Intel</h4>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Deadline</span>
                <span className="text-primary font-bold">Jan 01, 2024</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Confidence Score</span>
                <span className="text-primary font-bold">98.4%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Security Protocol</span>
                <span className="text-primary font-bold flex items-center gap-1">
                  AES-256
                  <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                </span>
              </div>
            </div>
            <div className="p-4 bg-surface-container-low rounded-xl">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Next Step</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Agent will wait for your approval before clicking &quot;Submit Payment&quot;.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pilot AI Floating Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-full border border-white/20 shadow-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-primary">Pilot AI Recommendation</p>
            <p className="text-sm text-on-surface-variant truncate">
              &quot;Julian&apos;s Math score is missing from the auto-fill. Should I pull from the SAT portal?&quot;
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold hover:opacity-90">
              Yes, pull data
            </button>
            <button className="px-4 py-2 bg-surface-container-highest text-primary rounded-full text-xs font-bold">
              Manual Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
