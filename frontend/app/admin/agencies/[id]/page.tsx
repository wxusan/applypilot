'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import {
  ArrowLeft, Users, UserCheck, Building2, Ban, ChevronRight,
  Clock, Mail, Trash2, RefreshCw, Shield, UserX,
} from 'lucide-react'

interface StaffMember {
  member_id: string
  role: string
  is_active: boolean
  joined_at: string | null
  full_name: string | null
  email: string | null
  last_active_at: string | null
}

interface AgencyDetail {
  agency: {
    id: string
    name: string
    slug: string
    subscription_plan: string
    subscription_status: string | null
    subscription_expires_at: string | null
    max_staff: number
    max_students: number | null
    ai_tokens_used: number | null
    ai_token_limit: number | null
    created_at: string
    unlocked_features: string[] | null
  }
  student_count: number
  staff_count: number
  staff_list: StaffMember[]
  owner: StaffMember | null
  recent_logs: Array<{ id: string; action: string; entity_type: string; created_at: string }>
}

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-700',
  pro: 'bg-blue-50 text-blue-700',
  enterprise: 'bg-purple-50 text-purple-700',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  suspended: 'bg-red-50 text-red-700',
  trial: 'bg-yellow-50 text-yellow-700',
  expired: 'bg-red-50 text-red-600',
}

