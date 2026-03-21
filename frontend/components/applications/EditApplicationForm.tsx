'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

const APPLICATION_TYPES = ['common_app', 'coalition', 'direct', 'ucas', 'other']
const APP_STATUSES = ['not_started', 'in_progress', 'submitted', 'accepted', 'rejected', 'waitlisted', 'deferred']
const DECISIONS = ['accepted', 'rejected', 'waitlisted', 'deferred', 'pending']

interface Application {
  id: string
  university_name: string
  application_type: string
  status: string
  deadline_regular: string | null
  deadline_financial_aid: string | null
  deadline_scholarship: string | null
  decision: string | null
  portal_url: string | null
  portal_username: string | null
  scholarship_amount: number | null
  financial_aid_amount: number | null
  application_fee_paid: boolean
  fee_waiver_used: boolean
  notes: string | null
}

interface EditApplicationFormProps {
  application: Application
  onClose: () => void
}

export default function EditApplicationForm({ application, onClose }: EditApplicationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    university_name: application.university_name ?? '',
    application_type: application.application_type ?? 'common_app',
    status: application.status ?? 'not_started',
    deadline_regular: application.deadline_regular?.slice(0, 10) ?? '',
    deadline_financial_aid: application.deadline_financial_aid?.slice(0, 10) ?? '',
    deadline_scholarship: application.deadline_scholarship?.slice(0, 10) ?? '',
    decision: application.decision ?? '',
    portal_url: application.portal_url ?? '',
    portal_username: application.portal_username ?? '',
    portal_password: '', // Never pre-filled — only update if user types
    scholarship_amount: application.scholarship_amount?.toString() ?? '',
    financial_aid_amount: application.financial_aid_amount?.toString() ?? '',
    application_fee_paid: application.application_fee_paid ?? false,
    fee_waiver_used: application.fee_waiver_used ?? false,
    notes: application.notes ?? '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.university_name.trim()) {
      setError('University name is required')
      return
    }
    setLoading(true)
    setError(null)

    const payload: Record<string, unknown> = {
      university_name: form.university_name.trim(),
      application_type: form.application_type,
      status: form.status,
      deadline_regular: form.deadline_regular || null,
      deadline_financial_aid: form.deadline_financial_aid || null,
      deadline_scholarship: form.deadline_scholarship || null,
      decision: form.decision || null,
      portal_url: form.portal_url || null,
      portal_username: form.portal_username || null,
      scholarship_amount: form.scholarship_amount ? parseFloat(form.scholarship_amount) : null,
      financial_aid_amount: form.financial_aid_amount ? parseFloat(form.financial_aid_amount) : null,
      application_fee_paid: form.application_fee_paid,
      fee_waiver_used: form.fee_waiver_used,
      notes: form.notes || null,
    }

    // Only send portal_password if user typed a new one
    if (form.portal_password.trim()) {
      payload.portal_password = form.portal_password
    }

    try {
      await apiFetch(`/api/applications/${application.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      onClose()
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
      <div
        className="bg-white rounded-[12px] w-full max-w-xl max-h-[90vh] overflow-y-auto p-6"
        style={{ border: '0.5px solid #e5e7eb' }}
      >
        <div className="flex items-center justify-between mb-5 sticky top-0 bg-white pb-3"
          style={{ borderBottom: '0.5px solid #f3f4f6' }}>
          <h2 className="text-[16px] font-semibold text-gray-900">Edit Application</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* University + Type + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[12px] font-medium text-gray-500 mb-1">
                University Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.university_name}
                onChange={(e) => setForm({ ...form, university_name: e.target.value })}
                className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                style={{ border: '0.5px solid #d1d5db' }}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1">Type</label>
              <select
                value={form.application_type}
                onChange={(e) => setForm({ ...form, application_type: e.target.value })}
                className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75] bg-white"
                style={{ border: '0.5px solid #d1d5db' }}
              >
                {APPLICATION_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75] bg-white capitalize"
                style={{ border: '0.5px solid #d1d5db' }}
              >
                {APP_STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadlines */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1">Regular Deadline</label>
              <input
                type="date"
                value={form.deadline_regular}
                onChange={(e) => setForm({ ...form, deadline_regular: e.target.value })}
                className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                style={{ border: '0.5px solid #d1d5db' }}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1">Financial Aid Deadline</label>
              <input
                type="date"
                value={form.deadline_financial_aid}
                onChange={(e) => setForm({ ...form, deadline_financial_aid: e.target.value })}
                className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                style={{ border: '0.5px solid #d1d5db' }}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1">Scholarship Deadline</label>
              <input
                type="date"
                value={form.deadline_scholarship}
                onChange={(e) => setForm({ ...form, deadline_scholarship: e.target.value })}
                className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                style={{ border: '0.5px solid #d1d5db' }}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1">Decision</label>
              <select
                value={form.decision}
                onChange={(e) => setForm({ ...form, decision: e.target.value })}
                className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75] bg-white"
                style={{ border: '0.5px solid #d1d5db' }}
              >
                <option value="">— No decision —</option>
                {DECISIONS.map((d) => (
                  <option key={d} value={d} className="capitalize">{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Financial */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1">Scholarship ($)</label>
              <input
                type="number"
                value={form.scholarship_amount}
                onChange={(e) => setForm({ ...form, scholarship_amount: e.target.value })}
                className="w-full h-9 px-3 text-[13px] rounded-[6px] font-mono focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                style={{ border: '0.5px solid #d1d5db' }}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1">Financial Aid ($)</label>
              <input
                type="number"
                value={form.financial_aid_amount}
                onChange={(e) => setForm({ ...form, financial_aid_amount: e.target.value })}
                className="w-full h-9 px-3 text-[13px] rounded-[6px] font-mono focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                style={{ border: '0.5px solid #d1d5db' }}
              />
            </div>
          </div>

          {/* Portal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[12px] font-medium text-gray-500 mb-1">Portal URL</label>
              <input
                type="url"
                value={form.portal_url}
                onChange={(e) => setForm({ ...form, portal_url: e.target.value })}
                placeholder="https://apply.university.edu"
                className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                style={{ border: '0.5px solid #d1d5db' }}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1">Portal Username</label>
              <input
                type="text"
                value={form.portal_username}
                onChange={(e) => setForm({ ...form, portal_username: e.target.value })}
                className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                style={{ border: '0.5px solid #d1d5db' }}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1">
                Portal Password{' '}
                <span className="text-gray-400 font-normal">(leave blank to keep)</span>
              </label>
              <input
                type="password"
                value={form.portal_password}
                onChange={(e) => setForm({ ...form, portal_password: e.target.value })}
                autoComplete="new-password"
                className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                style={{ border: '0.5px solid #d1d5db' }}
              />
            </div>
          </div>

          {/* Flags */}
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.application_fee_paid}
                onChange={(e) => setForm({ ...form, application_fee_paid: e.target.checked })}
                className="w-3.5 h-3.5 rounded accent-[#1D9E75]"
              />
              <span className="text-[13px] text-gray-600">Application Fee Paid</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.fee_waiver_used}
                onChange={(e) => setForm({ ...form, fee_waiver_used: e.target.checked })}
                className="w-3.5 h-3.5 rounded accent-[#1D9E75]"
              />
              <span className="text-[13px] text-gray-600">Fee Waiver Used</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-[13px] rounded-[6px] resize-none focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
              style={{ border: '0.5px solid #d1d5db' }}
            />
          </div>

          {error && <p className="text-[12px] text-[#A32D2D]">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
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
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
