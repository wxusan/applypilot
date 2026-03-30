'use client'

import { useState } from 'react'
import { Check, Undo2, Pencil, Trash2, X, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch, deadlinesApi } from '@/lib/api'

const DEADLINE_TYPES = [
  { value: 'application', label: 'Application' },
  { value: 'financial_aid', label: 'Financial Aid' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'test', label: 'Test Registration' },
  { value: 'document', label: 'Document' },
  { value: 'interview', label: 'Interview' },
  { value: 'decision', label: 'Decision' },
  { value: 'custom', label: 'Custom' },
]

interface Deadline {
  id: string
  title: string
  type: string | null
  due_date: string
  is_complete: boolean
  alert_days_before: number[]
}

interface DeadlineActionsProps {
  deadline: Deadline
}

export default function DeadlineActions({ deadline }: DeadlineActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [addingToCalendar, setAddingToCalendar] = useState(false)

  // Edit state
  const [editTitle, setEditTitle] = useState(deadline.title)
  const [editType, setEditType] = useState(deadline.type ?? 'application')
  const [editDate, setEditDate] = useState(deadline.due_date)
  const [editAlerts, setEditAlerts] = useState(
    (deadline.alert_days_before ?? [30, 14, 7, 3, 1]).join(', ')
  )
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  async function handleToggleComplete() {
    setCompleting(true)
    try {
      const path = deadline.is_complete
        ? `/api/deadlines/${deadline.id}/uncomplete`
        : `/api/deadlines/${deadline.id}/complete`
      await apiFetch(path, { method: 'POST' })
      router.refresh()
    } finally {
      setCompleting(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    setDeleting(true)
    try {
      await apiFetch(`/api/deadlines/${deadline.id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function handleAddToCalendar() {
    setAddingToCalendar(true)
    try {
      const response = await deadlinesApi.addToCalendar(deadline.id)
      window.open(response.calendar_url, '_blank')
    } finally {
      setAddingToCalendar(false)
    }
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editTitle.trim() || !editDate) {
      setEditError('Title and due date are required')
      return
    }
    setEditLoading(true)
    setEditError(null)

    // Parse comma-separated alert days
    const alertDays = editAlerts
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0)

    try {
      await apiFetch(`/api/deadlines/${deadline.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editTitle.trim(),
          type: editType,
          due_date: editDate,
          alert_days_before: alertDays.length > 0 ? alertDays : [30, 14, 7, 3, 1],
        }),
      })
      setEditOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Calendar */}
        <button
          onClick={handleAddToCalendar}
          disabled={addingToCalendar}
          className="h-7 w-7 rounded-[5px] flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
          title="Add to Google Calendar"
        >
          <Calendar size={12} />
        </button>

        {/* Complete/Uncomplete */}
        <button
          onClick={handleToggleComplete}
          disabled={completing}
          className={`h-7 w-7 rounded-[5px] flex items-center justify-center transition
            ${deadline.is_complete
              ? 'text-[#3B6D11] hover:bg-green-50'
              : 'text-gray-400 hover:text-[#3B6D11] hover:bg-green-50'
            }`}
          title={deadline.is_complete ? 'Mark incomplete' : 'Mark complete'}
        >
          {deadline.is_complete ? <Undo2 size={12} /> : <Check size={12} />}
        </button>

        {/* Edit */}
        {!deadline.is_complete && (
          <button
            onClick={() => setEditOpen(true)}
            className="h-7 w-7 rounded-[5px] flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            title="Edit deadline"
          >
            <Pencil size={12} />
          </button>
        )}

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`h-7 px-1.5 rounded-[5px] flex items-center gap-1 text-[11px] transition
            ${confirmDelete
              ? 'bg-[#A32D2D] text-white'
              : 'text-gray-400 hover:text-[#A32D2D] hover:bg-red-50'
            }`}
          title={confirmDelete ? 'Click again to confirm' : 'Delete deadline'}
        >
          <Trash2 size={11} />
          {confirmDelete ? 'Sure?' : ''}
        </button>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div
            className="bg-white rounded-[12px] w-full max-w-sm p-6"
            style={{ border: '0.5px solid #e5e7eb' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-semibold text-gray-900">Edit Deadline</h2>
              <button
                onClick={() => setEditOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                  style={{ border: '0.5px solid #d1d5db' }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">Type</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75] bg-white"
                  style={{ border: '0.5px solid #d1d5db' }}
                >
                  {DEADLINE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">
                  Due Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                  style={{ border: '0.5px solid #d1d5db' }}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">
                  Alert Days Before{' '}
                  <span className="text-gray-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={editAlerts}
                  onChange={(e) => setEditAlerts(e.target.value)}
                  placeholder="30, 14, 7, 3, 1"
                  className="w-full h-9 px-3 text-[13px] font-mono rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                  style={{ border: '0.5px solid #d1d5db' }}
                />
              </div>

              {editError && <p className="text-[12px] text-[#A32D2D]">{editError}</p>}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="h-9 px-4 rounded-[6px] text-[13px] text-gray-500 hover:bg-gray-50 transition"
                  style={{ border: '0.5px solid #e5e7eb' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="h-9 px-4 rounded-[6px] text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#1D9E75' }}
                >
                  {editLoading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
