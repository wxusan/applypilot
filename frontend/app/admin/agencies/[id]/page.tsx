'use client'

import { useState } from 'react'

export default function AdminAgencyDetailPage() {
  const [studentLimit, setStudentLimit] = useState(250)
  const [staffLimit, setStaffLimit] = useState(15)

  return (
    <div className="relative min-h-screen">
      {/* Dashboard Background (Simulated) */}
      <section className="p-10 opacity-40 select-none pointer-events-none">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 space-y-8">
            <div className="h-64 bg-surface-container-low rounded-xl"></div>
            <div className="grid grid-cols-2 gap-8">
              <div className="h-40 bg-surface-container-low rounded-xl"></div>
              <div className="h-40 bg-surface-container-low rounded-xl"></div>
            </div>
          </div>
          <div className="col-span-4 h-full bg-surface-container-low rounded-xl"></div>
        </div>
      </section>

      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#031635]/40 backdrop-blur-sm">
        {/* Modal Container */}
        <div className="w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-[0_40px_100px_rgba(3,22,53,0.12)] border border-outline-variant/15 overflow-hidden">
          {/* Modal Header */}
          <div className="px-8 py-6 border-b border-surface-container-low flex justify-between items-center">
            <div>
              <h3 className="font-headline text-2xl font-bold text-primary tracking-tight">Plan Limit Override</h3>
              <p className="font-body text-sm text-on-surface-variant mt-1">
                Directly increase operational capacity for Ivy Path Consulting.
              </p>
            </div>
            <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-8 py-8 space-y-10">
            {/* Current Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Current Tier</span>
                <div className="flex items-center gap-2">
                  <span className="font-headline font-bold text-lg text-primary">Enterprise Platinum</span>
                  <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed text-[10px] font-bold rounded-full">ACTIVE</span>
                </div>
              </div>
              <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Agency ID</span>
                <div className="font-headline font-bold text-lg text-primary">#IPC-772-09</div>
              </div>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {/* Student Seats */}
              <div className="space-y-4">
                <label className="block">
                  <span className="font-headline text-sm font-bold text-primary flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-lg">school</span>
                    Student Seat Limit
                  </span>
                  <div className="relative">
                    <input
                      className="w-full h-12 bg-surface-container px-4 rounded-lg border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body font-semibold text-primary"
                      type="number"
                      value={studentLimit}
                      onChange={(e) => setStudentLimit(Number(e.target.value))}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-label text-xs font-medium">
                      Current: 150
                    </div>
                  </div>
                  <span className="text-[11px] text-on-surface-variant mt-2 block italic">
                    Setting this to 0 grants unlimited student slots.
                  </span>
                </label>
              </div>

              {/* Staff Seats */}
              <div className="space-y-4">
                <label className="block">
                  <span className="font-headline text-sm font-bold text-primary flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-lg">group</span>
                    Consultant Seat Limit
                  </span>
                  <div className="relative">
                    <input
                      className="w-full h-12 bg-surface-container px-4 rounded-lg border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body font-semibold text-primary"
                      type="number"
                      value={staffLimit}
                      onChange={(e) => setStaffLimit(Number(e.target.value))}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-label text-xs font-medium">
                      Current: 10
                    </div>
                  </div>
                  <span className="text-[11px] text-on-surface-variant mt-2 block italic">
                    Maximum staff seats allowed for this agency&apos;s domain.
                  </span>
                </label>
              </div>

              {/* Override Reason (Full Width) */}
              <div className="md:col-span-2 space-y-4">
                <label className="block">
                  <span className="font-headline text-sm font-bold text-primary flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-lg">description</span>
                    Administrative Reason
                  </span>
                  <textarea
                    className="w-full bg-surface-container px-4 py-3 rounded-lg border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body text-sm resize-none"
                    placeholder="Explain why this manual override is being applied (e.g., Annual bulk expansion package)"
                    rows={3}
                  />
                </label>
              </div>
            </div>

            {/* Safety Warning */}
            <div className="flex gap-4 p-4 bg-error-container/20 rounded-xl border border-error-container/30">
              <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <div className="space-y-1">
                <p className="font-headline text-sm font-bold text-on-error-container">Manual Override Precaution</p>
                <p className="font-body text-xs text-on-error-container/80 leading-relaxed">
                  Increasing seats manually will bypass standard billing checks. Ensure the agency has cleared financial requirements before confirming these changes.
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-8 py-6 bg-surface-container-low flex items-center justify-end gap-4">
            <button className="px-6 h-11 font-label font-bold text-sm text-secondary hover:text-primary transition-colors">
              Cancel
            </button>
            <button className="px-8 h-11 bg-gradient-to-br from-primary to-primary-container text-white font-label font-bold text-sm rounded-lg shadow-lg shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2">
              Apply Override
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
