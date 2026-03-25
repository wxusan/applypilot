'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Save, Info } from 'lucide-react'

interface PlanConfig {
  plan: string
  max_staff: number
  max_students: number
  ai_token_limit: number
}

const PLAN_META: Record<string, { label: string; color: string; desc: string }> = {
  starter:    { label: 'Starter',    color: '#1D9E75', desc: 'Small agencies getting started' },
  pro:        { label: 'Pro',        color: '#3B82F6', desc: 'Growing agencies with more students' },
  enterprise: { label: 'Enterprise', color: '#7C3AED', desc: '0 = unlimited for all fields' },
}

function fmt(n: number) {
  if (n === 0) return '∞ Unlimited'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`
  return String(n)
}

export default function PlanSettingsPage() {
  const [configs, setConfigs] = useState<Record<string, PlanConfig>>({})
  const [editing, setEditing] = useState<Record<string, PlanConfig>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ plans: Record<string, PlanConfig> }>('/api/super-admin/plans')
      .then((data) => {
        setConfigs(data.plans)
        setEditing(JSON.parse(JSON.stringify(data.plans)))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (plan: string) => {
    setSaving(plan)
    setError(null)
    try {
      await apiFetch(`/api/super-admin/plans/${plan}`, {
        method: 'PATCH',
        body: JSON.stringify(editing[plan]),
      })
      setConfigs((prev) => ({ ...prev, [plan]: { ...editing[plan] } }))
      setSaved(plan)
      setTimeout(() => setSaved(null), 2500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(null)
    }
  }

  const set = (plan: string, field: keyof PlanConfig, value: number) => {
    setEditing((prev) => ({ ...prev, [plan]: { ...prev[plan], [field]: value } }))
  }

  const isDirty = (plan: string) =>
    JSON.stringify(editing[plan]) !== JSON.stringify(configs[plan])

  if (loading) return <div className="text-[13px] text-gray-400 p-6">Loading plan configuration…</div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-gray-900">Plan Configuration</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          Set default limits for each plan. These apply to all new agencies created on that plan.
          Existing agencies are not affected.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-start gap-2 mb-6 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-[12px] text-amber-700">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          <strong>Enterprise plan:</strong> set any field to <strong>0</strong> to mean unlimited.
          Staff = 0 → unlimited counselors, Students = 0 → unlimited students, Tokens = 0 → unlimited AI usage.
        </span>
      </div>

      <div className="space-y-5">
        {['starter', 'pro', 'enterprise'].map((plan) => {
          const meta = PLAN_META[plan]
          const cfg = editing[plan]
          if (!cfg) return null
          const dirty = isDirty(plan)
          const isSaving = saving === plan
          const wasSaved = saved === plan

          return (
            <div key={plan} className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
              {/* Plan header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <div>
                    <span className="text-[15px] font-semibold text-gray-900">{meta.label}</span>
                    <span className="ml-2 text-[12px] text-gray-400">{meta.desc}</span>
                  </div>
                </div>
                <button
                  disabled={!dirty || isSaving}
                  onClick={() => handleSave(plan)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={
                    wasSaved
                      ? { backgroundColor: '#F0FDF4', color: '#166534' }
                      : dirty
                      ? { backgroundColor: meta.color, color: '#fff' }
                      : { backgroundColor: '#F3F4F6', color: '#9CA3AF' }
                  }
                >
                  <Save size={12} />
                  {isSaving ? 'Saving…' : wasSaved ? 'Saved ✓' : 'Save Changes'}
                </button>
              </div>

              {/* Limit fields */}
              <div className="px-6 py-5 grid grid-cols-3 gap-6">
                {/* Staff */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                      Staff Seats
                    </label>
                    <span className="text-[13px] font-semibold text-gray-800 font-mono">
                      {fmt(cfg.max_staff)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={cfg.max_staff}
                    onChange={(e) => set(plan, 'max_staff', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-300 font-mono"
                    placeholder="0 = unlimited"
                  />
                  <p className="text-[10px] text-gray-400">0 = unlimited</p>
                </div>

                {/* Students */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                      Students
                    </label>
                    <span className="text-[13px] font-semibold text-gray-800 font-mono">
                      {fmt(cfg.max_students)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={cfg.max_students}
                    onChange={(e) => set(plan, 'max_students', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-300 font-mono"
                    placeholder="0 = unlimited"
                  />
                  <p className="text-[10px] text-gray-400">0 = unlimited</p>
                </div>

                {/* AI Tokens */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                      AI Tokens
                    </label>
                    <span className="text-[13px] font-semibold text-gray-800 font-mono">
                      {fmt(cfg.ai_token_limit)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={cfg.ai_token_limit}
                    onChange={(e) => set(plan, 'ai_token_limit', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-300 font-mono"
                    placeholder="0 = unlimited"
                  />
                  <p className="text-[10px] text-gray-400">0 = unlimited</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
