'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, CheckSquare, BarChart2, Settings, Kanban,
  UserCog, Bell, Search, X,
} from 'lucide-react'

const COMMANDS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'Navigation' },
  { label: 'Students', href: '/students', icon: Users, group: 'Navigation' },
  { label: 'Approvals', href: '/approvals', icon: CheckSquare, group: 'Navigation' },
  { label: 'Kanban Board', href: '/kanban', icon: Kanban, group: 'Navigation' },
  { label: 'Analytics', href: '/analytics', icon: BarChart2, group: 'Navigation' },
  { label: 'Settings', href: '/settings', icon: Settings, group: 'Navigation' },
  { label: 'Staff Management', href: '/settings/staff', icon: UserCog, group: 'Navigation' },
  { label: 'Notifications', href: '/notifications', icon: Bell, group: 'Navigation' },
  { label: 'Add New Student', href: '/students/new', icon: Users, group: 'Actions' },
  { label: 'Billing', href: '/settings/billing', icon: Settings, group: 'Settings' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
        setQuery('')
        setActiveIdx(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const filtered = query.trim()
    ? COMMANDS.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.group.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS

  const handleSelect = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[activeIdx]) {
      handleSelect(filtered[activeIdx].href)
    }
  }

  if (!open) return null

  const groups = [...new Set(filtered.map(c => c.group))]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" role="dialog" aria-label="Command palette">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />

      {/* Panel */}
      <div
        className="relative w-full max-w-[480px] mx-4 bg-white rounded-[12px] shadow-2xl overflow-hidden"
        style={{ border: '0.5px solid #e5e7eb' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '0.5px solid #f3f4f6' }}>
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages and actions…"
            aria-label="Command search"
            className="flex-1 text-[14px] text-gray-900 bg-transparent focus:outline-none placeholder:text-gray-400"
          />
          <button onClick={() => setOpen(false)} aria-label="Close command palette">
            <X size={14} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-gray-400">No results found.</p>
          ) : (
            groups.map(group => {
              const items = filtered.filter(c => c.group === group)
              return (
                <div key={group}>
                  <p className="px-4 py-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-[0.5px]">
                    {group}
                  </p>
                  {items.map((cmd) => {
                    const globalIdx = filtered.indexOf(cmd)
                    const Icon = cmd.icon
                    return (
                      <button
                        key={cmd.href}
                        onClick={() => handleSelect(cmd.href)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                        style={globalIdx === activeIdx ? { backgroundColor: '#E1F5EE' } : {}}
                        onMouseEnter={() => setActiveIdx(globalIdx)}
                      >
                        <Icon size={14} className={globalIdx === activeIdx ? 'text-brand' : 'text-gray-400'} />
                        <span className={`text-[13px] ${globalIdx === activeIdx ? 'text-brand-dark font-medium' : 'text-gray-700'}`}>
                          {cmd.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: '0.5px solid #f3f4f6' }}>
          <span className="text-[11px] text-gray-400">
            <kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[10px]">↑↓</kbd> navigate
            {' · '}
            <kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[10px]">↵</kbd> select
            {' · '}
            <kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[10px]">Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}
