'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { trackContact } from '@/lib/trackContact'
import { Edit2, Check, X, ExternalLink, Search, AlertTriangle, Pause, Play, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Agency {
  id: string
  name: string
  slug: string
  subscription_plan: string
  subscription_status: string | null
  subscription_expires_at: string | null
  max_staff: number
  ai_tokens_used: number | null
  ai_token_limit: number | null
  created_at: string
}

interface CreateAgencyForm {
  name: string
  owner_email: string
  plan: 'starter' | 'pro' | 'enterprise'
  counselor_seats: number
  max_students: number
  ai_tokens: number
}

interface PlanConfig {
  max_staff: number
  max_students: number
  ai_token_limit: number
  price_monthly?: number
}

// Static labels only — prices come from planConfigs (DB)
const PLAN_META = [
  { id: 'starter'    as const, label: 'Starter',    fallbackPrice: 79  },
  { id: 'pro'        as const, label: 'Pro',         fallbackPrice: 199 },
  { id: 'enterprise' as const, label: 'Enterprise',  fallbackPrice: 499 },
]

function TokenBar({ used, limit }: { used: number | null; limit: number | null }) {
  if (!limit || limit === 0) return <span className="text-gray-400 text-[11px]">—</span>
  const pct = Math.min(100, Math.round(((used ?? 0) / limit) * 100))
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-[#1D9E75]'
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-mono font-medium ${pct >= 90 ? 'text-red-600' : 'text-gray-500'}`}>
        {pct}%
      </span>
    </div>
  )
}

function StatusBadge({ status, expires }: { status: string | null; expires: string | null }) {
  const isExpired = expires && new Date(expires) < new Date()
  if (status === 'suspended') return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-50 text-red-700">Suspended</span>
  if (isExpired) return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-50 text-orange-700">Expired</span>
  if (status === 'trial') return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700">Trial</span>
  return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-green-50 text-green-700">Active</span>
}

export default function AgencyManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPlan, setEditPlan] = useState('')
  const [editStaff, setEditStaff] = useState(0)
  const [editTokenLimit, setEditTokenLimit] = useState(0)
  const [editError, setEditError] = useState<string | null>(null)

  // Plan configs — seeded with real defaults; updated from DB on load
  const [planConfigs, setPlanConfigs] = useState<Record<string, PlanConfig>>({
    starter:    { max_staff: 2,  max_students: 15,  ai_token_limit: 750000,   price_monthly: 79  },
    pro:        { max_staff: 4,  max_students: 35,  ai_token_limit: 2500000,  price_monthly: 199 },
    enterprise: { max_staff: 0,  max_students: 0,   ai_token_limit: 0,        price_monthly: 499 },
  })

  // Suspend / Unsuspend confirm
  const [suspendTarget, setSuspendTarget] = useState<Agency | null>(null)
  const [unsuspendTarget, setUnsuspendTarget] = useState<Agency | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Delete confirm (requires typing agency name)
  const [deleteTarget, setDeleteTarget] = useState<Agency | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  const handleSuspend = async (agency: Agency) => {
    setActionLoading(true)
    setActionError(null)
    try {
      await apiFetch(`/api/super-admin/agencies/${agency.id}/suspend`, { method: 'POST' })
      setSuspendTarget(null)
      loadAgencies()
    } catch (err: any) {
      setActionError(err.message || 'Failed to suspend agency.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnsuspend = async (agency: Agency) => {
    setActionLoading(true)
    setActionError(null)
    try {
      await apiFetch(`/api/super-admin/agencies/${agency.id}/unsuspend`, { method: 'POST' })
      setUnsuspendTarget(null)
      loadAgencies()
    } catch (err: any) {
      setActionError(err.message || 'Failed to reactivate agency.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (agency: Agency) => {
    if (deleteConfirmName !== agency.name) return
    setActionLoading(true)
    setActionError(null)
    try {
      await apiFetch(`/api/super-admin/agencies/${agency.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      setDeleteConfirmName('')
      loadAgencies()
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete agency.')
    } finally {
      setActionLoading(false)
    }
  }

  // Create Modal
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createResult, setCreateResult] = useState<{ invite_error?: string | null } | null>(null)
  const [form, setForm] = useState<CreateAgencyForm>({
    name: '', owner_email: '', plan: 'starter', counselor_seats: 2, max_students: 15, ai_tokens: 750000,
  })

  async function loadAgencies() {
    try {
      const data = await apiFetch<{ agencies: Agency[] }>('/api/super-admin/agencies')
      setAgencies(data.agencies || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadPlanConfigs() {
    try {
      const data = await apiFetch<{ plans: Record<string, PlanConfig> }>('/api/super-admin/plans')
      if (data.plans) setPlanConfigs(data.plans)
    } catch { /* use defaults */ }
  }

  useEffect(() => { loadAgencies(); loadPlanConfigs() }, [])

  const filtered = agencies.filter((a) =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.slug.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (id: string) => {
    setEditError(null)
    try {
      await apiFetch(`/api/super-admin/agencies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          subscription_plan: editPlan,
          max_staff: editStaff,
          ai_token_limit: editTokenLimit,
        }),
      })
      setEditingId(null)
      loadAgencies()
    } catch (err: any) {
      setEditError(err.message || 'Failed to update.')
    }
  }

  const handleCreate = async () => {
    if (!form.name.trim() || !form.owner_email.trim()) {
      setCreateError('Agency name and owner email are required.')
      return
    }
    setCreating(true)
    setCreateError(null)
    setCreateResult(null)
    try {
      const res = await apiFetch<{ owner_invited: boolean; invite_error?: string | null }>(
        '/api/super-admin/agencies',
        {
          method: 'POST',
          body: JSON.stringify({
            name: form.name,
            owner_email: form.owner_email,
            subscription_plan: form.plan,
            max_staff: form.counselor_seats,
            max_students: form.max_students,
            ai_token_limit: form.ai_tokens,
          }),
        }
      )
      setCreateResult(res)
      trackContact({
        email: form.owner_email,
        source: 'agency_created',
        role: 'agency_owner',
        note: `Agency: ${form.name} · Plan: ${form.plan}`,
      })
      const starterCfg = planConfigs['starter']
      setForm({ name: '', owner_email: '', plan: 'starter', counselor_seats: starterCfg?.max_staff || 2, max_students: starterCfg?.max_students || 15, ai_tokens: starterCfg?.ai_token_limit || 750000 })
      loadAgencies()
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create agency.')
    } finally {
      setCreating(false)
    }
  }

  const formatTokens = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-gray-900">Agency Management</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Configure plans, limits, and monitor usage across all tenants.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search agencies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#031635]/20 focus:border-[#031635] transition w-48"
            />
          </div>
          <button
            onClick={() => { setShowCreate(true); setCreateError(null); setCreateResult(null) }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Agency
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-gray-50 text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Agency Name</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Staff Limit</th>
              <th className="px-4 py-3">AI Token Usage</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/50">
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-400">Loading agencies...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-400">{search ? 'No agencies match your search.' : 'No agencies found.'}</td></tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 border-r border-gray-100">
                    <Link
                      href={`/admin/agencies/${a.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors flex items-center gap-1 group"
                    >
                      {a.name}
                      <ExternalLink size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                    </Link>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">{a.slug}</p>
                  </td>

                  {editingId === a.id ? (
                    <>
                      <td className="px-4 py-3 border-r border-gray-100">
                        <select
                          value={editPlan}
                          onChange={(e) => setEditPlan(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-[12px] w-full"
                        >
                          <option value="starter">Starter</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100">—</td>
                      <td className="px-4 py-3 border-r border-gray-100">
                        <input
                          type="number"
                          value={editStaff}
                          min={1}
                          onChange={(e) => setEditStaff(parseInt(e.target.value) || 1)}
                          className="border border-gray-300 rounded px-2 py-1 text-[12px] w-20"
                        />
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100">
                        <div className="flex flex-col gap-1">
                          <input
                            type="number"
                            value={editTokenLimit}
                            min={0}
                            step={10000}
                            onChange={(e) => setEditTokenLimit(parseInt(e.target.value) || 0)}
                            className="border border-gray-300 rounded px-2 py-1 text-[12px] w-28 font-mono"
                          />
                          <span className="text-[10px] text-gray-400">token limit</span>
                          {editError && <p className="text-[10px] text-red-500">{editError}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => { setEditingId(null); setEditError(null) }} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
                        <button onClick={() => handleSave(a.id)} className="text-[#1D9E75] hover:text-[#0F6E56]"><Check size={16} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 border-r border-gray-100">
                        <span className="inline-flex bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded uppercase text-[10px]">
                          {a.subscription_plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100">
                        <StatusBadge status={a.subscription_status} expires={a.subscription_expires_at} />
                        {a.subscription_expires_at && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(a.subscription_expires_at) < new Date() ? 'Expired' : 'Expires'}{' '}
                            {new Date(a.subscription_expires_at).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 font-mono text-[12px]">{a.max_staff}</td>
                      <td className="px-4 py-3 border-r border-gray-100">
                        <TokenBar used={a.ai_tokens_used} limit={a.ai_token_limit} />
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                          {(a.ai_tokens_used ?? 0).toLocaleString()} / {(a.ai_token_limit ?? 0).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => { setEditingId(a.id); setEditPlan(a.subscription_plan); setEditStaff(a.max_staff); setEditTokenLimit(a.ai_token_limit || 0); setEditError(null) }}
                            className="text-gray-400 hover:text-[#031635] transition-colors p-1 rounded"
                            title="Edit limits"
                          >
                            <Edit2 size={14} />
                          </button>
                          {a.subscription_status === 'suspended' ? (
                            <button
                              onClick={() => { setUnsuspendTarget(a); setActionError(null) }}
                              className="text-gray-400 hover:text-green-600 transition-colors p-1 rounded"
                              title="Reactivate agency"
                            >
                              <Play size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => { setSuspendTarget(a); setActionError(null) }}
                              className="text-gray-400 hover:text-orange-500 transition-colors p-1 rounded"
                              title="Suspend agency"
                            >
                              <Pause size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => { setDeleteTarget(a); setDeleteConfirmName(''); setActionError(null) }}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                            title="Delete agency"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Suspend Confirm Modal ── */}
      {suspendTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(3,22,53,0.55)', backdropFilter: 'blur(4px)' }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Pause size={18} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-gray-900">Suspend Agency</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">This will block all member logins.</p>
              </div>
            </div>
            <p className="text-[13px] text-gray-700">
              Are you sure you want to suspend <strong>{suspendTarget.name}</strong>?
              All members will lose access until you reactivate.
              Agency data is fully preserved.
            </p>
            {actionError && <p className="text-[12px] text-red-500 font-medium">{actionError}</p>}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setSuspendTarget(null); setActionError(null) }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSuspend(suspendTarget)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 transition-colors"
              >
                {actionLoading ? 'Suspending…' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unsuspend Confirm Modal ── */}
      {unsuspendTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(3,22,53,0.55)', backdropFilter: 'blur(4px)' }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Play size={18} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-gray-900">Reactivate Agency</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">Restores full access for all members.</p>
              </div>
            </div>
            <p className="text-[13px] text-gray-700">
              Reactivate <strong>{unsuspendTarget.name}</strong>?
              All previously active members will regain access immediately.
            </p>
            {actionError && <p className="text-[12px] text-red-500 font-medium">{actionError}</p>}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setUnsuspendTarget(null); setActionError(null) }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUnsuspend(unsuspendTarget)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {actionLoading ? 'Reactivating…' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(3,22,53,0.55)', backdropFilter: 'blur(4px)' }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-gray-900">Delete Agency</h2>
                <p className="text-[12px] text-red-500 mt-0.5 font-medium">This action is permanent and cannot be undone.</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-[12px] text-red-700 space-y-1">
              <p className="font-semibold">What will be deleted:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>All students, applications, documents, and reports</li>
                <li>All staff login accounts (Supabase Auth)</li>
                <li>The agency and all its data</li>
              </ul>
              <p className="font-semibold mt-2">What is preserved:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>Staff name and email (for your records, login disabled)</li>
                <li>Audit log history</li>
              </ul>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                Type <span className="font-mono bg-gray-100 px-1 rounded text-gray-900">{deleteTarget.name}</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={deleteTarget.name}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
              />
            </div>
            {actionError && <p className="text-[12px] text-red-500 font-medium">{actionError}</p>}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteConfirmName(''); setActionError(null) }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={actionLoading || deleteConfirmName !== deleteTarget.name}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? 'Deleting…' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Agency Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(3,22,53,0.55)', backdropFilter: 'blur(4px)' }}
        >
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h2 className="text-[20px] font-extrabold text-[#031635]">Create New Agency</h2>
                <p className="text-[13px] text-gray-500 mt-1">
                  The owner will receive an invitation email to set up their account.
                </p>
              </div>
              <button
                onClick={() => { setShowCreate(false); setCreateError(null); setCreateResult(null) }}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {createResult ? (
              // Success state
              <div className="p-8 space-y-4">
                <div className="flex items-center gap-3 text-green-700 bg-green-50 rounded-xl p-4">
                  <Check size={18} />
                  <span className="text-[13px] font-medium">Agency created successfully.</span>
                </div>
                {createResult.invite_error ? (
                  <div className="flex items-start gap-3 text-orange-700 bg-orange-50 rounded-xl p-4">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[13px] font-medium">Invite email failed to send.</p>
                      <p className="text-[11px] mt-0.5 opacity-80">{createResult.invite_error}</p>
                      <p className="text-[11px] mt-1">Use "Resend Invite" from the agency detail page.</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-gray-600">An invitation email was sent to the owner.</p>
                )}
                <button
                  onClick={() => { setShowCreate(false); setCreateResult(null) }}
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white mt-2"
                  style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="p-8 space-y-5">
                {/* Agency Name */}
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Agency Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Global Scholars Academy"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#031635]/20 focus:border-[#031635] transition"
                  />
                </div>

                {/* Owner Email */}
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Owner Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    placeholder="owner@agency.com"
                    value={form.owner_email}
                    onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#031635]/20 focus:border-[#031635] transition"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">An invite link will be emailed to this address.</p>
                </div>

                {/* Plan */}
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-2">Plan</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PLAN_META.map((p) => {
                      const active = form.plan === p.id
                      const cfg = planConfigs[p.id]
                      // Price: use DB value if available, otherwise fallback
                      const price = cfg?.price_monthly ?? p.fallbackPrice
                      const priceLabel = p.id === 'enterprise' && price === 499 ? '$499/mo' : `$${price}/mo`
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setForm({
                              ...form,
                              plan: p.id,
                              counselor_seats: cfg?.max_staff  || 0,
                              max_students:    cfg?.max_students || 0,
                              ai_tokens:       cfg?.ai_token_limit || 0,
                            })
                          }}
                          className={`relative flex flex-col items-start gap-0.5 rounded-xl border-2 px-3 py-2.5 text-left transition-all ${active ? 'border-[#031635] bg-[#031635]/5' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          {active && (
                            <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-[#031635] flex items-center justify-center">
                              <Check size={8} className="text-white" />
                            </span>
                          )}
                          <span className={`text-[12px] font-bold ${active ? 'text-[#031635]' : 'text-gray-800'}`}>{p.label}</span>
                          <span className="text-[10px] text-gray-500">{priceLabel}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Limits */}
                {form.plan === 'enterprise' ? (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                    <p className="text-[12px] font-semibold text-purple-700">Enterprise Plan — Unlimited</p>
                    <p className="text-[11px] text-purple-500 mt-0.5">All limits are set to 0 (unlimited) for this plan.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-xl p-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-2">
                        Staff: <strong>{form.counselor_seats}</strong>
                      </label>
                      <input
                        type="range" min={1} max={50} value={form.counselor_seats}
                        onChange={(e) => setForm({ ...form, counselor_seats: parseInt(e.target.value) })}
                        className="w-full accent-[#031635]"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>1</span><span>50</span></div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-2">
                        Students: <strong>{form.max_students}</strong>
                      </label>
                      <input
                        type="range" min={1} max={500} step={10} value={form.max_students}
                        onChange={(e) => setForm({ ...form, max_students: parseInt(e.target.value) })}
                        className="w-full accent-[#031635]"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>1</span><span>500</span></div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-2">
                        AI Tokens: <strong>{formatTokens(form.ai_tokens)}</strong>
                      </label>
                      <input
                        type="range" min={10000} max={500000} step={10000} value={form.ai_tokens}
                        onChange={(e) => setForm({ ...form, ai_tokens: parseInt(e.target.value) })}
                        className="w-full accent-[#031635]"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>10k</span><span>500k</span></div>
                    </div>
                  </div>
                )}

                {createError && <p className="text-[12px] text-red-500 font-medium">{createError}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setShowCreate(false); setCreateError(null) }}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex-[2] py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-60 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
                  >
                    {creating ? 'Creating...' : 'Create & Send Invite'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
