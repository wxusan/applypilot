'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { formatDistanceToNow } from '@/lib/utils'

interface StaffMember {
  member_id: string
  user_id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  joined_at: string
  last_active_at: string | null
}

interface Props {
  staff: StaffMember[]
  maxStaff: number
  agencyId: string
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    admin: { bg: '#EEF2FF', color: '#3730A3' },
    staff: { bg: '#F0FDF4', color: '#166534' },
  }
  const c = colors[role] ?? { bg: '#F3F4F6', color: '#374151' }
  return (
    <span
      className="text-[11px] font-medium px-2 py-0.5 rounded-full capitalize"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {role}
    </span>
  )
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ backgroundColor: active ? '#22C55E' : '#D1D5DB' }}
      title={active ? 'Active' : 'Deactivated'}
    />
  )
}

export default function StaffManager({ staff: initialStaff, maxStaff, agencyId }: Props) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const activeCount = staff.filter((s) => s.is_active).length

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    if (activeCount >= maxStaff) {
      showToast('error', `Your plan allows a maximum of ${maxStaff} active staff members.`)
      return
    }

    setInviting(true)
    try {
      const res: { message: string } = await apiFetch('/api/staff/invite', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      setInviteEmail('')
      showToast('success', res.message || `Invitation sent to ${inviteEmail}`)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleDeactivate = async (memberId: string, userId: string) => {
    if (!confirm('Deactivate this staff member? They will lose access immediately.')) return
    setDeactivatingId(memberId)
    try {
      await apiFetch(`/api/staff/${memberId}/deactivate`, { method: 'POST' })
      setStaff((prev) =>
        prev.map((s) => (s.member_id === memberId ? { ...s, is_active: false } : s))
      )
      showToast('success', 'Staff member deactivated.')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to deactivate')
    } finally {
      setDeactivatingId(null)
    }
  }

  const handleReactivate = async (memberId: string) => {
    if (activeCount >= maxStaff) {
      showToast('error', `Cannot reactivate — plan limit of ${maxStaff} active staff reached.`)
      return
    }
    setDeactivatingId(memberId)
    try {
      await apiFetch(`/api/staff/${memberId}/reactivate`, { method: 'POST' })
      setStaff((prev) =>
        prev.map((s) => (s.member_id === memberId ? { ...s, is_active: true } : s))
      )
      showToast('success', 'Staff member reactivated.')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to reactivate')
    } finally {
      setDeactivatingId(null)
    }
  }

  const inputClass =
    'flex-1 h-9 px-3 text-[13px] rounded-[6px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand transition'

  return (
    <div className="space-y-5">
      {/* ── Invite ── */}
      <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
        <h2 className="text-[14px] font-semibold text-gray-900 mb-3">Invite Staff Member</h2>
        <p className="text-[12px] text-gray-500 mb-3">
          {activeCount} of {maxStaff} staff slots used. The invite will be sent via email.
        </p>
        <form onSubmit={handleInvite} className="flex items-center gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@agency.com"
            required
            className={inputClass}
            style={{ border: '0.5px solid #d1d5db' }}
          />
          <button
            type="submit"
            disabled={inviting || activeCount >= maxStaff}
            className="h-9 px-4 rounded-[6px] text-[13px] font-medium text-white shrink-0 disabled:opacity-60 transition"
            style={{ backgroundColor: '#1D9E75' }}
          >
            {inviting ? 'Sending…' : 'Send Invite'}
          </button>
        </form>
        {activeCount >= maxStaff && (
          <p className="text-[11px] text-[#B91C1C] mt-2">
            Staff limit reached ({maxStaff}). Deactivate a member to invite someone new.
          </p>
        )}
      </div>

      {/* ── Staff list ── */}
      <div className="bg-white rounded-[10px]" style={{ border: '0.5px solid #e5e7eb' }}>
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: '0.5px solid #e5e7eb' }}
        >
          <h2 className="text-[14px] font-semibold text-gray-900">Team Members</h2>
          <span className="text-[12px] text-gray-400">{staff.length} total</span>
        </div>

        <div className="divide-y divide-gray-50">
          {staff.map((member) => (
            <div
              key={member.member_id}
              className="flex items-center gap-3 px-5 py-3.5"
              style={{ opacity: member.is_active ? 1 : 0.6 }}
            >
              {/* Avatar initials */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold text-white shrink-0"
                style={{ backgroundColor: member.is_active ? '#1D9E75' : '#9CA3AF' }}
              >
                {member.full_name
                  ? member.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  : '?'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-gray-900 truncate">
                    {member.full_name || '(Pending)'}
                  </p>
                  <StatusDot active={member.is_active} />
                  <RoleBadge role={member.role} />
                </div>
                <p className="text-[11px] text-gray-400 truncate">{member.email}</p>
                {member.last_active_at && (
                  <p className="text-[10px] text-gray-300 mt-0.5">
                    Last active {formatDistanceToNow(new Date(member.last_active_at))} ago
                  </p>
                )}
              </div>

              {/* Action — can't deactivate yourself via UI; admins are protected */}
              {member.role !== 'admin' && (
                <button
                  onClick={() =>
                    member.is_active
                      ? handleDeactivate(member.member_id, member.user_id)
                      : handleReactivate(member.member_id)
                  }
                  disabled={deactivatingId === member.member_id}
                  className="text-[11px] font-medium shrink-0 disabled:opacity-50 transition"
                  style={{ color: member.is_active ? '#B91C1C' : '#1D9E75' }}
                >
                  {deactivatingId === member.member_id
                    ? '…'
                    : member.is_active
                    ? 'Deactivate'
                    : 'Reactivate'}
                </button>
              )}
            </div>
          ))}

          {staff.length === 0 && (
            <div className="px-5 py-8 text-center text-[13px] text-gray-400">
              No team members yet. Invite your first staff member above.
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-5 right-5 rounded-[8px] px-4 py-3 text-[13px] font-medium text-white shadow-lg z-50"
          style={{ backgroundColor: toast.type === 'success' ? '#1D9E75' : '#B91C1C' }}
        >
          {toast.type === 'success' ? '✓ ' : '✗ '}{toast.msg}
        </div>
      )}
    </div>
  )
}
