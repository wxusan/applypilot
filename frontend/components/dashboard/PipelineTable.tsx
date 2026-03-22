'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import StatusPill from '@/components/ui/StatusPill'
import { deadlineClass, formatDateMono } from '@/lib/utils'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Users } from 'lucide-react'

interface Application {
  id: string
  university_name: string
  status: string
  deadline_regular: string | null
}

interface Student {
  id: string
  full_name: string
  status: string
  season: string | null
  applications: Application[]
}

type SortKey = 'full_name' | 'status' | 'next_deadline'
type SortDir = 'asc' | 'desc'

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={11} className="text-gray-300 inline ml-1" />
  return sortDir === 'asc'
    ? <ChevronUp size={11} className="text-brand inline ml-1" />
    : <ChevronDown size={11} className="text-brand inline ml-1" />
}

export default function PipelineTable({ students }: { students: Student[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('full_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const statuses = useMemo(() => [...new Set(students.map(s => s.status))], [students])

  const filtered = useMemo(() => {
    let result = students
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(s => s.full_name.toLowerCase().includes(q))
    }
    if (statusFilter) {
      result = result.filter(s => s.status === statusFilter)
    }
    return result.slice().sort((a, b) => {
      let cmp = 0
      if (sortKey === 'full_name') {
        cmp = a.full_name.localeCompare(b.full_name)
      } else if (sortKey === 'status') {
        cmp = a.status.localeCompare(b.status)
      } else if (sortKey === 'next_deadline') {
        const da = a.applications.map(x => x.deadline_regular).filter(Boolean).sort().at(0) ?? 'zzzz'
        const db = b.applications.map(x => x.deadline_regular).filter(Boolean).sort().at(0) ?? 'zzzz'
        cmp = da.localeCompare(db)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [students, search, statusFilter, sortKey, sortDir])

  return (
    <div className="bg-white rounded-[10px]" style={{ border: '0.5px solid #e5e7eb' }}>
      <div className="px-5 py-3.5 flex items-center justify-between gap-4" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
        <h2 className="text-[15px] font-semibold text-gray-900 shrink-0">Pipeline</h2>
        <div className="flex items-center gap-2 flex-1 max-w-sm ml-auto">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search students…"
              aria-label="Search students by name"
              className="w-full h-7 pl-7 pr-3 text-[12px] rounded-[6px] bg-gray-50 focus:outline-none focus:ring-1 focus:ring-brand"
              style={{ border: '0.5px solid #e5e7eb' }}
            />
          </div>
          {/* Status filter */}
          {statuses.length > 0 && (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="h-7 px-2 text-[12px] rounded-[6px] bg-gray-50 focus:outline-none focus:ring-1 focus:ring-brand"
              style={{ border: '0.5px solid #e5e7eb' }}
            >
              <option value="">All statuses</option>
              {statuses.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '0.5px solid #e5e7eb' }}>
              <th
                className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px] cursor-pointer select-none hover:text-gray-600 transition-colors"
                onClick={() => handleSort('full_name')}
              >
                Student <SortIcon col="full_name" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px]">
                Universities
              </th>
              <th
                className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px] cursor-pointer select-none hover:text-gray-600 transition-colors"
                onClick={() => handleSort('status')}
              >
                Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th
                className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px] cursor-pointer select-none hover:text-gray-600 transition-colors"
                onClick={() => handleSort('next_deadline')}
              >
                Next Deadline <SortIcon col="next_deadline" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px]">
                Season
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  {students.length === 0 ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center" style={{ border: '0.5px solid #e5e7eb' }}>
                        <Users size={20} className="text-gray-300" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-gray-500">No students yet</p>
                        <p className="text-[12px] text-gray-400 mt-0.5">Add your first student to get started.</p>
                      </div>
                      <Link
                        href="/students/new"
                        className="h-8 px-4 rounded-[6px] text-[12px] font-medium text-white flex items-center transition hover:opacity-90"
                        style={{ backgroundColor: '#1D9E75' }}
                      >
                        Add Student
                      </Link>
                    </div>
                  ) : (
                    <p className="text-[13px] text-gray-400">No students match your search.</p>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((student, i) => {
                const nextDeadline = student.applications
                  .map((a) => a.deadline_regular)
                  .filter(Boolean)
                  .sort()
                  .at(0)

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    style={
                      i < filtered.length - 1 ? { borderBottom: '0.5px solid #e5e7eb' } : undefined
                    }
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/students/${student.id}/profile`}
                        className="text-[13px] font-medium text-gray-900 hover:text-brand-dark transition-colors"
                      >
                        {student.full_name}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {student.applications.slice(0, 3).map((app) => (
                          <span
                            key={app.id}
                            className="text-[11px] text-gray-500 bg-gray-50 rounded-[4px] px-1.5 py-0.5"
                            style={{ border: '0.5px solid #e5e7eb' }}
                          >
                            {app.university_name}
                          </span>
                        ))}
                        {student.applications.length > 3 && (
                          <span className="text-[11px] text-gray-400">
                            +{student.applications.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={student.status} />
                    </td>
                    <td className="px-5 py-3">
                      <span className={deadlineClass(nextDeadline)}>
                        {nextDeadline ? formatDateMono(nextDeadline) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-gray-500 font-mono">
                      {student.season ?? '—'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
