'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

interface AddApplicationFormProps {
  studentId: string
}

const APPLICATION_TYPES = ['common_app']

export default function AddApplicationForm({ studentId }: AddApplicationFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    university_name: '',
    application_type: 'common_app',
    deadline_financial_aid: '',
    deadline_regular: '',
    notes: '',
  })

  function reset() {
    setForm({
      university_name: '',
      application_type: 'common_app',
      deadline_financial_aid: '',
      deadline_regular: '',
      notes: '',
    })
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.university_name.trim()) {
      setError('University name is required')
      return
    }
    setLoading(true)
    setError(null)

    try {
      await apiFetch('/api/applications', { method: 'POST', body: JSON.stringify({
        student_id: studentId,
        university_name: form.university_name.trim(),
        application_type: form.application_type,
        deadline_financial_aid: form.deadline_financial_aid || null,
        deadline_regular: form.deadline_regular || null,
        notes: form.notes || null,
      }) })
      setOpen(false)
      reset()
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add application'
      setError(msg)
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
        Add Application
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div
            className="bg-white rounded-[12px] w-full max-w-md p-6"
            style={{ border: '0.5px solid #e5e7eb' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-semibold text-gray-900">Add Application</h2>
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
                  University Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.university_name}
                  onChange={(e) => setForm({ ...form, university_name: e.target.value })}
                  placeholder="e.g. MIT"
                  className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                  style={{ border: '0.5px solid #d1d5db' }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">
                  Application Type
                </label>
                <select
                  value={form.application_type}
                  onChange={(e) => setForm({ ...form, application_type: e.target.value })}
                  className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75] bg-white"
                  style={{ border: '0.5px solid #d1d5db' }}
                >
                  {APPLICATION_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">
                      {t.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1">
                    Financial Aid Deadline
                  </label>
                  <input
                    type="date"
                    value={form.deadline_financial_aid}
                    onChange={(e) => setForm({ ...form, deadline_financial_aid: e.target.value })}
                    className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                    style={{ border: '0.5px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1">
                    Regular Deadline
                  </label>
                  <input
                    type="date"
                    value={form.deadline_regular}
                    onChange={(e) => setForm({ ...form, deadline_regular: e.target.value })}
                    className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                    style={{ border: '0.5px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 text-[13px] rounded-[6px] resize-none focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                  style={{ border: '0.5px solid #d1d5db' }}
                />
              </div>

              {error && (
                <p className="text-[12px] text-[#A32D2D]">{error}</p>
              )}

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
                  {loading ? 'Adding…' : 'Add Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
