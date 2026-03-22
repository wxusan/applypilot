'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Edit2, Check, X, Plus } from 'lucide-react'

interface Agency {
  id: string
  name: string
  slug: string
  subscription_plan: string
  max_staff: number
  created_at: string
}

const PLANS = ['starter', 'professional', 'enterprise']

const emptyCreate = {
  name: '',
  slug: '',
  owner_email: '',
  owner_name: '',
  subscription_plan: 'starter',
  max_staff: 2,
}

export default function AgencyManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Edit state
  const [editPlan, setEditPlan] = useState('')
  const [editStaff, setEditStaff] = useState(0)

  // Create modal state
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreate)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)

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

  useEffect(() => {
    loadAgencies()
  }, [])

  const handleSave = async (id: string) => {
    if (!confirm('Apply these new limits?')) return
    try {
      await apiFetch(`/api/super-admin/agencies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ subscription_plan: editPlan, max_staff: editStaff }),
      })
      setEditingId(null)
      loadAgencies()
    } catch {
      alert('Failed to update agency limits')
    }
  }

  const setCreate = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setCreateForm((prev) => ({ ...prev, [field]: e.target.value }))

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setCreateForm((prev) => ({
      ...prev,
      name,
      slug: prev.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    if (!createForm.name.trim() || !createForm.slug.trim() || !createForm.owner_email.trim()) {
      setCreateError('Name, slug, and owner email are required.')
      return
    }
    setCreating(true)
    try {
      const res = await apiFetch<{ message: string }>('/api/super-admin/agencies', {
        method: 'POST',
        body: JSON.stringify({
          ...createForm,
          max_staff: Number(createForm.max_staff),
        }),
      })
      setCreateSuccess(res.message)
      setCreateForm(emptyCreate)
      loadAgencies()
      setTimeout(() => {
        setShowCreate(false)
        setCreateSuccess(null)
      }, 2500)
    } catch (err) {
      setCreateError((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  const inputClass =
    'w-full h-9 px-3 text-[13px] rounded-[6px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1D9E75] transition border border-gray-200'

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-gray-900">Agency Management</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Configure subscription plans and staff limits for all active clients.
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(null); setCreateSuccess(null) }}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] text-[13px] font-medium text-white transition"
          style={{ backgroundColor: '#1D9E75' }}
        >
          <Plus size={14} />
          New Agency
        </button>
      </div>

      {/* ── Agency Table ── */}
      <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-gray-50 text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Agency Name</th>
              <th className="px-4 py-3">Domain Slug</th>
              <th className="px-4 py-3">Subscription</th>
              <th className="px-4 py-3">Max Staff (Limit)</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/50">
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center text-gray-400">Loading clients...</td></tr>
            ) : agencies.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-gray-400">No agencies found.</td></tr>
            ) : (
              agencies.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-100">{a.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-[12px] border-r border-gray-100">{a.slug}</td>

                  {editingId === a.id ? (
                    <>
                      <td className="px-4 py-3 border-r border-gray-100">
                        <select
                          value={editPlan}
                          onChange={(e) => setEditPlan(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-[12px] w-full"
                        >
                          {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100">
                        <input
                          type="number"
                          value={editStaff}
                          onChange={(e) => setEditStaff(parseInt(e.target.value))}
                          className="border border-gray-300 rounded px-2 py-1 text-[12px] w-20"
                        />
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-700">
                          <X size={16} />
                        </button>
                        <button onClick={() => handleSave(a.id)} className="text-[#1D9E75] hover:text-[#0F6E56]">
                          <Check size={16} />
                        </button>
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
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setEditingId(a.id)
                            setEditPlan(a.subscription_plan)
                            setEditStaff(a.max_staff)
                          }}
                          className="text-gray-400 hover:text-[#1D9E75] transition-colors p-1"
                          title="Override Limits"
                        >
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create Agency Modal ── */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false) }}
        >
          <div className="bg-white rounded-[12px] w-full max-w-md p-6 shadow-xl" style={{ border: '0.5px solid #e5e7eb' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-semibold text-gray-900">Create New Agency</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            {createSuccess ? (
              <div className="text-center py-6">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-[18px]"
                  style={{ backgroundColor: '#1D9E75' }}
                >
                  ✓
                </div>
                <p className="text-[14px] font-medium text-gray-900 mb-1">Agency Created!</p>
                <p className="text-[12px] text-gray-500">{createSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-1">Agency Name *</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={handleNameChange}
                    placeholder="Bright Futures Education"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-1">URL Slug *</label>
                  <input
                    type="text"
                    value={createForm.slug}
                    onChange={setCreate('slug')}
                    placeholder="bright-futures"
                    required
                    pattern="[a-z0-9-]+"
                    title="Lowercase letters, numbers, and hyphens only"
                    className={inputClass}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Lowercase letters, numbers, hyphens only.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-1">Owner Email *</label>
                  <input
                    type="email"
                    value={createForm.owner_email}
                    onChange={setCreate('owner_email')}
                    placeholder="owner@agency.com"
                    required
                    className={inputClass}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">An invite link will be emailed to this address.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-1">Owner Full Name</label>
                  <input
                    type="text"
                    value={createForm.owner_name}
                    onChange={setCreate('owner_name')}
                    placeholder="Alex Johnson"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-1">Plan</label>
                    <select value={createForm.subscription_plan} onChange={setCreate('subscription_plan')} className={inputClass}>
                      {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-1">Max Staff</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={createForm.max_staff}
                      onChange={setCreate('max_staff')}
                      className={inputClass}
                    />
                  </div>
                </div>

                {createError && (
                  <div className="rounded-[6px] px-3 py-2 text-[12px] text-red-700 bg-red-50 border border-red-200">
                    {createError}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 h-9 rounded-[8px] text-[13px] font-medium text-white disabled:opacity-60 transition"
                    style={{ backgroundColor: '#1D9E75' }}
                  >
                    {creating ? 'Creating…' : 'Create Agency & Send Invite'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="h-9 px-4 rounded-[8px] text-[13px] text-gray-500 border border-gray-200 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
