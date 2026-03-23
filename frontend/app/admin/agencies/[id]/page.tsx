'use client'

import { useState } from 'react'

export default function AdminAgencyDetailPage() {
  const [showSuspendModal, setShowSuspendModal] = useState(true)
  const [suspendReason, setSuspendReason] = useState('')

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">

      {/* Main Content Area */}
      <main className="pt-24 min-h-screen p-8 bg-surface">
        <div className="max-w-6xl mx-auto">

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-6 text-on-surface-variant text-sm font-label">
            <span>Super Admin</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span>Agency Directory</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary font-semibold">Elite Ivy Consulting</span>
          </div>

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="font-headline text-3xl font-extrabold text-primary tracking-tight mb-2">Agency Profile</h2>
              <p className="text-on-surface-variant max-w-xl">
                Review agency credentials, active Pilot seats, and compliance status before performing administrative actions.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 rounded-xl border border-outline-variant font-label text-sm font-semibold hover:bg-surface-container-low transition-colors">
                View Logs
              </button>
              <button
                onClick={() => setShowSuspendModal(true)}
                className="px-5 py-2.5 rounded-xl bg-error text-on-error font-label text-sm font-semibold shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">block</span>
                Suspend Agency
              </button>
            </div>
          </div>

          {/* Bento Grid Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Agency Summary Card */}
            <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-8 shadow-[0_4px_20px_rgba(3,22,53,0.04)] border border-outline-variant/15">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center text-on-primary">
                    <span className="material-symbols-outlined text-3xl">corporate_fare</span>
                  </div>
                  <div>
                    <h3 className="font-headline text-xl font-bold text-primary">Elite Ivy Consulting</h3>
                    <p className="text-on-surface-variant font-label text-sm">Enterprise License · Joined Jan 2023</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-green-100">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-1">Students</p>
                  <p className="text-xl font-headline font-bold text-primary">1,248</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-1">Advisors</p>
                  <p className="text-xl font-headline font-bold text-primary">42</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-1">Storage</p>
                  <p className="text-xl font-headline font-bold text-primary">84%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-1">Compliance</p>
                  <p className="text-xl font-headline font-bold text-primary">98/100</p>
                </div>
              </div>
            </div>

            {/* Contact Info Card */}
            <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10">
              <h4 className="font-headline text-sm font-bold text-primary mb-6">Primary Contact</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">person</span>
                  <span className="text-sm font-medium">Dr. Julian Thorne</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">mail</span>
                  <span className="text-sm font-medium">thorne@eliteivy.edu</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">phone</span>
                  <span className="text-sm font-medium">+1 (555) 902-3491</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Suspension Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            onClick={() => setShowSuspendModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-[0_40px_60px_rgba(3,22,53,0.15)] overflow-hidden">

            {/* Modal Header */}
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 rounded-xl bg-error-container flex items-center justify-center text-error">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                </div>
                <button
                  onClick={() => setShowSuspendModal(false)}
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <h3 className="font-headline text-2xl font-extrabold text-primary tracking-tight">Suspend Agency Account</h3>
              <p className="text-on-surface-variant mt-2 text-sm leading-relaxed">
                Suspending <span className="font-bold text-primary">Elite Ivy Consulting</span> will immediately revoke access for all 42 advisors and 1,248 students. Active Pilot AI sessions will be terminated.
              </p>
            </div>

            {/* Modal Body */}
            <div className="px-8 pb-8">
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                    Reason for Suspension
                  </label>
                  <div className="relative">
                    <textarea
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder:text-on-surface-variant/50"
                      placeholder="E.g., Contractual breach, payment failure, or policy violation..."
                      rows={4}
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      maxLength={500}
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] font-bold text-on-surface-variant/40">
                      {suspendReason.length} / 500
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-error-container/30 rounded-xl border border-error-container">
                  <span className="material-symbols-outlined text-error text-xl">info</span>
                  <p className="text-[11px] font-medium text-on-error-container leading-tight">
                    The agency administrator will receive an automated notification including the reason provided above.
                  </p>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSuspendModal(false)}
                    className="flex-1 px-6 py-3.5 rounded-xl border border-outline-variant font-label text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[1.5] px-6 py-3.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-label text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    Confirm Suspension
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
