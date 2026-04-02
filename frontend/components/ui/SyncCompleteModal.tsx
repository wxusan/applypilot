'use client'

interface SyncCompleteModalProps {
  studentName?: string
  gpa?: string
  school?: string
  apCourses?: number
  accuracyRating?: number
  onContinue?: () => void
  onReviewData?: () => void
  onExportReport?: () => void
}

export default function SyncCompleteModal({
  studentName = '',
  gpa = '—',
  school = '—',
  apCourses = 0,
  accuracyRating = 100,
  onContinue,
  onReviewData,
  onExportReport,
}: SyncCompleteModalProps) {
  return (
    <main className="max-w-4xl mx-auto px-6 pt-12 pb-24">
      {/* Success Hero */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-fixed text-primary rounded-full mb-6">
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-primary mb-4">Pilot Sync Complete</h1>
        <p className="text-on-surface-variant text-lg max-w-xl mx-auto">The Pilot Agent has successfully extracted and populated your data into the institution portal.</p>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
        {/* Personal Information Card */}
        <div className="md:col-span-7 bg-surface-container-lowest rounded-xl p-8 shadow-[0_4px_20px_rgba(3,22,53,0.04)] border border-outline-variant/15 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary-container mb-2 block">Task Success</span>
              <h3 className="font-headline text-2xl font-bold text-primary">Personal Information</h3>
            </div>
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-surface-container-low rounded-lg">
              <span className="material-symbols-outlined text-primary-container">id_card</span>
              <span className="text-sm font-medium text-on-surface">Biographic details mapped</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-surface-container-low rounded-lg">
              <span className="material-symbols-outlined text-primary-container">location_on</span>
              <span className="text-sm font-medium text-on-surface">Address &amp; Residency verified</span>
            </div>
          </div>
        </div>

        {/* Accuracy Rating */}
        <div className="md:col-span-5 bg-gradient-to-br from-primary to-primary-container rounded-xl p-8 text-on-primary flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,#ffffff_0%,transparent_70%)]"></div>
          <div className="relative z-10 text-center">
            <span className="material-symbols-outlined text-5xl mb-4 block">psychology</span>
            <div className="text-3xl font-bold font-headline mb-1">{accuracyRating}%</div>
            <div className="text-xs uppercase tracking-widest opacity-70">Accuracy Rating</div>
          </div>
        </div>

        {/* Education History */}
        <div className="md:col-span-12 bg-surface-container-lowest rounded-xl p-8 shadow-[0_4px_20px_rgba(3,22,53,0.04)] border border-outline-variant/15">
          <div className="flex items-center gap-4 mb-8">
            <span className="material-symbols-outlined text-primary text-3xl">school</span>
            <h3 className="font-headline text-2xl font-bold text-primary">Education History</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'GPA & Ranking', value: `Unweighted ${gpa}` },
              { label: 'Institution', value: school },
              { label: 'Coursework', value: `${apCourses} AP Courses Sync'd` },
            ].map((item) => (
              <div key={item.label} className="border border-outline-variant/20 rounded-xl p-5 hover:bg-surface-bright transition-all">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-on-surface-variant">{item.label}</span>
                  <span className="material-symbols-outlined text-primary text-sm">task_alt</span>
                </div>
                <p className="font-bold text-primary">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 bg-surface-container-low rounded-2xl border border-outline-variant/10">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-surface-container-highest rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-container">pending_actions</span>
          </div>
          <div>
            <p className="text-sm font-bold text-primary">Up Next: Test Scores</p>
            <p className="text-xs text-on-surface-variant">Standardized testing &amp; language proficiency</p>
          </div>
        </div>
        <button
          onClick={onContinue}
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-headline font-bold text-sm tracking-tight flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
        >
          Continue to Next Section
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="mt-8 flex justify-center gap-8">
        <button
          onClick={onReviewData}
          className="text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">undo</span>
          Review Filled Data
        </button>
        <button
          onClick={onExportReport}
          className="text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          Export Report
        </button>
      </div>
    </main>
  )
}
