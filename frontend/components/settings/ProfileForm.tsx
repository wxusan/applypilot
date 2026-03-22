'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  user: { id: string; full_name: string; email: string } | null
  isOwner: boolean
  agencyId?: string
}

export default function ProfileForm({ user, isOwner, agencyId }: Props) {
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [email] = useState(user?.email ?? '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [nameError, setNameError] = useState('')

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError('')

    if (!fullName.trim()) {
      setNameError('Name is required.')
      return
    }
    if (fullName.trim().length < 2) {
      setNameError('Name must be at least 2 characters.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim() }),
      })
      if (!res.ok) throw new Error('Failed to save')
      showToast('success', 'Profile updated successfully.')
    } catch {
      showToast('error', 'Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className="rounded-[6px] px-3 py-2 text-[12px]"
          style={
            toast.type === 'success'
              ? { backgroundColor: '#E1F5EE', border: '0.5px solid #A7F3D0', color: '#065F46' }
              : { backgroundColor: '#FCEBEB', border: '0.5px solid #FCA5A5', color: '#991B1B' }
          }
        >
          {toast.msg}
        </div>
      )}

      {/* Profile card */}
      <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
        <h2 className="text-[13px] font-semibold text-gray-900 mb-4">Personal Information</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-1.5">
              Full Name
            </label>
            <input
              id="full_name"
              type="text"
              value={fullName}
              onChange={e => { setFullName(e.target.value); setNameError('') }}
              className="w-full h-9 px-3 text-[13px] rounded-[6px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand focus-visible:ring-2"
              style={{ border: nameError ? '0.5px solid #EF4444' : '0.5px solid #d1d5db' }}
              required
            />
            {nameError && <p className="text-[11px] text-red-500 mt-1">{nameError}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="w-full h-9 px-3 text-[13px] rounded-[6px] bg-gray-50 text-gray-500 cursor-not-allowed"
              style={{ border: '0.5px solid #e5e7eb' }}
              aria-describedby="email-help"
            />
            <p id="email-help" className="text-[11px] text-gray-400 mt-1">Email cannot be changed here. Contact support.</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="h-9 px-5 rounded-[6px] text-[13px] font-medium text-white transition disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
            style={{ backgroundColor: '#1D9E75' }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #FECACA' }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-red-500" />
          <h2 className="text-[13px] font-semibold text-red-700">Danger Zone</h2>
        </div>
        <p className="text-[13px] text-gray-600 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <div className="relative inline-block">
          <button
            disabled={!isOwner}
            title={isOwner ? undefined : 'Only agency owners can delete the account'}
            className="h-8 px-4 rounded-[6px] text-[12px] font-medium text-white transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
            style={{ backgroundColor: '#DC2626' }}
            onClick={() => {
              if (window.confirm('Are you absolutely sure? This will permanently delete your account and all data. Type DELETE to confirm.')) {
                alert('Account deletion requires manual support ticket. Contact support@applypilot.com')
              }
            }}
          >
            Delete Account
          </button>
          {!isOwner && (
            <p className="text-[11px] text-gray-400 mt-1.5">Only agency owners can delete the account.</p>
          )}
        </div>
      </div>
    </div>
  )
}
