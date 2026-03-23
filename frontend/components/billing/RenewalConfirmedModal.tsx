'use client'

interface RenewalConfirmedModalProps {
  onGoToBilling: () => void
  onReturnToDashboard: () => void
  onClose: () => void
}

export default function RenewalConfirmedModal({
  onGoToBilling,
  onReturnToDashboard,
  onClose,
}: RenewalConfirmedModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-12 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary-container/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-primary-fixed/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Backdrop */}
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-[0_40px_60px_rgba(3,22,53,0.08)] overflow-hidden border border-outline-variant/15">
        <div className="flex flex-col md:flex-row">

          {/* Visual Anchor Side */}
          <div className="hidden md:flex md:w-1/3 bg-gradient-to-br from-primary to-primary-container p-8 flex-col justify-between text-on-primary">
            <div>
              <div className="flex items-center gap-2 mb-8">
                <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>architecture</span>
                <span className="font-headline font-extrabold tracking-tighter text-lg uppercase">Architect</span>
              </div>
              <h2 className="font-headline font-bold text-2xl leading-tight mb-4">Request Sent Successfully.</h2>
              <p className="text-on-primary-container text-sm font-medium leading-relaxed">
                Your agency&apos;s renewal process has been initiated with the Super Admin.
              </p>
            </div>
            <div className="mt-auto">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-fixed mb-2">Next Step</p>
                <p className="text-xs leading-snug opacity-80">
                  The Super Admin will review the seat allocation and finalize billing details.
                </p>
              </div>
            </div>
          </div>

          {/* Content Side */}
          <div className="flex-1 p-8 md:p-12">
            <div className="flex justify-between items-start mb-10">
              <div className="h-12 w-12 rounded-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <button
                onClick={onClose}
                className="text-outline hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="font-headline font-extrabold text-3xl text-primary tracking-tight mb-2">
                  Renewal Request Confirmed
                </h1>
                <p className="text-on-surface-variant font-body leading-relaxed">
                  We&apos;ve notified the <strong>Super Admin</strong> of your intent to renew the{' '}
                  <strong>ApplyPilot Premium Suite</strong>. You will receive an email once the request is processed.
                </p>
              </div>

              {/* Dossier Style Summary Card */}
              <div className="bg-surface-container-low rounded-lg p-6 space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-primary-container">Request Summary</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <p className="text-[10px] text-outline font-semibold uppercase">Product</p>
                    <p className="text-sm font-bold text-primary">ApplyPilot AI Suite</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-outline font-semibold uppercase">Recipients</p>
                    <p className="text-sm font-bold text-primary">Super Admin Team</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-outline font-semibold uppercase">Consultant Seats</p>
                    <p className="text-sm font-bold text-primary">12 Active</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-outline font-semibold uppercase">Reference ID</p>
                    <p className="text-sm font-bold text-primary">#REQ-8829-01</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onGoToBilling}
                  className="flex-1 bg-gradient-to-br from-primary to-primary-container text-on-primary py-3.5 px-6 rounded-lg font-headline font-bold text-sm shadow-lg shadow-primary/10 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <span>Go to Billing Overview</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
                <button
                  onClick={onReturnToDashboard}
                  className="flex-1 bg-surface-container-lowest border border-outline-variant/30 text-primary py-3.5 px-6 rounded-lg font-headline font-bold text-sm hover:bg-surface-bright transition-all"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress/Status bar */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-10">
        <div
          className="bg-surface-container-lowest/80 border border-outline-variant/20 rounded-full py-3 px-6 shadow-xl flex items-center justify-between"
          style={{ backdropFilter: 'blur(16px)' }}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-2 h-2 bg-surface-tint rounded-full animate-ping"></div>
              <div className="relative w-2 h-2 bg-surface-tint rounded-full"></div>
            </div>
            <span className="text-xs font-semibold text-on-surface-variant tracking-tight">Syncing with Dossier Manager...</span>
          </div>
          <div className="h-1 w-24 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-primary-fixed w-full transition-all duration-1000"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
