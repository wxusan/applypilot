'use client'

interface ArchiveUnlockedModalProps {
  onEnterWorkspace: () => void
}

export default function ArchiveUnlockedModal({ onEnterWorkspace }: ArchiveUnlockedModalProps) {
  return (
    <main className="w-full max-w-6xl px-6 py-12 flex flex-col md:flex-row items-center gap-12 lg:gap-24">
      {/* Left Side: Editorial Context & Identity */}
      <div className="flex-1 space-y-8 max-w-xl">
        <header className="space-y-2">
          <div className="flex items-center gap-2 mb-6">
            <span className="font-headline font-extrabold text-2xl text-primary tracking-widest uppercase">ApplyPilot</span>
          </div>
          <h1 className="font-headline font-extrabold text-5xl lg:text-6xl text-primary leading-tight tracking-tight">
            The Archive Is <br />
            <span className="text-surface-tint">Unlocked.</span>
          </h1>
          <p className="text-on-surface-variant text-lg leading-relaxed max-w-md pt-4">
            Your credentials have been verified. You are now part of an elite collective of academic architects. Welcome to the workspace.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 pt-4">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/10">
            <span className="material-symbols-outlined text-primary bg-primary-fixed p-2 rounded-lg">verified_user</span>
            <div>
              <p className="font-headline font-bold text-primary">Identity Confirmed</p>
              <p className="text-sm text-on-surface-variant">Profile synced with agency security protocols.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/10">
            <span className="material-symbols-outlined text-primary bg-primary-fixed p-2 rounded-lg">terminal</span>
            <div>
              <p className="font-headline font-bold text-primary">Systems Primed</p>
              <p className="text-sm text-on-surface-variant">AI assistant and student dossier modules active.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Interaction Dossier (The Success Card) */}
      <div className="flex-1 w-full max-w-md">
        <div
          className="p-8 lg:p-12 rounded-xl shadow-[0_40px_40px_rgba(3,22,53,0.06)] border border-outline-variant/15 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(24px)' }}
        >
          {/* Decorative gradient */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Success Visual */}
            <div className="w-24 h-24 mb-8 relative">
              <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-6xl text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <span className="inline-block px-4 py-1 rounded-full bg-secondary-container text-on-secondary-fixed text-xs font-bold tracking-widest uppercase">
                Account Activated
              </span>
              <h2 className="font-headline font-bold text-3xl text-primary">Welcome, Consultant</h2>
              <p className="text-on-surface-variant text-sm px-4">
                Your workspace is ready. Every student journey you architect begins here. Proceed to the main terminal.
              </p>
            </div>

            <div className="w-full space-y-4">
              <button
                onClick={onEnterWorkspace}
                className="w-full py-4 px-6 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold text-sm tracking-wide shadow-lg shadow-primary/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                Enter Workspace
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
              <div className="flex justify-center items-center gap-2 pt-4">
                <div className="h-1 w-1 rounded-full bg-outline-variant"></div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline">System Log: 104-Success</span>
                <div className="h-1 w-1 rounded-full bg-outline-variant"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Contextual floating card */}
        <div className="mt-8 flex justify-end">
          <div className="bg-surface-container-highest p-4 rounded-lg flex items-center gap-3 max-w-xs shadow-sm border-l-4 border-primary">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm flex-shrink-0">
              AD
            </div>
            <div>
              <p className="text-xs font-bold text-primary">Director&apos;s Note</p>
              <p className="text-[10px] text-on-surface-variant leading-tight">&quot;Efficiency is the architect of excellence. Glad to have you.&quot;</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
