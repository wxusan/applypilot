'use client'

interface ManualInterventionProps {
  studentName?: string
  dossierId?: string
  institution?: string
  deadline?: string
  onTakeOver?: () => void
  onRetry?: () => void
  onMarkReview?: () => void
}

export default function ManualIntervention({
  studentName = 'Julian Thorne',
  dossierId = '29910-B',
  institution = 'Stanford University',
  deadline = 'Jan 01 (2 Days Left)',
  onTakeOver,
  onRetry,
  onMarkReview,
}: ManualInterventionProps) {
  return (
    <section className="p-10 bg-surface">
      {/* Alert Banner */}
      <div className="mb-10 p-6 bg-error-container/30 border-l-4 border-error rounded-r-xl flex items-start gap-4">
        <div className="bg-error p-2 rounded-full">
          <span className="material-symbols-outlined text-white text-lg">warning</span>
        </div>
        <div>
          <h1 className="font-headline font-bold text-xl text-on-error-container tracking-tight">Manual Intervention Required</h1>
          <p className="font-body text-on-surface-variant mt-1 leading-relaxed max-w-2xl">
            The Pilot Agent has encountered a <span className="font-semibold">Security Challenge (hCaptcha)</span> on the Common App portal for Student #{dossierId}. Automated submission has been paused to prevent account lockout.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Browser Viewport */}
        <div className="col-span-8 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-2xl shadow-primary/5 border border-outline-variant/20">
            {/* Browser Header */}
            <div className="bg-surface-container h-12 flex items-center px-4 gap-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              </div>
              <div className="flex-1 bg-surface-container-lowest h-7 rounded-md flex items-center px-3 gap-2">
                <span className="material-symbols-outlined text-xs text-slate-400">lock</span>
                <span className="text-[10px] text-slate-500 font-medium">apply.commonapp.org/login/verification</span>
              </div>
            </div>

            {/* Captcha Challenge */}
            <div className="relative">
              <div className="aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center opacity-60">
                  <span className="material-symbols-outlined text-6xl text-outline-variant/30">web</span>
                </div>
                {/* Captcha Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-[2px]">
                  <div className="bg-white p-6 rounded-xl shadow-2xl border border-primary/10 flex flex-col items-center gap-4 max-w-sm text-center">
                    <div className="w-16 h-16 bg-surface-container rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-lg">Verify you are human</h3>
                      <p className="text-xs text-on-surface-variant mt-2">The institution requires a manual captcha completion to proceed with the dossier submission.</p>
                    </div>
                    <button
                      onClick={onTakeOver}
                      className="w-full py-3 bg-primary text-white font-semibold rounded-lg text-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      Open Interactive Session
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Automation Log */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h4 className="font-headline font-bold text-sm text-primary mb-4 uppercase tracking-widest">Automation Log</h4>
            <div className="space-y-4">
              {[
                { label: 'Authentication', status: 'Success · 09:42 AM', success: true },
                { label: 'Academic Record Upload', status: 'Success · 09:44 AM', success: true },
                { label: 'Submit Dossier', status: 'Blocked · Manual Action Needed', success: false },
              ].map((step) => (
                <div key={step.label} className="flex items-center justify-between text-sm py-2 border-b border-outline-variant/10 last:border-0">
                  <div className="flex items-center gap-3">
                    <span
                      className={`material-symbols-outlined text-sm ${step.success ? 'text-secondary' : 'text-error animate-pulse'}`}
                      style={step.success ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {step.success ? 'check_circle' : 'error'}
                    </span>
                    <span className={`font-medium ${step.success ? '' : 'font-bold text-error'}`}>{step.label}</span>
                  </div>
                  <span className={`text-on-surface-variant ${!step.success ? 'text-error font-medium' : ''}`}>{step.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recovery Controls */}
        <div className="col-span-4 space-y-6">
          {/* Identity Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
              <div>
                <h2 className="font-headline font-bold text-on-surface">{studentName}</h2>
                <p className="text-xs text-on-surface-variant">Dossier #{dossierId}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Institution:</span>
                <span className="font-semibold text-primary">{institution}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Deadline:</span>
                <span className="font-semibold text-error">{deadline}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onTakeOver}
              className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold rounded-lg shadow-xl shadow-primary/10 flex items-center justify-center gap-3 group hover:brightness-110 transition-all"
            >
              Take Over Control
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            <button
              onClick={onRetry}
              className="w-full py-4 bg-surface-container-highest text-primary font-headline font-bold rounded-lg flex items-center justify-center gap-3 hover:bg-surface-dim transition-colors"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Retry Automation
            </button>
            <button
              onClick={onMarkReview}
              className="w-full py-4 border border-outline-variant/30 text-on-surface-variant font-label font-medium rounded-lg flex items-center justify-center gap-3 hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-lg">flag</span>
              Mark for Review
            </button>
          </div>

          {/* AI Insights */}
          <div className="p-5 bg-white/80 backdrop-blur-xl rounded-xl border border-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="text-xs font-bold text-primary uppercase tracking-tighter">Pilot Insights</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              &quot;The captcha was triggered by a rapid sequence of field entries. After you solve this, I can resume at a slower &apos;Human Emulation&apos; speed to avoid further flags.&quot;
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
