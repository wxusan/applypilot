'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'

const CHANGELOG_VERSION = '1.2.0'

const CHANGELOG = [
  {
    version: '1.2.0',
    date: 'March 2026',
    changes: [
      'Command palette (⌘K) for quick navigation',
      'Bulk approve agent actions in one click',
      'Sortable, searchable pipeline table',
      'Student count badges in sidebar',
      'Session expiry warning with auto-refresh',
      'Analytics CSV export',
      'Admin system health dashboard',
      'Mobile-responsive sidebar with hamburger menu',
      'Forgot password email flow',
      'Notification center page',
    ],
  },
]

export default function WhatsNewModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('ap_whats_new_seen')
    if (seen !== CHANGELOG_VERSION) {
      // Small delay so it doesn't pop up immediately on login
      const timer = setTimeout(() => setOpen(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('ap_whats_new_seen', CHANGELOG_VERSION)
    setOpen(false)
  }

  if (!open) return null

  const latest = CHANGELOG[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-label="What's new in ApplyPilot">
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />
      <div
        className="relative w-full max-w-md bg-white rounded-[12px] shadow-2xl"
        style={{ border: '0.5px solid #e5e7eb' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '0.5px solid #f3f4f6' }}>
          <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center">
            <Sparkles size={14} className="text-brand" />
          </div>
          <div className="flex-1">
            <h2 className="text-[15px] font-semibold text-gray-900">What&apos;s New</h2>
            <p className="text-[11px] text-gray-400">Version {latest.version} · {latest.date}</p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close what's new"
            className="text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded"
          >
            <X size={16} />
          </button>
        </div>

        {/* Changes list */}
        <div className="px-6 py-4 max-h-[320px] overflow-y-auto">
          <ul className="space-y-2">
            {latest.changes.map((change, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-brand mt-0.5 shrink-0">✓</span>
                <span className="text-[13px] text-gray-700">{change}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end" style={{ borderTop: '0.5px solid #f3f4f6' }}>
          <button
            onClick={handleClose}
            className="h-9 px-5 rounded-[6px] text-[13px] font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
            style={{ backgroundColor: '#1D9E75' }}
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  )
}
