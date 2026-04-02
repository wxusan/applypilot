'use client'

interface AgentAlertProps {
  studentName?: string
  studentId?: string
  portalName?: string
  portalUrl?: string
  alertMessage?: string
  logs?: { time: string; message: string; isError?: boolean }[]
  onManualResolve?: () => void
  onRetryDetection?: () => void
}

export default function AgentAlert({
  studentName = '',
  studentId = '',
  portalName = 'Portal',
  portalUrl = '',
  alertMessage = 'An unexpected interruption occurred. Please review.',
  logs = [],
  onManualResolve,
  onRetryDetection,
}: AgentAlertProps) {
  return (
    <div className="flex-1 relative rounded-xl overflow-hidden shadow-sm bg-surface-container-low flex flex-col lg:flex-row gap-0">
      {/* Main Browser Viewport */}
      <div className="flex-1 bg-white relative overflow-hidden min-h-[500px]">
        {/* Blurred background */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-container to-surface-container-high opacity-40 z-0"></div>

        {/* Alert Overlay */}
        <div className="absolute inset-0 bg-primary/40 z-10 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-md p-8 rounded-xl shadow-[0_40px_40px_rgba(3,22,53,0.1)] border border-outline-variant/15">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-xl text-primary">Unexpected Modal</h3>
                <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant">System Interruption</p>
              </div>
            </div>
            <div className="space-y-4 mb-8">
              <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
                <p className="text-sm font-body text-on-surface leading-relaxed">
                  <span className="font-bold">Message:</span> &quot;{alertMessage}&quot;
                </p>
              </div>
              <p className="text-xs text-on-surface-variant italic">
                Pilot Agent has paused all automated sequences to prevent data loss or session corruption.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={onManualResolve}
                className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Manual Resolve
              </button>
              <button
                onClick={onRetryDetection}
                className="w-full py-3 bg-surface-container text-primary font-bold rounded-xl hover:bg-surface-container-high transition-colors"
              >
                Retry Detection
              </button>
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div className="absolute top-4 left-4 z-20 bg-white/80 backdrop-blur-xl rounded-full px-4 py-2 border border-outline-variant/20 flex items-center gap-2">
          <span className="w-2 h-2 bg-error rounded-full animate-pulse"></span>
          <span className="text-xs font-bold text-primary font-label">PAUSED: BLOCKING_MODAL</span>
        </div>
      </div>

      {/* Sidebar: Session Info */}
      <div className="w-full lg:w-80 bg-surface-container-low p-6 flex flex-col gap-6">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-on-primary-container mb-4">Current Session</h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
              <div className="text-sm">
                <p className="font-bold text-primary">{studentName}</p>
                <p className="text-on-surface-variant text-xs">ID: {studentId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant">language</span>
              <div className="text-sm">
                <p className="font-bold text-primary">{portalName}</p>
                <p className="text-on-surface-variant text-xs">{portalUrl}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-outline-variant/20"></div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-on-primary-container mb-4">Agent Logs</h4>
          <div className="space-y-3">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className={`text-[10px] font-bold mt-1 ${log.isError ? 'text-error' : 'text-on-primary-container'}`}>{log.time}</span>
                <p className={`text-xs ${log.isError ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>{log.message}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <div className="p-4 bg-surface-container-highest rounded-xl">
            <p className="text-[10px] font-bold text-on-primary-container uppercase mb-2">Pilot Status</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-primary">Stalled</span>
              <span className="material-symbols-outlined text-error text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>pause_circle</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
