'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import StatusPill from '@/components/ui/StatusPill'
import { deadlineClass, formatDateMono, formatDate, formatDistanceToNow, getStatusStyle } from '@/lib/utils'
import { ChevronRight, CheckSquare, Square, X, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface App {
  id: string
  university_name: string
  status: string
  deadline_regular: string | null
}

interface Student {
  id: string
  full_name: string
  preferred_name: string | null
  email: string | null
  status: string
  season: string | null
  graduation_year: number | null
  gpa: number | null
  gpa_scale: number | null
  sat_total: number | null
  act_score: number | null
  created_at: string
  applications: App[]
}

const STATUS_OPTIONS = [
  'intake', 'forms', 'writing', 'review',
  'submitted', 'accepted', 'rejected',
] as const

function BulkActions({
  selectedIds,
  onClear,
  onApplied,
}: {
  selectedIds: Set<string>
  onClear: () => void
  onApplied: (ids: string[], newStatus: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { success: toastSuccess, error: toastError } = useToast()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleBulkStatus = async (newStatus: string) => {
    setOpen(false)
    setSaving(true)
    const ids = [...selectedIds]
    try {
      await Promise.all(
        ids.map((id) =>
          apiFetch(`/api/students/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
          })
        )
      )
      const st = getStatusStyle(newStatus)
      toastSuccess(`${ids.length} student${ids.length !== 1 ? 's' : ''} moved to ${st.label}`)
      onApplied(ids, newStatus)
      onClear()
    } catch {
      toastError('Failed to update some students. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-[8px] text-[13px]"
      style={{ backgroundColor: '#E1F5EE', border: '0.5px solid #A7D9C7' }}
    >
      <span className="font-medium text-[#0F6E56]">
        {selectedIds.size} selected
      </span>

      {/* Bulk status change */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={saving}
          className="flex items-center gap-1.5 h-7 px-3 rounded-[6px] text-[12px] font-medium text-white transition disabled:opacity-60"
          style={{ backgroundColor: '#1D9E75' }}
        >
          Change status
          <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div
            className="absolute left-0 top-full mt-1 z-50 bg-white rounded-[8px] py-1 min-w-[140px]"
            style={{ border: '0.5px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          >
            {STATUS_OPTIONS.map((s) => {
              const st = getStatusStyle(s)
              return (
                <button
                  key={s}
                  onClick={() => handleBulkStatus(s)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: st.color }}
                  />
                  <span className="text-[12px] font-medium capitalize" style={{ color: '#374151' }}>
                    {st.label}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <button
        onClick={onClear}
        className="flex items-center gap-1 h-7 px-2.5 rounded-[6px] text-[12px] text-gray-500 hover:bg-white/60 transition"
      >
        <X size={12} />
        Clear
      </button>
    </div>
  )
}

export default function StudentsTable({ students: initialStudents }: { students: Student[] }) {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Sync when prop changes (e.g. after page navigation)
  useEffect(() => {
    setStudents(initialStudents)
    setSelected(new Set())
  }, [initialStudents])

  const allIds = students.map((s) => s.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id))
  const someSelected = selected.size > 0

  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(allIds))
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleBulkApplied = (ids: string[], newStatus: string) => {
    setStudents((prev) =>
      prev.map((s) => (ids.includes(s.id) ? { ...s, status: newStatus } : s))
    )
    router.refresh()
  }

  const COLS = ['', 'Name', 'Status', 'Class', 'GPA', 'SAT / ACT', 'Universities', 'Next Deadline', 'Added', '']

  if (students.length === 0) {
    return (
      <div
        className="bg-white rounded-[10px] overflow-hidden"
        style={{ border: '0.5px solid #e5e7eb' }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '0.5px solid #e5e7eb' }}>
              {COLS.map((col) => (
                <th
                  key={col}
                  className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={COLS.length} className="px-5 py-10 text-center text-[13px] text-gray-400">
                No students match your filters.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Bulk action bar */}
      {someSelected && (
        <BulkActions
          selectedIds={selected}
          onClear={() => setSelected(new Set())}
          onApplied={handleBulkApplied}
        />
      )}

      <div
        className="bg-white rounded-[10px] overflow-hidden"
        style={{ border: '0.5px solid #e5e7eb' }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '0.5px solid #e5e7eb' }}>
              {/* Checkbox column */}
              <th className="pl-4 pr-2 py-2.5 w-8">
                <button
                  onClick={toggleAll}
                  className="text-gray-300 hover:text-gray-500 transition"
                  title={allSelected ? 'Deselect all' : 'Select all'}
                >
                  {allSelected ? (
                    <CheckSquare size={14} className="text-brand" />
                  ) : (
                    <Square size={14} />
                  )}
                </button>
              </th>
              {['Name', 'Status', 'Class', 'GPA', 'SAT / ACT', 'Universities', 'Next Deadline', 'Added'].map(
                (col) => (
                  <th
                    key={col}
                    className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px]"
                  >
                    {col}
                  </th>
                )
              )}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {students.map((student, i) => {
              const apps = student.applications ?? []
              const nextDeadline = apps
                .map((a) => a.deadline_regular)
                .filter(Boolean)
                .sort()
                .at(0)

              const isSelected = selected.has(student.id)

              return (
                <tr
                  key={student.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  style={{
                    borderBottom: i < students.length - 1 ? '0.5px solid #e5e7eb' : undefined,
                    backgroundColor: isSelected ? '#F0FAF5' : undefined,
                  }}
                  onClick={() => router.push(`/students/${student.id}/profile`)}
                >
                  {/* Checkbox */}
                  <td
                    className="pl-4 pr-2 py-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOne(student.id)
                    }}
                  >
                    <button className="text-gray-300 hover:text-brand transition">
                      {isSelected ? (
                        <CheckSquare size={14} className="text-brand" />
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex items-baseline gap-1.5">
                      <Link
                        href={`/students/${student.id}/profile`}
                        className="text-[13px] font-medium text-gray-900 hover:text-brand-dark transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {student.full_name}
                      </Link>
                      {student.preferred_name && student.preferred_name !== student.full_name && (
                        <span className="text-[11px] text-gray-400 italic">"{student.preferred_name}"</span>
                      )}
                    </div>
                    {student.email && (
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[200px]">
                        {student.email}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-3">
                    <StatusPill status={student.status} />
                  </td>

                  <td className="px-5 py-3 text-[13px] text-gray-600 font-mono">
                    {student.graduation_year ?? '—'}
                  </td>

                  <td className="px-5 py-3 text-[13px] text-gray-600 font-mono">
                    {student.gpa ? Number(student.gpa).toFixed(2) : '—'}
                  </td>

                  <td className="px-5 py-3 text-[13px] text-gray-600 font-mono">
                    {student.sat_total
                      ? student.sat_total
                      : student.act_score
                      ? `ACT ${student.act_score}`
                      : '—'}
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {apps.slice(0, 2).map((app) => (
                        <span
                          key={app.id}
                          className="text-[11px] text-gray-500 rounded-[4px] px-1.5 py-0.5 bg-gray-50 whitespace-nowrap"
                          style={{ border: '0.5px solid #e5e7eb' }}
                        >
                          {app.university_name}
                        </span>
                      ))}
                      {apps.length > 2 && (
                        <span className="text-[11px] text-gray-400">+{apps.length - 2}</span>
                      )}
                      {apps.length === 0 && <span className="text-[13px] text-gray-400">—</span>}
                    </div>
                  </td>

                  <td className="px-5 py-3">
                    <span className={deadlineClass(nextDeadline ?? null)}>
                      {nextDeadline ? formatDateMono(nextDeadline) : '—'}
                    </span>
                  </td>

                  <td className="px-5 py-3 text-[12px] text-gray-400">
                    {(() => {
                      const rel = formatDistanceToNow(new Date(student.created_at))
                      return (
                        <span title={formatDate(student.created_at)}>
                          {rel === 'just now' ? rel : `${rel} ago`}
                        </span>
                      )
                    })()}
                  </td>

                  <td className="px-3 py-3 text-gray-300 group-hover:text-gray-400 transition-colors">
                    <ChevronRight size={14} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
