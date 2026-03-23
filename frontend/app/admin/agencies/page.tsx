'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

interface Agency {
  id: string
  name: string
  slug: string
  subscription_plan: string
  max_staff: number
  created_at: string
}

function getPlanBadgeClass(plan: string) {
  switch (plan?.toLowerCase()) {
    case 'enterprise': return 'bg-primary-container text-white'
    case 'professional': return 'bg-secondary-container text-secondary'
    default: return 'bg-surface-container text-on-surface-variant'
  }
}

export default function AgencyManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPlan, setEditPlan] = useState('')
  const [editStaff, setEditStaff] = useState(0)

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="text-4xl font-headline font-extrabold tracking-tight text-primary">
            Global Agency Portfolio
          </h2>
          <p className="text-on-surface-variant mt-2 font-body text-lg">
            Managing {agencies.length} active agenc{agencies.length !== 1 ? 'ies' : 'y'}.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-primary font-bold text-sm flex items-center gap-2 hover:bg-surface-bright transition-all">
            <span className="material-symbols-outlined text-lg">filter_list</span>
            Filter
          </button>
          <button className="px-5 py-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-primary font-bold text-sm flex items-center gap-2 hover:bg-surface-bright transition-all">
            <span className="material-symbols-outlined text-lg">download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Agency Table */}
      <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/50 border-b border-outline-variant/20">
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Agency Name</th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Slug</th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Plan Level</th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Max Staff</th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-2xl">autorenew</span>
                </td>
              </tr>
            ) : agencies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant italic">
                  No agencies found.
                </td>
              </tr>
            ) : (
              agencies.map((a) => (
                <tr key={a.id} className="bg-white group cursor-pointer hover:bg-surface-bright transition-all">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center font-bold text-primary text-sm">
                        {a.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-primary">{a.name}</p>
                        <p className="text-xs text-on-surface-variant font-mono">{a.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-on-surface-variant font-mono text-sm">{a.slug}</td>

                  {editingId === a.id ? (
                    <>
                      <td className="px-6 py-5">
                        <select
                          value={editPlan}
                          onChange={(e) => setEditPlan(e.target.value)}
                          className="bg-surface-container rounded-xl px-3 py-2 text-sm font-medium text-on-surface border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        >
                          <option value="starter">Starter</option>
                          <option value="professional">Professional</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </td>
                      <td className="px-6 py-5">
                        <input
                          type="number"
                          value={editStaff}
                          onChange={(e) => setEditStaff(parseInt(e.target.value))}
                          className="bg-surface-container rounded-xl px-3 py-2 text-sm font-medium text-on-surface border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 focus:outline-none w-20"
                        />
                      </td>
                      <td className="px-6 py-5 text-right space-x-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-surface-container"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                        <button
                          onClick={() => handleSave(a.id)}
                          className="p-2 text-emerald-600 hover:text-emerald-700 transition-colors rounded-lg hover:bg-emerald-50"
                        >
                          <span className="material-symbols-outlined text-lg">check</span>
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-tighter ${getPlanBadgeClass(a.subscription_plan)}`}>
                          {a.subscription_plan}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-mono text-on-surface font-semibold">
                        {a.max_staff}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => {
                            setEditingId(a.id)
                            setEditPlan(a.subscription_plan)
                            setEditStaff(a.max_staff)
                          }}
                          className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-surface-container"
                          title="Override Limits"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
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
    </div>
  )
}
