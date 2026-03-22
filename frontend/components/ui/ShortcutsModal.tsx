'use client'

import { useEffect, useState } from 'react'
import { X, Keyboard } from 'lucide-react'

const SHORTCUTS = [
  {
    section: 'Navigation',
    items: [
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'S'], description: 'Go to Students' },
      { keys: ['G', 'A'], description: 'Go to Approvals' },
      { keys: ['G', 'K'], description: 'Go to Kanban' },
      { keys: ['G', 'R'], description: 'Go to Reports' },
      { keys: ['G', 'N'], description: 'Go to Analytics' },
      { keys: ['G', 'E'], description: 'Go to Settings' },
    ],
  },
  {
    section: 'Actions',
    items: [
      { keys: ['N'], description: 'New student' },
    ],
  },
  {
    section: 'Search & Commands',
    items: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close modal / palette' },
    ],
  },
]

export default function ShortcutsModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (['input', 'textarea', 'select'].includes(tag)) return

      if (e.key === '?') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-[12px] w-full max-w-md mx-4 overflow-hidden"
        style={{ border: '0.5px solid #e5e7eb', boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '0.5px solid #e5e7eb' }}
        >
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-gray-400" />
            <h2 className="text-[15px] font-semibold text-gray-900">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-5 space-y-5">
          {SHORTCUTS.map((section) => (
            <div key={section.section}>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px] mb-2">
                {section.section}
              </p>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <div key={item.description} className="flex items-center justify-between">
                    <span className="text-[13px] text-gray-600">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <kbd
                            className="text-[11px] font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-[4px] min-w-[20px] text-center"
                            style={{ border: '0.5px solid #d1d5db' }}
                          >
                            {key}
                          </kbd>
                          {i < item.keys.length - 1 && (
                            <span className="text-[10px] text-gray-400">then</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 text-center"
          style={{ borderTop: '0.5px solid #e5e7eb', backgroundColor: '#FAFAFA' }}
        >
          <p className="text-[11px] text-gray-400">
            Press <kbd className="font-mono bg-gray-100 px-1 rounded text-[10px]">?</kbd> to toggle this panel
          </p>
        </div>
      </div>
    </div>
  )
}
