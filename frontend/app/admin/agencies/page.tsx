'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Edit2, Check, X } from 'lucide-react'

interface Agency {
  id: string
  name: string
  slug: string
  subscription_plan: string
  max_staff: number
  created_at: string
}

interface CreateAgencyForm {
  name: string
  owner_name: string
  owner_email: string
  plan: 'starter' | 'pro' | 'enterprise'
  counselor_seats: number
  ai_tokens: number
}

const PLANS = [
  {
    id: 'starter' as const,
    label: 'Starter',
    desc: 'Up to 5 counselors',
    price: '$49/mo',
  },
  {
    id: 'pro' as const,
    label: 'Pro',
    desc: 'Up to 15 counselors',
    price: '$149/mo',
  },
  {
    id: 'enterprise' as const,
    label: 'Enterprise',
    desc: 'Unlimited seats',
    price: 'Custom',
  },
]

export default function AgencyManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Edit State
  const [editPlan, setEditPlan] = useState('')
  const [editStaff, setEditStaff] = useState(0)

  // Create Modal State
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState<CreateAgencyForm>({
    name: '',
    owner_name: '',
    owner_email: '',
    plan: 'starter',
    counselor_seats: 5,
    ai_tokens: 50000,
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

  useEffect(() => {
    loadAgencies()
  }, [])

  const handleSave = async (id: string) => {
    if (!confirm('Apply these new limits?')) return
    try {
      await apiFetch(`/api/super-admin/agencies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          subscription_plan: editPlan,
          max_staff: editStaff,
        }),
      })
      setEditingId(null)
      loadAgencies()
    } catch (err) {
      alert('Failed to update agency limits')
    }
  }

  const handleCreate = async () => {
    if (!form.name.trim() || !form.owner_email.trim()) {
      setCreateError('Agency name and owner email are required.')
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      await apiFetch('/api/super-admin/agencies', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          owner_name: form.owner_name,
          owner_email: form.owner_email,
          subscription_plan: form.plan,
          max_staff: form.counselor_seats,
          ai_token_limit: form.ai_tokens,
        }),
      })
      setShowCreate(false)
      setForm({
        name: '',
        owner_name: '',
        owner_email: '',
        plan: 'starter',
        counselor_seats: 5,
        ai_tokens: 50000,
      })
      loadAgencies()
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create agency.')
    } finally {
      setCreating(false)
    }
  }

  const formatTokens = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`

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
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Agency
        </button>
      </div>

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
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-400">
                  Loading clients...
                </td>
              </tr>
            ) : agencies.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-400">
                  No agencies found.
                </td>
              </tr>
            ) : (
              agencies.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-100">
                    {a.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-[12px] border-r border-gray-100">
                    {a.slug}
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
                          <option value="professional">Professional</option>
                          <option value="enterprise">Enterprise</option>
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
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-400 hover:text-gray-700"
                        >
                          <X size={16} />
                        </button>
                        <button
                          onClick={() => handleSave(a.id)}
                          className="text-[#1D9E75] hover:text-[#0F6E56]"
                        >
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
                      <td className="px-4 py-3 border-r border-gray-100 font-mono">
                        {a.max_staff}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setEditingId(a.id)
                            setEditPlan(a.subscription_plan)
                            setEditStaff(a.max_staff)
                          }}
                          className="text-gray-400 hover:text-brand transition-colors p-1"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(3,22,53,0.55)', backdropFilter: 'blur(4px)' }}
        >
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h2
                  className="text-[22px] font-extrabold"
                  style={{ fontFamily: 'Manrope, sans-serif', color: '#031635' }}
                >
                  Create New Agency
                </h2>
                <p className="text-[13px] text-gray-500 mt-1">
                  Establish a new professional dossier for a consulting firm.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreate(false)
                  setCreateError(null)
                }}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 grid grid-cols-12 gap-8">
              {/* Left — Form (8 cols) */}
              <div className="col-span-8 flex flex-col gap-6">
                {/* Agency Name */}
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">
                    Agency Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Global Scholars Academy"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#031635]/20 focus:border-[#031635] transition"
                  />
                </div>

                {/* Owner Name + Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      placeholder="Full name"
                      value={form.owner_name}
                      onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#031635]/20 focus:border-[#031635] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">
                      Owner Email
                    </label>
                    <input
                      type="email"
                      placeholder="owner@agency.com"
                      value={form.owner_email}
                      onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#031635]/20 focus:border-[#031635] transition"
                    />
                  </div>
                </div>

                {/* Plan Selection */}
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-3">
                    Plan Selection
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {PLANS.map((p) => {
                      const active = form.plan === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setForm({ ...form, plan: p.id })}
                          className={`relative flex flex-col items-start gap-0.5 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                            active
                              ? 'border-[#031635] bg-[#031635]/5'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {active && (
                            <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#031635] flex items-center justify-center">
                              <Check size={10} className="text-white" />
                            </span>
                          )}
                          <span
                            className={`text-[13px] font-bold ${active ? 'text-[#031635]' : 'text-gray-800'}`}
                          >
                            {p.label}
                          </span>
                          <span className="text-[11px] text-gray-500">{p.desc}</span>
                          <span
                            className={`text-[12px] font-semibold mt-1 ${active ? 'text-[#031635]' : 'text-gray-600'}`}
                          >
                            {p.price}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Limits Configuration */}
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-3">
                    Limits Configuration
                  </label>
                  <div className="flex flex-col gap-5 bg-gray-50 rounded-xl p-5 border border-gray-100">
                    {/* Counselor Seats */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-medium text-gray-700">
                          Counselor Seats
                        </span>
                        <span className="text-[12px] font-bold text-[#031635]">
                          {form.counselor_seats} seats
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={20}
                        value={form.counselor_seats}
                        onChange={(e) =>
                          setForm({ ...form, counselor_seats: parseInt(e.target.value) })
                        }
                        className="w-full accent-[#031635]"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>1</span>
                        <span>20</span>
                      </div>
                    </div>

                    {/* AI Pilot Tokens */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-medium text-gray-700">
                          AI Pilot Tokens
                        </span>
                        <span className="text-[12px] font-bold text-[#031635]">
                          {formatTokens(form.ai_tokens)} tokens
                        </span>
                      </div>
                      <input
                        type="range"
                        min={10000}
                        max={200000}
                        step={10000}
                        value={form.ai_tokens}
                        onChange={(e) =>
                          setForm({ ...form, ai_tokens: parseInt(e.target.value) })
                        }
                        className="w-full accent-[#031635]"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>10k</span>
                        <span>200k</span>
                      </div>
                    </div>
                  </div>
                </div>

                {createError && (
                  <p className="text-[12px] text-red-500 font-medium">{createError}</p>
                )}
              </div>

              {/* Right — Sidebar (4 cols) */}
              <div className="col-span-4 flex flex-col gap-4">
                {/* Process Summary */}
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                  <p className="text-[12px] font-bold text-gray-800 mb-4 uppercase tracking-wider">
                    Process Summary
                  </p>
                  <div className="flex flex-col gap-4">
                    {[
                      { n: 1, title: 'Agency Details', desc: 'Name, owner, contact info' },
                      { n: 2, title: 'Plan & Limits', desc: 'Subscription tier and seat caps' },
                      { n: 3, title: 'Send Invite', desc: 'Owner receives onboarding email' },
                    ].map((step) => (
                      <div key={step.n} className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                            step.n === 1
                              ? 'text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                          style={step.n === 1 ? { background: '#031635' } : {}}
                        >
                          {step.n}
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-gray-800">{step.title}</p>
                          <p className="text-[11px] text-gray-500">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white transition-opacity disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
                >
                  {creating ? 'Creating...' : 'Send Invite'}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Save Draft
                </button>

                {/* Administrative Security card */}
                <div className="rounded-2xl p-5 bg-slate-900 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[18px] text-blue-300">
                      security
                    </span>
                    <p className="text-[12px] font-bold">Administrative Security</p>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Agency creation is logged and audited. The owner will receive a secure
                    onboarding link valid for 48 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
