'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, LayoutDashboard, Users, CheckSquare, Columns, BarChart2, FileText, Settings, UserPlus } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Student {
  id: string
  full_name: string
  preferred_name?: string | null
  status: string
}

interface CommandItem {
  id: string
  label: string
  sublabel?: string
  icon: React.ReactNode
  href: string
  keywords?: string
}

const NAV_COMMANDS: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} />, href: '/dashboard', keywords: 'home overview stats' },
  { id: 'students', label: 'Students', sublabel: 'View all students', icon: <Users size={14} />, href: '/students', keywords: 'list roster' },
  { id: 'add-student', label: 'Add Student', sublabel: 'Create a new student profile', icon: <UserPlus size={14} />, href: '/students/new', keywords: 'new create' },
  { id: 'approvals', label: 'Approvals', sublabel: 'Pending agent tasks', icon: <CheckSquare size={14} />, href: '/approvals', keywords: 'tasks pending review' },
  { id: 'kanban', label: 'Kanban', sublabel: 'Student pipeline board', icon: <Columns size={14} />, href: '/kanban', keywords: 'board pipeline drag' },
  { id: 'analytics', label: 'Analytics', sublabel: 'Charts and insights', icon: <BarChart2 size={14} />, href: '/analytics', keywords: 'charts graphs data' },
  { id: 'reports', label: 'Reports', sublabel: 'Generate reports', icon: <FileText size={14} />, href: '/reports', keywords: 'export pdf csv' },
  { id: 'settings', label: 'Settings', sublabel: 'Agency and account settings', icon: <Settings size={14} />, href: '/settings', keywords: 'config profile' },
]

export default function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Fetch students list once when opened
  useEffect(() => {
    if (!open) return
    setQuery('')
    setSelectedIdx(0)
    inputRef.current?.focus()

    apiFetch<{ students: Student[]; total: number } | Student[]>('/api/students?limit=200')
      .then((data) => {
        if (Array.isArray(data)) setStudents(data)
        else if (Array.isArray((data as { students: Student[] }).students)) setStudents((data as { students: Student[] }).students)
      })
      .catch(() => {})
  }, [open])

  const filteredNav = query
    ? NAV_COMMANDS.filter((c) =>
        `${c.label} ${c.sublabel ?? ''} ${c.keywords ?? ''}`.toLowerCase().includes(query.toLowerCase())
      )
    : NAV_COMMANDS

  const filteredStudents: CommandItem[] = students
    .filter((s) =>
      !query ||
      s.full_name.toLowerCase().includes(query.toLowerCase()) ||
      (s.preferred_name ?? '').toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 6)
    .map((s) => ({
      id: `student-${s.id}`,
      label: s.full_name,
      sublabel: s.preferred_name ? `"${s.preferred_name}" · ${s.status}` : s.status,
      icon: <span className="text-[11px] font-semibold text-white w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1D9E75' }}>
        {s.full_name[0].toUpperCase()}
      </span>,
      href: `/students/${s.id}/profile`,
    }))

  const allItems = [...filteredNav, ...filteredStudents]

  const navigate = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx((i) => Math.min(i + 1, allItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (allItems[selectedIdx]) navigate(allItems[selectedIdx].href)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, allItems, selectedIdx, navigate])

  // Reset selection when query changes
  useEffect(() => { setSelectedIdx(0) }, [query])

  if (!open) return null

  const showStudentHeader = filteredStudents.length > 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/40 backdrop-blur-[2px]"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white w-full max-w-xl rounded-[14px] shadow-2xl overflow-hidden"
        style={{ border: '0.5px solid #e5e7eb' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '0.5px solid #f3f4f6' }}>
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Go to page or search students…"
            className="flex-1 text-[14px] text-gray-900 placeholder-gray-400 bg-transparent outline-none"
          />
          <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-[4px] font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto py-1.5">
          {allItems.length === 0 && (
            <p className="px-4 py-6 text-[13px] text-gray-400 text-center">No results for "{query}"</p>
          )}

          {filteredNav.length > 0 && (
            <>
              {query === '' && (
                <p className="px-4 pt-1.5 pb-1 text-[10px] font-medium text-gray-400 uppercase tracking-[0.5px]">Navigation</p>
              )}
              {filteredNav.map((item, i) => {
                const isSelected = i === selectedIdx
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.href)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition"
                    style={{ backgroundColor: isSelected ? '#F0FAF5' : undefined }}
                  >
                    <span className="text-gray-400 shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-medium text-gray-900">{item.label}</span>
                      {item.sublabel && (
                        <span className="text-[11px] text-gray-400 ml-2">{item.sublabel}</span>
                      )}
                    </div>
                    {isSelected && (
                      <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-[4px] font-mono shrink-0">↵</kbd>
                    )}
                  </button>
                )
              })}
            </>
          )}

          {showStudentHeader && (
            <>
              <p className="px-4 pt-3 pb-1 text-[10px] font-medium text-gray-400 uppercase tracking-[0.5px]"
                style={{ borderTop: filteredNav.length > 0 ? '0.5px solid #f3f4f6' : undefined }}>
                Students
              </p>
              {filteredStudents.map((item, i) => {
                const globalIdx = filteredNav.length + i
                const isSelected = globalIdx === selectedIdx
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.href)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition"
                    style={{ backgroundColor: isSelected ? '#F0FAF5' : undefined }}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-medium text-gray-900">{item.label}</span>
                      {item.sublabel && (
                        <span className="text-[11px] text-gray-400 ml-2 capitalize">{item.sublabel}</span>
                      )}
                    </div>
                    {isSelected && (
                      <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-[4px] font-mono shrink-0">↵</kbd>
                    )}
                  </button>
                )
              })}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 px-4 py-2 text-[10px] text-gray-400"
          style={{ borderTop: '0.5px solid #f3f4f6' }}>
          <span><kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded-[3px]">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded-[3px]">↵</kbd> go</span>
          <span><kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded-[3px]">esc</kbd> close</span>
          <span className="ml-auto">⌘K to toggle</span>
        </div>
      </div>
    </div>
  )
}
