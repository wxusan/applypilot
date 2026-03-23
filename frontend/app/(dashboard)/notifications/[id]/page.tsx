import Link from 'next/link'

export default function NotificationDetailPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Back Action */}
      <Link href="/notifications" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group w-fit">
        <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
        <span className="font-label font-medium text-sm">Back to Notifications</span>
      </Link>

      {/* Detail Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Focus Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Notification Card */}
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_40px_40px_rgba(3,22,53,0.06)] border-l-4 border-error relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-8xl text-error">priority_high</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full text-xs font-bold font-headline uppercase tracking-wider">High Priority</span>
                <span className="text-on-surface-variant text-sm font-label">2 hours ago</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-primary mb-6 leading-tight">
                Urgent: Application Deadline in 24h
              </h1>
              <div className="mb-8">
                <p className="text-on-surface-variant text-lg leading-relaxed">
                  The early action submission window for <span className="font-semibold text-primary">Stanford University</span> is closing soon. According to our current tracking, <span className="font-semibold text-primary">Alex Chen&apos;s</span> final personal statement revision is still pending review. Immediate action is required to ensure a successful submission.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <button className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-lg font-headline font-bold text-base shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                  View Deadline
                </button>
                <button className="px-8 py-3 rounded-lg font-headline font-bold text-base border-2 border-outline-variant/30 text-primary hover:bg-surface-container-high transition-all">
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="bg-surface-container-low rounded-xl p-8">
            <h3 className="font-headline font-bold text-primary text-xl mb-6">Submission Timeline</h3>
            <div className="space-y-6 relative">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-outline-variant/30"></div>
              <div className="flex gap-6 relative items-start">
                <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center z-10 flex-shrink-0">
                  <span className="material-symbols-outlined text-sm text-on-primary-fixed">check</span>
                </div>
                <div>
                  <p className="font-headline font-bold text-primary">Common App Profile Completed</p>
                  <p className="text-sm text-on-surface-variant">Oct 12, 2023 • 14:20 PM</p>
                </div>
              </div>
              <div className="flex gap-6 relative items-start">
                <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center z-10 flex-shrink-0">
                  <span className="material-symbols-outlined text-sm text-on-primary-fixed">check</span>
                </div>
                <div>
                  <p className="font-headline font-bold text-primary">Letter of Recommendations Uploaded</p>
                  <p className="text-sm text-on-surface-variant">Oct 20, 2023 • 09:15 AM</p>
                </div>
              </div>
              <div className="flex gap-6 relative items-start">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-surface-tint flex items-center justify-center z-10 flex-shrink-0 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-surface-tint"></div>
                </div>
                <div>
                  <p className="font-headline font-bold text-primary">Final Essay Submission</p>
                  <p className="text-sm text-error font-medium">Pending Review • Due in 23h 42m</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Related Student */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
            <h3 className="font-headline font-bold text-primary mb-4">Related Student</h3>
            <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-lg group cursor-pointer hover:bg-surface-container-high transition-all">
              <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 ring-4 ring-white shadow-sm bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant">person</span>
              </div>
              <div className="flex-1">
                <h4 className="font-headline font-bold text-primary">Alex Chen</h4>
                <p className="text-xs text-on-surface-variant font-medium">Senior • GPA 3.98</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Target School</span>
                <span className="font-bold text-primary">Stanford</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Application Type</span>
                <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-[11px] font-bold uppercase">Early Action</span>
              </div>
              <div className="pt-4 border-t border-outline-variant/20">
                <a href="#" className="text-surface-tint font-bold text-sm flex items-center gap-1 hover:underline">
                  Open Alex&apos;s Full Dossier
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-primary text-on-primary rounded-xl p-6 shadow-xl">
            <h3 className="font-headline font-bold text-lg mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-lg flex items-center justify-center gap-3 font-medium">
                <span className="material-symbols-outlined text-[20px]">mail</span>
                Email Student
              </button>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-lg flex items-center justify-center gap-3 font-medium">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
                Snooze for 4h
              </button>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-lg flex items-center justify-center gap-3 font-medium">
                <span className="material-symbols-outlined text-[20px]">share</span>
                Reassign Task
              </button>
            </div>
          </div>

          {/* Pilot AI Insight */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-white/40 shadow-2xl shadow-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="font-headline font-extrabold text-sm tracking-widest text-primary uppercase">Pilot AI Analysis</span>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Historically, Alex submits drafts late Friday night. I suggest sending a brief reminder via SMS now to increase chances of a pre-deadline review.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
