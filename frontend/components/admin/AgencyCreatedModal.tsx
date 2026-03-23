import Link from 'next/link'

interface AgencyCreatedModalProps {
  confirmationId?: string
  agencyName?: string
  principalName?: string
  principalEmail?: string
  seatCount?: number
  tier?: string
  region?: string
  inviteLink?: string
  onViewProfile?: () => void
  onLaunchDashboard?: () => void
}

export default function AgencyCreatedModal({
  confirmationId = 'SC-882-X9',
  agencyName = 'Elite Admissions Group',
  principalName = 'Dr. Julian Sterling',
  principalEmail = 'j.sterling@eliteadmissions.com',
  seatCount = 25,
  tier = 'Institutional',
  region = 'North America',
  inviteLink = 'scholarcommand.com/invite/8a2f...',
}: AgencyCreatedModalProps) {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
        <div className="max-w-lg">
          <div className="w-16 h-16 rounded-xl bg-primary-container flex items-center justify-center mb-6 text-on-primary">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <h1 className="font-headline font-extrabold text-4xl md:text-5xl text-primary tracking-tight mb-4">
            Agency successfully established.
          </h1>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            The institution is now registered within the Scholar Command ecosystem. A secure invitation dossier has been generated for the agency principal.
          </p>
        </div>
        <div className="hidden md:block">
          <span className="text-xs font-bold tracking-[0.2em] text-outline uppercase">Confirmation ID: {confirmationId}</span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
        {/* Agency Principal */}
        <div className="md:col-span-7 bg-surface-container-lowest p-8 rounded-xl shadow-sm shadow-primary/5 border border-outline-variant/15">
          <h3 className="font-headline font-bold text-primary text-xl mb-6">Agency Principal</h3>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-fixed text-2xl">person</span>
            </div>
            <div>
              <p className="font-headline font-bold text-lg text-primary">{principalName}</p>
              <p className="text-on-surface-variant text-sm">Managing Director, {agencyName}</p>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="material-symbols-outlined text-on-surface-variant">mail</span>
              <span className="text-primary font-medium">{principalEmail}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="material-symbols-outlined text-on-surface-variant">verified_user</span>
              <span className="text-primary font-medium">Super Admin Access</span>
            </div>
          </div>
        </div>

        {/* Secure Invite Link */}
        <div className="md:col-span-5 bg-surface-container-low p-8 rounded-xl border border-outline-variant/15 flex flex-col justify-between">
          <div>
            <h3 className="font-headline font-bold text-primary text-xl mb-2">Secure Link</h3>
            <p className="text-on-surface-variant text-xs mb-6 uppercase tracking-wider font-bold">Expires in 24 hours</p>
            <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/15 flex items-center justify-between gap-4 mb-4 overflow-hidden">
              <span className="text-sm font-medium text-primary truncate">{inviteLink}</span>
              <button className="flex-shrink-0 text-primary hover:text-surface-tint transition-colors">
                <span className="material-symbols-outlined text-xl">content_copy</span>
              </button>
            </div>
          </div>
          <button className="w-full bg-gradient-to-br from-primary to-primary-container py-3 rounded-lg text-on-primary font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:opacity-95 transition-opacity">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            Send Invitation Dossier
          </button>
        </div>

        {/* Meta Details */}
        <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Seat Count', value: seatCount.toString() },
            { label: 'Tier', value: tier },
            { label: 'Region', value: region },
            { label: 'Auto-Pilot AI', value: 'Active', pulse: true },
          ].map((item) => (
            <div key={item.label} className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/15">
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-2">{item.label}</p>
              <p className="font-headline font-bold text-2xl text-primary flex items-center gap-2">
                {item.value}
                {item.pulse && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-outline-variant/15">
        <Link
          href="/admin/agencies"
          className="text-on-surface-variant hover:text-primary font-medium text-sm flex items-center gap-2 transition-all group"
        >
          <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-1">arrow_back</span>
          Return to Agency Directory
        </Link>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-8 py-3 bg-surface-container-lowest border border-outline-variant text-primary font-bold text-sm rounded-lg hover:bg-surface-bright transition-colors">
            View Agency Profile
          </button>
          <button className="flex-1 md:flex-none px-8 py-3 bg-primary text-on-primary font-bold text-sm rounded-lg shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all">
            Launch Dashboard
          </button>
        </div>
      </div>
    </main>
  )
}
