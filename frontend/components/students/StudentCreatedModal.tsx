'use client'

interface StudentCreatedModalProps {
  studentName?: string
  consultantName?: string
  targetIntake?: string
  onViewProfile?: () => void
  onStartAIReview?: () => void
  onAddAnother?: () => void
  onReturnDashboard?: () => void
}

export default function StudentCreatedModal({
  studentName = 'Alexander Sterling',
  consultantName = 'Dr. Julian Vance',
  targetIntake = 'Fall 2025',
  onViewProfile,
  onStartAIReview,
  onAddAnother,
  onReturnDashboard,
}: StudentCreatedModalProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px] rounded-xl overflow-hidden shadow-2xl shadow-primary/10">
      {/* Left Panel: Decorative */}
      <div className="md:col-span-5 bg-primary relative overflow-hidden flex flex-col justify-end p-10">
        {/* Abstract pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 rounded-full border border-primary-fixed"></div>
          <div className="absolute bottom-[20%] right-[-5%] w-48 h-48 rounded-full border border-primary-fixed"></div>
          <div className="absolute top-[30%] right-[10%] w-32 h-32 border border-primary-fixed rotate-45"></div>
        </div>
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary via-transparent to-primary-container pointer-events-none"></div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-surface-container-lowest/10 backdrop-blur-md rounded-lg flex items-center justify-center mb-8 border border-primary-fixed/20">
            <span className="material-symbols-outlined text-primary-fixed text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <h2 className="font-headline text-3xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Institutional <br />Elite Enrolled
          </h2>
          <p className="text-on-primary-container text-sm leading-relaxed max-w-[240px]">
            The student dossier has been successfully initialized within the Scholar Command ecosystem.
          </p>
        </div>
      </div>

      {/* Right Panel: Actions */}
      <div className="md:col-span-7 bg-surface-container-lowest p-8 md:p-12 flex flex-col justify-center">
        <div className="mb-10">
          <div className="inline-flex items-center px-3 py-1 bg-primary-fixed/30 text-primary text-[10px] font-bold tracking-widest uppercase rounded-full mb-6">
            System Confirmation
          </div>
          <h1 className="font-headline text-2xl font-bold text-primary mb-2">Student dossier finalized.</h1>
          <p className="text-on-surface-variant text-sm">{studentName} has been added to the Active Pipeline. What is your next objective?</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onViewProfile}
            className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-4 px-6 rounded-lg flex items-center justify-between group transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <span className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-fixed">person</span>
              <span className="font-label text-sm font-semibold">View Student Profile</span>
            </span>
            <span className="material-symbols-outlined text-sm opacity-50 group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>

          <button
            onClick={onStartAIReview}
            className="w-full bg-surface-container text-primary py-4 px-6 rounded-lg flex items-center justify-between hover:bg-surface-container-high transition-colors border border-outline-variant/15"
          >
            <span className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="font-label text-sm font-semibold">Start AI Profile Review</span>
            </span>
            <span className="material-symbols-outlined text-sm opacity-50">bolt</span>
          </button>

          <div className="pt-4 mt-4 border-t border-outline-variant/10 flex flex-col sm:flex-row gap-4">
            <button
              onClick={onAddAnother}
              className="flex-1 text-on-surface-variant hover:text-primary py-2 px-4 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Add Another Student
            </button>
            <button
              onClick={onReturnDashboard}
              className="flex-1 text-on-surface-variant hover:text-primary py-2 px-4 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">dashboard</span>
              Return to Dashboard
            </button>
          </div>
        </div>

        {/* Dossier Preview */}
        <div className="mt-12 grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low p-4 rounded-lg">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Assigned Consultant</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[12px] text-on-primary-fixed">person</span>
              </div>
              <span className="text-xs font-semibold text-primary">{consultantName}</span>
            </div>
          </div>
          <div className="bg-surface-container-low p-4 rounded-lg">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Target Intake</p>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xs text-primary">calendar_today</span>
              <span className="text-xs font-semibold text-primary">{targetIntake}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
