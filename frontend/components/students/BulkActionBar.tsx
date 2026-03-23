'use client'

import { useState } from 'react'

interface BulkActionBarProps {
  selectedCount?: number
  selectedNames?: string[]
  onConfirm?: (status: string) => void
  onClose?: () => void
}

export default function BulkActionBar({
  selectedCount = 5,
  selectedNames = ['Alexander T.', 'Elena R.'],
  onConfirm,
  onClose,
}: BulkActionBarProps) {
  const [newStatus, setNewStatus] = useState('')

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary/20 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20">
        {/* Header */}
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-primary-fixed flex items-center justify-center rounded-xl">
              <span className="material-symbols-outlined text-primary">group_work</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>
          <h3 className="text-2xl font-bold text-primary">Bulk Action</h3>
          <p className="text-on-surface-variant mt-1">You are about to modify {selectedCount} selected student records.</p>
        </div>

        {/* Content */}
        <div className="px-8 py-6 bg-surface-container-low/50 space-y-6">
          {/* Student Pill Preview */}
          <div className="flex flex-wrap gap-2">
            {selectedNames.map((name) => (
              <div key={name} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-outline-variant/20 shadow-sm">
                <div className="h-5 w-5 rounded-full bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[12px] text-on-primary-fixed">person</span>
                </div>
                <span className="text-xs font-semibold text-primary">{name}</span>
              </div>
            ))}
            {selectedCount > selectedNames.length && (
              <div className="flex items-center gap-2 bg-primary-container/10 px-3 py-1.5 rounded-lg border border-primary-container/20">
                <span className="text-xs font-bold text-primary">+ {selectedCount - selectedNames.length} more</span>
              </div>
            )}
          </div>

          {/* Action Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-primary uppercase tracking-widest">Change Status to...</label>
              <div className="relative">
                <select
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3.5 appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium text-primary outline-none"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="">Select new status</option>
                  <option value="pending">Review Pending</option>
                  <option value="docs">Document Collection</option>
                  <option value="interview">Interview Process</option>
                  <option value="enrolled">Final Enrollment</option>
                  <option value="withdrawn">Application Withdrawn</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-surface-container rounded-xl border border-outline-variant/10">
              <span className="material-symbols-outlined text-on-surface-variant mt-0.5 text-sm">info</span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                This action will send an automated notification to the students and update the agency dashboard in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-surface-container text-on-surface-variant font-bold text-sm rounded-xl hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm?.(newStatus)}
            disabled={!newStatus}
            className="flex-1 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold text-sm rounded-xl shadow-lg shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply to {selectedCount} Students
          </button>
        </div>
      </div>
    </div>
  )
}
