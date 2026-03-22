'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Edit2, Check, X, Plus, RefreshCw, AlertTriangle } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface Agency {
  id: string
  name: string
  slug: string
  subscription_plan: string
  max_staff: number
  ai_tokens_used?: number
  ai_token_limit?: number
  created_at: string
}

interface CreateForm {
  name: string
  slug: string
  admin_email: string
  subscription_plan: string
  max_staff: number
  ai_token_limit: number
}

const EMPTY_FORM: CreateForm = {
  name: '',
  slug: '',
  admin_email: '',
  subscription_plan: 'starter',
  max_staff: 5,
  ai_token_limit: 500000,
}

export default function AgencyManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPlan, setEditPlan] = useState('')
  const [editStaff, setEditStaff] = useState(0)

  // Create Agency modal
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_FORM)
  const [createLoading, setCreateLoading] = useState(false)
  const [createResult, setCreateResult] = useState<{ success?: string; error?: string } | null>(null)

  // Reset tokens
  const [resetingId, setResetingId] = useState<string | null>(null)
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()

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

  useEffect(() => { loadAgencies() }, [])

  const handleSave = async (id: string) => {
    try {
      await apiFetch(`/api/super-admin/agencies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ subscription_plan: editPlan, max_staff: editStaff }),
      })
      setEditingId(null)
      toastSuccess('Agency limits updated.')
      loadAgencies()
    } catch {
      toastError('Failed to update agency limits.')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateResult(null)
    try {
      const res = await apiFetch<any>('/api/super-admin/agencies', {
        method: 'POST',
        body: JSON.stringify(createForm),
      })
      const warning = res.warning ? `\n⚠️ ${res.warning}` : ''
      setCreateResult({
        success: `Agency "${res.agency?.name}" created!${warning}${res.temp_password ? `\nTemp password: ${res.temp_password}` : ''}`,
      })
      setCreateForm(EMPTY_FORM)
      loadAgencies()
    } catch (err: any) {
      setCreateResult({ error: err?.message || 'Failed to create agency' })
    } finally {
      setCreateLoading(false)
    }
  }

  const handleResetTokens = async (id: string, name: string) => {
    setResetingId(id)
    toastInfo(`Resetting token usage for ${name}…`)
    try {
      const res = await apiFetch<any>(`/api/super-admin/agencies/${id}/reset-tokens`, { method: 'POST' })
      toastSuccess(`${res.message ?? 'Done'} — prev usage: ${(res.previous_usage ?? 0).toLocaleString()} tokens`)
      loadAgencies()
    } catch {
      toastError('Failed to reset tokens.')
    } finally {
      setResetingId(null)
    }
  }

  // Auto-derive slug from name
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setCreateForm(f => ({ ...f, name, slug }))
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-gray-900">Agency Management</h1>
          <p className="text-[13px] text-gray-500 mt-1">Configure subscription plans, staff limits, and token quotas for all clients.</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateResult(null) }}
          className="flex items-center gap-2 bg-[#1D9E75] hover:bg-[#0F6E56] text-white text-[13px] font-medium px-4 py-2 rounded-[8px] transition-colors"
        >
          <Plus size={14} />
          Create Agency
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-gray-50 text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Agency</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Max Staff</th>
              <th className="px-4 py-3">Token Usage</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/50">
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-400">Loading agencies...</td></tr>
            ) : agencies.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-400">No agencies yet. Create one above.</td></tr>
            ) : agencies.map((a) => {
              const used  = a.ai_tokens_used ?? 0
              const limit = a.ai_token_limit ?? 500000
              const pct   = Math.min(used / Math.max(limit, 1) * 100, 100)
              const atLimit = pct >= 100

              return (
                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-100">{a.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-[12px] border-r border-gray-100">{a.slug}</td>

                  {editingId === a.id ? (
                    <>
                      <td className="px-4 py-3 border-r border-gray-100">
                        <select
                          value={editPlan}
                          onChange={e => setEditPlan(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-[12px] w-full"
                        >
                          <option value="starter">Starter</option>
                          <option value="professional">Professional</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100">
                        <input
                          type="number"
                          value={editStaff}
                          onChange={e => setEditStaff(parseInt(e.target.value))}
                          className="border border-gray-300 rounded px-2 py-1 text-[12px] w-20"
                        />
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100" />
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
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
                      <td className="px-4 py-3 border-r border-gray-100 font-mono">{a.max_staff}</td>
                      <td className="px-4 py-3 border-r border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-24">
                              <div
                                className={`h-full rounded-full ${atLimit ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-[#1D9E75]'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-400 mt-0.5 block">
                              {used.toLocaleString()} / {limit.toLocaleString()}
                            </span>
                          </div>
                          {atLimit && <AlertTriangle size={12} className="text-red-500 shrink-0" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResetTokens(a.id, a.name)}
                            disabled={resetingId === a.id}
                            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-amber-600 transition-colors disabled:opacity-50"
                            title="Reset token counter to 0"
                          >
                            <RefreshCw size={12} className={resetingId === a.id ? 'animate-spin' : ''} />
                            Reset Tokens
                          </button>
                          <button
                            onClick={() => { setEditingId(a.id); setEditPlan(a.subscription_plan); setEditStaff(a.max_staff) }}
                            className="text-gray-400 hover:text-brand transition-colors p-1"
                            title="Edit limits"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Create Agency Modal ──────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] shadow-2xl w-full max-w-[480px] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-[15px] font-semibold text-gray-900">Create New Agency</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[12px] font-medium text-gray-600 mb-1">Agency Name *</label>
                  <input
                    required
                    value={createForm.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="Premier Education"
                    className="w-full border border-gray-300 rounded-[6px] px-3 py-2 text-[13px] focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-600 mb-1">Slug</label>
                  <input
                    required
                    value={createForm.slug}
                    onChange={e => setCreateForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="premier-education"
                    className="w-full border border-gray-300 rounded-[6px] px-3 py-2 text-[13px] font-mono focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-600 mb-1">Plan</label>
                  <select
                    value={createForm.subscription_plan}
                    onChange={e => setCreateForm(f => ({ ...f, subscription_plan: e.target.value }))}
                    className="w-full border border-gray-300 rounded-[6px] px-3 py-2 text-[13px] focus:outline-none focus:border-brand"
                  >
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[12px] font-medium text-gray-600 mb-1">Admin Email *</label>
                  <input
                    required
                    type="email"
                    value={createForm.admin_email}
                    onChange={e => setCreateForm(f => ({ ...f, admin_email: e.target.value }))}
                    placeholder="admin@agency.com"
                    className="w-full border border-gray-300 rounded-[6px] px-3 py-2 text-[13px] focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-600 mb-1">Max Staff</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={createForm.max_staff}
                    onChange={e => setCreateForm(f => ({ ...f, max_staff: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-[6px] px-3 py-2 text-[13px] focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-600 mb-1">Token Limit</label>
                  <input
                    type="number"
                    min={100000}
                    step={100000}
                    value={createForm.ai_token_limit}
                    onChange={e => setCreateForm(f => ({ ...f, ai_token_limit: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-[6px] px-3 py-2 text-[13px] focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {createResult?.success && (
                <div className="bg-green-50 border border-green-200 text-green-800 text-[12px] p-3 rounded-[6px] whitespace-pre-wrap">
                  ✅ {createResult.success}
                </div>
              )}
              {createResult?.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-[12px] p-3 rounded-[6px]">
                  ❌ {createResult.error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="text-[13px] text-gray-500 hover:text-gray-700 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-[#1D9E75] hover:bg-[#0F6E56] disabled:opacity-60 text-white text-[13px] font-medium px-5 py-2 rounded-[7px] transition-colors"
                >
                  {createLoading ? 'Creating...' : 'Create Agency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
