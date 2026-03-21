'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

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

interface AddDeadlineFormProps {
  studentId: string
}

export default function AddDeadlineForm({ studentId }: AddDeadlineFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    type: 'application',
    due_date: '',
  })

  function reset() {
    setForm({ title: '', type: 'application', due_date: '' })
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.due_date) {
      setError('Title and due date are required')
      return
    }
    setLoading(true)
    setError(null)

    try {
      await apiFetch('/api/deadlines', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          title: form.title.trim(),
          type: form.type,
          due_date: form.due_date,
        }),
      })
      setOpen(false)
      reset()
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add deadline')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-9 px-4 rounded-[6px] text-[13px] font-medium text-white flex items-center gap-2 transition hover:opacity-90"
        style={{ backgroundColor: '#1D9E75' }}
      >
        <Plus size={14} />
        Add Deadline
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div
            className="bg-white rounded-[12px] w-full max-w-sm p-6"
            style={{ border: '0.5px solid #e5e7eb' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-semibold text-gray-900">Add Deadline</h2>
              <button
                onClick={() => { setOpen(false); reset() }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Common App submission"
                  className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                  style={{ border: '0.5px solid #d1d5db' }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
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
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                  style={{ border: '0.5px solid #d1d5db' }}
                />
              </div>

              {error && <p className="text-[12px] text-[#A32D2D]">{error}</p>}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setOpen(false); reset() }}
                  className="h-9 px-4 rounded-[6px] text-[13px] text-gray-500 hover:bg-gray-50 transition"
                  style={{ border: '0.5px solid #e5e7eb' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-9 px-4 rounded-[6px] text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#1D9E75' }}
                >
                  {loading ? 'Adding…' : 'Add Deadline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
