export default function ApprovalDetailPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-2">Browser Agent Audit</h2>
        <p className="text-on-surface-variant max-w-2xl leading-relaxed">
          Review the agent&apos;s recent progression through the CommonApp portal. Verify data integrity and formatting before final submission synchronization.
        </p>
      </div>

      {/* Dashboard Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Main Gallery Canvas */}
        <div className="col-span-12 lg:col-span-9 space-y-8">
          {/* Progress Section */}
          <div className="bg-surface-container-low rounded-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-headline text-lg font-bold text-primary">Capture Stream</h3>
                <p className="text-sm text-on-surface-variant">6 of 8 steps completed successfully</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-surface-container-lowest text-primary text-sm font-semibold rounded-lg border border-outline-variant/10 hover:bg-surface-bright transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">filter_list</span>
                  Filter Views
                </button>
                <button className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-md hover:translate-y-[-1px] transition-all">
                  Refresh Stream
                </button>
              </div>
            </div>

            {/* Screenshot Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1 */}
              <div className="group relative bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/5 hover:shadow-xl transition-all duration-300">
                <div className="aspect-video bg-surface-container-highest relative overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-outline-variant/30">screenshot_monitor</span>
                  </div>
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-white/90 backdrop-blur px-6 py-2 rounded-full font-bold text-primary text-sm">Expand Capture</button>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="px-2 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-sm">09:41:02</span>
                  </div>
                </div>
                <div className="p-5 flex justify-between items-start">
                  <div>
                    <h4 className="font-headline font-bold text-primary text-sm">Personal Information</h4>
                    <p className="text-xs text-on-surface-variant mt-1">Status: Field Mapping Complete</p>
                  </div>
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="group relative bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/5 hover:shadow-xl transition-all duration-300">
                <div className="aspect-video bg-surface-container-highest relative overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-outline-variant/30">screenshot_monitor</span>
                  </div>
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-white/90 backdrop-blur px-6 py-2 rounded-full font-bold text-primary text-sm">Expand Capture</button>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="px-2 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-sm">09:42:15</span>
                  </div>
                </div>
                <div className="p-5 flex justify-between items-start">
                  <div>
                    <h4 className="font-headline font-bold text-primary text-sm">Education History</h4>
                    <p className="text-xs text-on-surface-variant mt-1">Status: 12 Entries Processed</p>
                  </div>
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="group relative bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/5 hover:shadow-xl transition-all duration-300">
                <div className="aspect-video bg-surface-container-highest relative overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-outline-variant/30">screenshot_monitor</span>
                  </div>
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-white/90 backdrop-blur px-6 py-2 rounded-full font-bold text-primary text-sm">Expand Capture</button>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="px-2 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-sm">09:44:00</span>
                  </div>
                </div>
                <div className="p-5 flex justify-between items-start">
                  <div>
                    <h4 className="font-headline font-bold text-primary text-sm">Writing Supplement</h4>
                    <p className="text-xs text-on-surface-variant mt-1">Status: AI Draft Uploaded</p>
                  </div>
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
              </div>

              {/* Card 4 (Actionable/Conflict) */}
              <div className="group relative bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border-2 border-primary/20 hover:shadow-xl transition-all duration-300">
                <div className="aspect-video bg-surface-container-highest relative overflow-hidden">
                  <div className="absolute inset-0 bg-surface-dim flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-on-surface-variant/20">pending</span>
                  </div>
                  <div className="absolute inset-0 bg-primary/40 flex flex-col items-center justify-center gap-4 text-center px-8">
                    <p className="text-white font-bold text-sm">Ambiguity detected in &quot;Extracurricular Activities&quot; section.</p>
                    <button className="bg-white text-primary px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg">Resolve Manual</button>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="px-2 py-1 bg-white text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm">Current</span>
                  </div>
                </div>
                <div className="p-5 flex justify-between items-start">
                  <div>
                    <h4 className="font-headline font-bold text-primary text-sm">Extracurriculars</h4>
                    <p className="text-xs text-error font-medium mt-1">Awaiting Human Input</p>
                  </div>
                  <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Logs Terminal */}
          <div className="bg-tertiary-container text-tertiary-fixed p-6 rounded-xl font-mono text-xs overflow-hidden relative">
            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-error/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-secondary-fixed/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-on-primary-container/40"></div>
              </div>
              <span className="ml-2 font-semibold opacity-60">applypilot_agent_executor.log</span>
            </div>
            <div className="space-y-1 opacity-90">
              <p><span className="text-secondary-fixed">[09:41:02]</span> <span className="text-on-primary-fixed-variant">INFO:</span> Initialized browser context...</p>
              <p><span className="text-secondary-fixed">[09:41:15]</span> <span className="text-on-primary-fixed-variant">INFO:</span> Successfully authenticated into commonapp.org</p>
              <p><span className="text-secondary-fixed">[09:42:00]</span> <span className="text-on-primary-fixed-variant">INFO:</span> Injecting &apos;Student_Profile_JSON_v4&apos; into form fields...</p>
              <p><span className="text-secondary-fixed">[09:43:45]</span> <span className="text-on-primary-fixed-variant">INFO:</span> Form validation passing (88%)...</p>
              <p><span className="text-error">[09:44:12]</span> <span className="text-error-container">WARN:</span> Unexpected modal detected. Halting for user review.</p>
              <p className="animate-pulse">_</p>
            </div>
          </div>
        </div>

        {/* Control Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Execution Status Card */}
          <div className="bg-surface-container-low p-6 rounded-xl space-y-6">
            <h3 className="font-headline font-bold text-primary text-sm tracking-tight">Agent Controls</h3>
            <div className="space-y-4">
              <div className="p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-on-surface-variant">Step Progress</span>
                  <span className="text-xs font-bold text-primary">75%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-3/4"></div>
                </div>
              </div>
              <button className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-lg font-bold text-sm shadow-lg shadow-primary/10">
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                Resume Automation
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-3 bg-surface-container-highest text-primary rounded-lg font-bold text-sm border border-outline-variant/20">
                <span className="material-symbols-outlined text-sm">stop</span>
                Terminate Session
              </button>
            </div>
            <div className="pt-6 border-t border-outline-variant/10">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">Verification Checklist</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="w-5 h-5 rounded border border-outline-variant/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </div>
                  <span className="text-xs font-medium text-on-surface">Address validation</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="w-5 h-5 rounded border border-outline-variant/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </div>
                  <span className="text-xs font-medium text-on-surface">GPA precision (4-dec)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="w-5 h-5 rounded border-2 border-primary flex items-center justify-center"></div>
                  <span className="text-xs font-bold text-primary">Activity categorization</span>
                </label>
              </div>
            </div>
          </div>

          {/* Meta Info Card */}
          <div className="bg-surface-container-low p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              </div>
              <h3 className="font-headline font-bold text-primary text-sm tracking-tight">Dossier Context</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px]">
                <span className="text-on-surface-variant">Applicant</span>
                <span className="font-bold text-primary">Marcus Vane</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-on-surface-variant">Portal</span>
                <span className="font-bold text-primary">CommonApp 2024</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-on-surface-variant">Agent Version</span>
                <span className="font-bold text-primary">v2.1-stable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Pilot Active Intelligence</p>
              <p className="text-sm font-bold text-primary">Suggesting resolution for Step 7...</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-5 py-2 text-xs font-bold text-primary hover:bg-surface-container rounded-lg transition-colors">Dismiss</button>
            <button className="px-5 py-2 text-xs font-bold text-white bg-primary rounded-lg shadow-lg hover:shadow-primary/20 transition-all">Review Solution</button>
          </div>
        </div>
      </div>
    </div>
  )
}