export default function AdminAgencyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [data, setData] = useState<AgencyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Suspend modal
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspending, setSuspending] = useState(false)
  const [suspendError, setSuspendError] = useState<string | null>(null)

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Resend invite
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)

  async function loadDetail() {
    try {
      const res = await apiFetch<AgencyDetail>(`/api/super-admin/agencies/${id}`)
      setData(res)
    } catch (err: any) {
      setError(err.message || 'Failed to load agency')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) loadDetail() }, [id])

  const handleSuspend = async () => {
    if (!suspendReason.trim()) { setSuspendError('Please provide a reason.'); return }
    setSuspending(true); setSuspendError(null)
    try {
      await apiFetch(`/api/super-admin/agencies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ subscription_status: 'suspended' }),
      })
      setShowSuspendModal(false); setSuspendReason('')
      await loadDetail()
    } catch (err: any) {
      setSuspendError(err.message || 'Failed to suspend.')
    } finally { setSuspending(false) }
  }

  const handleDelete = async () => {
    if (deleteConfirm !== data?.agency.name) {
      setDeleteError('Agency name does not match.')
      return
    }
    setDeleting(true); setDeleteError(null)
    try {
      await apiFetch(`/api/super-admin/agencies/${id}`, { method: 'DELETE' })
      router.push('/admin/agencies')
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete agency.')
    } finally { setDeleting(false) }
  }

  const handleResendInvite = async () => {
    setResending(true); setResendMsg(null)
    try {
      const res = await apiFetch<{ message: string }>(`/api/super-admin/agencies/${id}/resend-invite`, { method: 'POST' })
      setResendMsg(res.message)
    } catch (err: any) {
      setResendMsg(`Failed: ${err.message}`)
    } finally { setResending(false) }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-gray-100 rounded w-64" />
        <div className="h-32 bg-gray-100 rounded-xl" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto text-center py-20 text-gray-400">
        <Building2 size={40} className="mx-auto mb-4 opacity-30" />
        <p className="text-[14px]">{error || 'Agency not found.'}</p>
        <Link href="/admin/agencies" className="mt-4 inline-block text-[13px] text-blue-600 underline">Back</Link>
      </div>
    )
  }

  const { agency, student_count, staff_count, staff_list, owner, recent_logs } = data
  const isSuspended = agency.subscription_status === 'suspended'
  const planColor = PLAN_COLORS[agency.subscription_plan] || 'bg-gray-100 text-gray-700'
  const statusColor = STATUS_COLORS[agency.subscription_status || 'active'] || 'bg-gray-100 text-gray-700'
  const tokenPct = agency.ai_token_limit
    ? Math.min(100, Math.round(((agency.ai_tokens_used ?? 0) / agency.ai_token_limit) * 100))
    : 0
  const tokenColor = tokenPct >= 90 ? 'bg-red-500' : tokenPct >= 70 ? 'bg-yellow-400' : 'bg-[#1D9E75]'

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-3">
          <Link href="/admin" className="hover:text-gray-700">Super Admin</Link>
          <ChevronRight size={12} />
          <Link href="/admin/agencies" className="hover:text-gray-700">Agencies</Link>
          <ChevronRight size={12} />
          <span className="text-gray-700 font-medium">{agency.name}</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin/agencies')} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-[20px] font-semibold text-gray-900">{agency.name}</h1>
              <p className="text-[12px] text-gray-400 font-mono">{agency.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleResendInvite}
              disabled={resending}
              className="px-3 py-2 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              <Mail size={13} />
              {resending ? 'Sending...' : 'Resend Invite'}
            </button>
            <Link
              href={`/admin/audit?agency_id=${id}`}
              className="px-3 py-2 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              View Logs
            </Link>
            {!isSuspended ? (
              <button
                onClick={() => setShowSuspendModal(true)}
                className="px-3 py-2 rounded-lg bg-orange-100 text-orange-700 text-[12px] font-medium hover:bg-orange-200 transition-colors flex items-center gap-1.5"
              >
                <Ban size={13} />
                Suspend
              </button>
            ) : (
              <button
                onClick={async () => {
                  if (!confirm('Reactivate this agency?')) return
                  await apiFetch(`/api/super-admin/agencies/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ subscription_status: 'active' }),
                  })
                  loadDetail()
                }}
                className="px-3 py-2 rounded-lg bg-green-100 text-green-700 text-[12px] font-medium hover:bg-green-200 transition-colors"
              >
                Reactivate
              </button>
            )}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-3 py-2 rounded-lg bg-red-600 text-white text-[12px] font-medium hover:bg-red-700 transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </div>
        {resendMsg && (
          <p className={`mt-2 text-[12px] font-medium ${resendMsg.startsWith('Failed') ? 'text-red-500' : 'text-green-600'}`}>
            {resendMsg}
          </p>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Students', value: student_count, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Staff', value: staff_count, icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Max Staff', value: agency.max_staff, icon: Building2, color: 'text-gray-600', bg: 'bg-gray-100' },
          { label: 'Max Students', value: agency.max_students ?? '∞', icon: Users, color: 'text-[#1D9E75]', bg: 'bg-[#E1F5EE]' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-[10px] p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">{s.label}</p>
              <div className={`w-6 h-6 rounded-[5px] ${s.bg} flex items-center justify-center`}>
                <s.icon size={12} className={s.color} />
              </div>
            </div>
            <p className="text-[24px] font-semibold text-gray-900 leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Agency Info + AI Token Usage */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-[10px] p-5 border border-gray-200 shadow-sm">
          <h2 className="text-[13px] font-semibold text-gray-800 mb-4">Agency Details</h2>
          <div className="grid grid-cols-2 gap-5 text-[13px]">
            <div><p className="text-gray-500 mb-1 text-[11px]">Plan</p><span className={`inline-flex px-2 py-0.5 rounded uppercase text-[10px] font-bold ${planColor}`}>{agency.subscription_plan}</span></div>
            <div><p className="text-gray-500 mb-1 text-[11px]">Status</p><span className={`inline-flex px-2 py-0.5 rounded uppercase text-[10px] font-bold ${statusColor}`}>{agency.subscription_status || 'active'}</span></div>
            <div><p className="text-gray-500 mb-1 text-[11px]">Joined</p><p className="font-medium">{new Date(agency.created_at).toLocaleDateString()}</p></div>
            <div><p className="text-gray-500 mb-1 text-[11px]">Expires</p><p className="font-medium">{agency.subscription_expires_at ? new Date(agency.subscription_expires_at).toLocaleDateString() : '—'}</p></div>
            <div className="col-span-2">
              <p className="text-gray-500 mb-1 text-[11px]">Unlocked Features</p>
              <p className="font-medium">{agency.unlocked_features?.length ? agency.unlocked_features.join(', ') : 'None'}</p>
            </div>
          </div>
        </div>

        {/* Token Usage */}
        <div className="bg-white rounded-[10px] p-5 border border-gray-200 shadow-sm">
          <h2 className="text-[13px] font-semibold text-gray-800 mb-4">AI Token Usage</h2>
          <div className="flex items-end justify-between mb-2">
            <span className="text-[28px] font-bold text-gray-900">{tokenPct}%</span>
            <span className="text-[11px] text-gray-400 font-mono">
              {(agency.ai_tokens_used ?? 0).toLocaleString()} / {(agency.ai_token_limit ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${tokenColor} transition-all`} style={{ width: `${tokenPct}%` }} />
          </div>
          {tokenPct >= 80 && (
            <p className="text-[11px] text-red-500 mt-2 font-medium">⚠ Approaching token limit</p>
          )}
          <Link
            href={`/admin/automation`}
            className="mt-3 block text-[12px] text-blue-600 hover:underline"
          >
            Manage billing →
          </Link>
        </div>
      </div>

      {/* Staff Members */}
      <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-gray-800">Staff Members ({staff_list.length})</h2>
        </div>
        {staff_list.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-[13px]">No staff members yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {staff_list.map((member) => (
              <div key={member.member_id} className="px-5 py-3 flex items-center gap-4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${member.role === 'admin' ? 'bg-[#031635]/10' : 'bg-gray-100'}`}>
                  {member.role === 'admin' ? <Shield size={13} className="text-[#031635]" /> : <UserCheck size={13} className="text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-gray-800 truncate">{member.full_name || '—'}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{member.role}</span>
                    {!member.is_active && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 flex items-center gap-0.5">
                        <UserX size={9} />Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">{member.email || '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  {member.joined_at && (
                    <p className="text-[11px] text-gray-400">Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                  )}
                  {member.last_active_at && (
                    <p className="text-[10px] text-gray-300">Last active {new Date(member.last_active_at).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-gray-800">Recent Activity</h2>
          <Link href={`/admin/audit?agency_id=${id}`} className="text-[12px] text-blue-600 hover:underline">View all →</Link>
        </div>
        {recent_logs.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-[13px]">No activity yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent_logs.map((log) => (
              <div key={log.id} className="px-5 py-3 flex items-center gap-3">
                <Clock size={12} className="text-gray-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] font-medium text-gray-700">{log.action}</span>
                  <span className="ml-2 text-[11px] text-gray-400">{log.entity_type}</span>
                </div>
                <span className="text-[11px] text-gray-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(3,22,53,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center"><Ban size={18} className="text-orange-600" /></div>
                <div>
                  <h3 className="text-[16px] font-semibold text-gray-900">Suspend Agency</h3>
                  <p className="text-[12px] text-gray-500">Blocks all access for {staff_count} staff and {student_count} students.</p>
                </div>
              </div>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 resize-none"
                placeholder="Reason for suspension..."
                rows={3}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                maxLength={500}
              />
              {suspendError && <p className="text-[12px] text-red-500 mt-2">{suspendError}</p>}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setShowSuspendModal(false); setSuspendReason(''); setSuspendError(null) }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSuspend} disabled={suspending} className="flex-[1.5] py-2.5 rounded-xl bg-orange-500 text-white text-[13px] font-medium hover:bg-orange-600 disabled:opacity-60">
                {suspending ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(3,22,53,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><Trash2 size={18} className="text-red-600" /></div>
                <div>
                  <h3 className="text-[16px] font-semibold text-gray-900">Delete Agency</h3>
                  <p className="text-[12px] text-gray-500">This is permanent and cannot be undone.</p>
                </div>
              </div>
              <p className="text-[13px] text-gray-600 mb-4">
                This will permanently delete <strong>{agency.name}</strong>, all {student_count} students, all staff members, and all associated data.
              </p>
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                  Type <strong className="font-mono">{agency.name}</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={agency.name}
                  className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                />
              </div>
              {deleteError && <p className="text-[12px] text-red-500 mt-2">{deleteError}</p>}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); setDeleteError(null) }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting || deleteConfirm !== agency.name}
                className="flex-[1.5] py-2.5 rounded-xl bg-red-600 text-white text-[13px] font-medium hover:bg-red-700 disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
