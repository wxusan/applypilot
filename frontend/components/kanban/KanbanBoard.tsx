'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

type Application = {
  id: string
  university_name: string
  status: string
  deadline_regular: string | null
}

type Student = {
  id: string
  full_name: string
  status: string
  season: string | null
  applications: Application[]
  assigned_staff_name: string | null
}

const COLUMNS: { id: string; label: string; color: string; bg: string; border: string }[] = [
  { id: 'intake',    label: 'Intake',    color: '#374151', bg: '#F9FAFB', border: '#E5E7EB' },
  { id: 'active',   label: 'Active',    color: '#185FA5', bg: '#EFF6FF', border: '#BFDBFE' },
  { id: 'submitted',label: 'Submitted', color: '#854F0B', bg: '#FFFBEB', border: '#FDE68A' },
  { id: 'accepted', label: 'Accepted',  color: '#166534', bg: '#F0FDF4', border: '#BBF7D0' },
  { id: 'rejected', label: 'Rejected',  color: '#991B1B', bg: '#FFF1F2', border: '#FECDD3' },
]

function nextDeadline(apps: Application[]): string | null {
  const future = apps
    .filter((a) => a.deadline_regular)
    .map((a) => a.deadline_regular!)
    .filter((d) => new Date(d) >= new Date())
    .sort()
  return future[0] ?? null
}

function formatDeadline(d: string): string {
  const date = new Date(d)
  const diff = Math.ceil((date.getTime() - Date.now()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return `${Math.abs(diff)}d ago`
  return `${diff}d`
}

function StudentCard({
  student,
  onDragStart,
}: {
  student: Student
  onDragStart: (e: React.DragEvent, id: string) => void
}) {
  const deadline = nextDeadline(student.applications)
  const appCount = student.applications.length
  const deadlineDiff = deadline
    ? Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
    : null
  const deadlineUrgent = deadlineDiff !== null && deadlineDiff <= 3

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, student.id)}
      className="bg-white rounded-[8px] p-3 cursor-grab active:cursor-grabbing select-none"
      style={{
        border: '0.5px solid #e5e7eb',
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/students/${student.id}`}
          className="text-[13px] font-medium text-gray-900 hover:text-[#0F6E56] truncate"
          onClick={(e) => e.stopPropagation()}
        >
          {student.full_name}
        </Link>
        {student.season && (
          <span className="text-[10px] text-gray-400 shrink-0">{student.season}</span>
        )}
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">🏫</span>
          <span className="text-[11px] text-gray-500">
            {appCount} {appCount === 1 ? 'school' : 'schools'}
          </span>
        </div>

        {deadline && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">📅</span>
            <span
              className="text-[11px] font-medium"
              style={{ color: deadlineUrgent ? '#B91C1C' : '#6B7280' }}
            >
              {formatDeadline(deadline)}
            </span>
          </div>
        )}

        {student.assigned_staff_name && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400">👤</span>
            <span className="text-[11px] text-gray-400 truncate">{student.assigned_staff_name}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function KanbanColumn({
  col,
  students,
  onDragStart,
  onDrop,
  onDragOver,
  onDragLeave,
  isOver,
}: {
  col: typeof COLUMNS[number]
  students: Student[]
  onDragStart: (e: React.DragEvent, id: string) => void
  onDrop: (e: React.DragEvent, colId: string) => void
  onDragOver: (e: React.DragEvent, colId: string) => void
  onDragLeave: () => void
  isOver: boolean
}) {
  return (
    <div
      className="flex flex-col rounded-[10px] min-h-[400px] flex-1"
      style={{
        backgroundColor: isOver ? col.bg : '#FAFAFA',
        border: `0.5px solid ${isOver ? col.border : '#E5E7EB'}`,
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        minWidth: 180,
      }}
      onDragOver={(e) => onDragOver(e, col.id)}
      onDrop={(e) => onDrop(e, col.id)}
      onDragLeave={onDragLeave}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ borderBottom: `0.5px solid ${col.border}` }}
      >
        <span className="text-[12px] font-semibold" style={{ color: col.color }}>
          {col.label}
        </span>
        <span
          className="text-[11px] font-medium rounded-full px-2 py-0.5"
          style={{ backgroundColor: col.border, color: col.color }}
        >
          {students.length}
        </span>
      </div>

      {/* Cards */}
      <div className="p-2 space-y-2 flex-1">
        {students.map((s) => (
          <StudentCard key={s.id} student={s} onDragStart={onDragStart} />
        ))}
        {students.length === 0 && (
          <div className="flex items-center justify-center h-20 text-[11px] text-gray-300">
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard({ students: initialStudents }: { students: Student[] }) {
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [overColumn, setOverColumn] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const dragIdRef = useRef<string | null>(null)

  const grouped = useCallback(() => {
    const map: Record<string, Student[]> = {}
    for (const col of COLUMNS) map[col.id] = []
    for (const s of students) {
      const colId = COLUMNS.find((c) => c.id === s.status) ? s.status : 'intake'
      map[colId].push(s)
    }
    return map
  }, [students])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragIdRef.current = id
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverColumn(colId)
  }

  const handleDragLeave = () => {
    setOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    setOverColumn(null)
    const id = dragIdRef.current
    dragIdRef.current = null
    if (!id) return

    const student = students.find((s) => s.id === id)
    if (!student || student.status === colId) return

    // Optimistic update
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: colId } : s))
    )

    setSaving(id)
    try {
      await apiFetch(`/api/students/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: colId }),
      })
    } catch (err) {
      // Revert on error
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: student.status } : s))
      )
      console.error('Failed to update student status:', err)
    } finally {
      setSaving(null)
    }
  }

  const cols = grouped()

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
      {COLUMNS.map((col) => (
        <KanbanColumn
          key={col.id}
          col={col}
          students={cols[col.id] ?? []}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          isOver={overColumn === col.id}
        />
      ))}
      {saving && (
        <div
          className="fixed bottom-4 right-4 text-[12px] text-white rounded-[6px] px-3 py-2"
          style={{ backgroundColor: '#1D9E75' }}
        >
          Saving…
        </div>
      )}
    </div>
  )
}
