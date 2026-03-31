'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'

interface Props {
  agency: Record<string, unknown> | null
  user: Record<string, unknown> | null
  role: string
}

export default function SettingsForm({ agency, user, role }: Props) {
  // Profile
  const [telegramId, setTelegramId] = useState((user?.telegram_chat_id as string) ?? '')

  // Agency
  const [agencyName, setAgencyName] = useState((agency?.name as string) ?? '')

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('/api/settings/profile', {
        method: 'PATCH',
        body: JSON.stringify({ telegram_chat_id: telegramId }),
      })

      if (role === 'admin' && agency) {
        await apiFetch('/api/settings/agency', {
          method: 'PATCH',
          body: JSON.stringify({ name: agencyName }),
        })
      }

      showToast('success', 'Settings saved successfully.')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full h-9 px-3 text-[13px] rounded-[6px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand transition'
  const inputStyle = { border: '0.5px solid #d1d5db' }
  const labelClass = 'block text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-1.5'

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* ── Profile ── */}
      <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
        <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Your Profile</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              value={(user?.full_name as string) ?? ''}
              disabled
              className={`${inputClass} bg-gray-50 text-gray-400`}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={(user?.email as string) ?? ''}
              disabled
              className={`${inputClass} bg-gray-50 text-gray-400`}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelClass}>Telegram Chat ID</label>
            <input
              type="text"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="e.g. 123456789"
              className={inputClass}
              style={inputStyle}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Start a chat with the bot and send <code>/start</code> to get your Chat ID.
            </p>
          </div>
        </div>
      </div>

      {/* ── Agency Settings (admin only) ── */}
      {role === 'admin' && agency && (
        <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Agency Settings</h2>
          <div className="space-y-4">
            {/* Agency name */}
            <div>
              <label className={labelClass}>Agency Name</label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Plan (read-only) */}
            <div>
              <label className={labelClass}>Subscription Plan</label>
              <input
                type="text"
                value={(agency.subscription_plan as string) ?? ''}
                disabled
                className={`${inputClass} bg-gray-50 text-gray-400 capitalize`}
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Save button ── */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="h-9 px-5 rounded-[6px] text-[13px] font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: '#1D9E75' }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-5 right-5 rounded-[8px] px-4 py-3 text-[13px] font-medium text-white shadow-lg z-50"
          style={{ backgroundColor: toast.type === 'success' ? '#1D9E75' : '#B91C1C' }}
        >
          {toast.type === 'success' ? '✓ ' : '✗ '}{toast.msg}
        </div>
      )}
    </form>
  )
}
