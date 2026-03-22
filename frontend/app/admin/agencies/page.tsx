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

export default function AgencyManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newPlan, setNewPlan] = useState('starter')

  // Edit State
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

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) {
      alert('Name and slug are required.')
      return
    }
    setCreating(true)
    try {
      await apiFetch('/api/super-admin/agencies', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim().toLowerCase().replace(/\s+/g, '-'), subscription_plan: newPlan }),
      })
      setShowCreate(false)
      setNewName('')
      setNewSlug('')
      setNewPlan('starter')
      loadAgencies()
    } catch (err) {
      alert('Failed to create agency. Slug may already exist.')
    } finally {
      setCreating(false)
    }
  }

  const handleSave = async (id: string) => {
    if (!confirm('Apply these new limits?')) return;
    try {
      await apiFetch(`/api/super-admin/agencies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          subscription_plan: editPlan,
          max_staff: editStaff
        })
      });
      setEditingId(null)
      loadAgencies()
    } catch (err) {
      alert('Failed to update agency limits')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-gray-900">Agency Management</h1>
          <p className="text-[13px] text-gray-500 mt-1">Configure subscription plans and staff limits for all active clients.</p>
        </div>
        <button
          onClick={() => setShowCreate(v => !v)}
          aria-label="Create new agency"
          className="h-9 px-4 rounded-[6px] text-[13px] font-medium text-white flex items-center gap-2 transition hover:opacity-90"
          style={{ backgroundColor: '#1D9E75' }}
        >
          <Plus size={14} />
          New Agency
        </button>
      </div>

      {/* Create agency form */}
      {showCreate && (
        <div className="mb-5 bg-white rounded-[10px] p-5 border border-gray-200">
          <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Create New Agency</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 uppercase tracking-[0.5px] mb-1">Agency Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Acme Consulting"
                className="w-full h-8 px-3 text-[13px] rounded-[6px] border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 uppercase tracking-[0.5px] mb-1">Slug</label>
              <input
                type="text"
                value={newSlug}
                onChange={e => setNewSlug(e.target.value)}
                placeholder="acme-consulting"
                className="w-full h-8 px-3 text-[13px] rounded-[6px] border border-gray-200 font-mono focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 uppercase tracking-[0.5px] mb-1">Plan</label>
              <select
                value={newPlan}
                onChange={e => setNewPlan(e.target.value)}
                className="w-full h-8 px-3 text-[13px] rounded-[6px] border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="h-8 px-4 rounded-[6px] text-[12px] font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: '#1D9E75' }}
            >
              {creating ? 'Creating…' : 'Create Agency'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="h-8 px-4 rounded-[6px] text-[12px] text-gray-500 border border-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
                  
                  {/* EDIT MODE TOGGLE */}
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
                      <td className="px-4 py-3 border-r border-gray-100 font-mono">
                        {a.max_staff}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => {
                            setEditingId(a.id);
                            setEditPlan(a.subscription_plan);
                            setEditStaff(a.max_staff);
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
    </div>
  )
}
