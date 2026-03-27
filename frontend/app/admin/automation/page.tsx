'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'
import { ChevronDown, ChevronUp, CheckCircle, Clock, Zap } from 'lucide-react'

interface Agency {
  id: string
  name: string
  slug: string
  subscription_plan: string
  subscription_status: string | null
  subscription_expires_at: string | null
  max_staff: number
  max_students: number | null
  ai_tokens_used: number
  ai_token_limit: number
}

interface BillingLog {
  id: string
  action: string
  old_value: any
  new_value: any
  created_at: string
  user_id: string
}

interface PaymentForm {
  action: 'next_month' | 'upgrade_plan' | 'upgrade_staff' | 'reset_tokens' | 'add_tokens'
  plan: string
  max_staff: number
  token_amount: number
  note: string
}

const PLAN_OPTIONS = ['starter', 'pro', 'enterprise']

function TokenBar({ used, limit }: { used: number; limit: number }) {
  if (!limit) return null
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-[#1D9E75]'
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-mono tabular-nums ${pct >= 90 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
        {pct}%
      </span>
    </div>
  )
}

export default function AdminBillingPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [billingLogs, setBillingLogs] = useState<Record<string, BillingLog[]>>({})
  const [logsLoading, setLogsLoading] = useState<string | null>(null)

  const [form, setForm] = useState<PaymentForm>({ action: 'next_month', plan: 'pro', max_staff: 10, token_amount: 50000, note: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

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

  async function toggleExpand(agency: Agency) {
    if (expandedId === agency.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(agency.id)
    setSubmitError(null)
    setSubmitSuccess(null)
    setForm({ action: 'next_month', plan: agency.subscription_plan || 'pro', max_staff: agency.max_staff, token_amount: 50000, note: '' })

    if (!billingLogs[agency.id]) {
      setLogsLoading(agency.id)
      try {
        const data = await apiFetch<{ history: BillingLog[] }>(`/api/super-admin/agencies/${agency.id}/billing/history`)
        setBillingLogs((prev) => ({ ...prev, [agency.id]: data.history || [] }))
      } catch {
        setBillingLogs((prev) => ({ ...prev, [agency.id]: [] }))
      } finally {
        setLogsLoading(null)
      }
    }
  }

  async function handleApprove(agencyId: string) {
    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)
    try {
      const body: any = { action: form.action, note: form.note }
      if (form.action === 'upgrade_plan') body.plan = form.plan
      if (form.action === 'upgrade_staff') body.max_staff = form.max_staff
      if (form.action === 'add_tokens') body.token_amount = form.token_amount

      const result = await apiFetch<{ action: string }>(`/api/super-admin/agencies/${agencyId}/billing/approve`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setSubmitSuccess(`✓ Applied: ${result.action}`)
      await loadAgencies()
      const data = await apiFetch<{ history: BillingLog[] }>(`/api/super-admin/agencies/${agencyId}/billing/history`)
      setBillingLogs((prev) => ({ ...prev, [agencyId]: data.history || [] }))
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to apply billing action.')
    } finally {
      setSubmitting(false)
    }
  }

  const isExpired = (a: Agency) => {
    if (!a.subscription_expires_at) return false
    return new Date(a.subscription_expires_at) < new Date()
  }

  const getStatusBadge = (a: Agency) => {
    if (a.subscription_status === 'suspended')
      return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-50 text-red-700">Suspended</span>
    if (isExpired(a))
      return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-50 text-orange-700">Expired</span>
    if (a.subscription_status === 'trial')
      return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-yellow-50 text-yellow-700">Trial</span>
    return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-green-50 text-green-700">Active</span>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-gray-900">Billing & Oversight</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Manually approve billing actions and manage subscription limits for each agency.
          </p>
        </div>
        <Link
          href="/admin/agencies"
          className="text-[13px] text-gray-500 hover:text-gray-800 underline underline-offset-2"
        >
          ← All Agencies
        </Link>
      </div>

      {/* Agency List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-[10px] animate-pulse" />
          ))}
        </div>
      ) : agencies.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-[13px]">No agencies found.</div>
      ) : (
        <div className="space-y-3">
          {agencies.map((agency) => {
            const expanded = expandedId === agency.id
            const logs = billingLogs[agency.id] || []
            const expired = isExpired(agency)
            const tokenPct = agency.ai_token_limit
              ? Math.min(100, Math.round(((agency.ai_tokens_used || 0) / agency.ai_token_limit) * 100))
              : 0

            return (
              <div
                key={agency.id}
                className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Row Header */}
                <button
                  onClick={() => toggleExpand(agency)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#031635]/10 flex items-center justify-center text-[14px] font-bold text-[#031635] uppercase">
                      {agency.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-gray-900">{agency.name}</p>
                      <p className="text-[12px] text-gray-400 font-mono">{agency.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Token bar */}
                    {agency.ai_token_limit > 0 && (
                      <div className="hidden md:flex items-center gap-1.5">
                        <Zap size={11} className={tokenPct >= 90 ? 'text-red-500' : 'text-gray-300'} />
                        <TokenBar used={agency.ai_tokens_used || 0} limit={agency.ai_token_limit} />
                      </div>
                    )}
                    {getStatusBadge(agency)}
                    <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {agency.subscription_plan}
                    </span>
                    {agency.subscription_expires_at && (
                      <span className={`text-[11px] text-gray-400 hidden lg:block ${expired ? 'text-red-500 font-semibold' : ''}`}>
                        Expires {new Date(agency.subscription_expires_at).toLocaleDateString()}
                      </span>
                    )}
                    {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>

                {/* Expanded Panel */}
                {expanded && (
                  <div className="border-t border-gray-100 px-6 py-6 bg-gray-50/50">
                    {/* Token Usage Banner */}
                    {agency.ai_token_limit > 0 && (
                      <div className={`mb-6 rounded-lg px-4 py-3 flex items-center gap-4 ${
                        tokenPct >= 90
                          ? 'bg-red-50 border border-red-200'
                          : tokenPct >= 70
                          ? 'bg-amber-50 border border-amber-200'
                          : 'bg-[#E1F5EE] border border-[#1D9E75]/20'
                      }`}>
                        <Zap size={16} className={tokenPct >= 90 ? 'text-red-500' : tokenPct >= 70 ? 'text-amber-500' : 'text-[#1D9E75]'} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px] font-semibold text-gray-700">AI Token Usage</span>
                            <span className="text-[12px] font-mono text-gray-500">
                              {(agency.ai_tokens_used || 0).toLocaleString()} / {agency.ai_token_limit.toLocaleString()} tokens
                            </span>
                          </div>
                          <div className="h-2 bg-white/70 rounded-full overflow-hidden border border-gray-200">
                            <div
                              className={`h-full rounded-full transition-all ${
                                tokenPct >= 90 ? 'bg-red-500' : tokenPct >= 70 ? 'bg-amber-400' : 'bg-[#1D9E75]'
                              }`}
                              style={{ width: `${tokenPct}%` }}
                            />
                          </div>
                        </div>
                        <span className={`text-[13px] font-bold tabular-nums ${tokenPct >= 90 ? 'text-red-600' : tokenPct >= 70 ? 'text-amber-600' : 'text-[#1D9E75]'}`}>
                          {tokenPct}%
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-8">
                      {/* Left: Billing Action Form */}
                      <div>
                        <h3 className="text-[12px] font-bold text-gray-600 uppercase tracking-widest mb-4">Apply Billing Action</h3>
                        <div className="space-y-4">

                          {/* Action type */}
                          <div>
                            <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Action</label>
                            <select
                              value={form.action}
                              onChange={(e) => setForm({ ...form, action: e.target.value as any })}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#031635]/20 focus:border-[#031635] transition"
                            >
                              <option value="next_month">Extend 30 days</option>
                              <option value="upgrade_plan">Change Plan</option>
                              <option value="upgrade_staff">Set Max Staff</option>
                              <option value="add_tokens">Add AI Tokens (top-up)</option>
                              <option value="reset_tokens">Reset AI Token Counter</option>
                            </select>
                          </div>

                          {/* Conditional fields */}
                          {form.action === 'upgrade_plan' && (
                            <div>
                              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">New Plan</label>
                              <select
                                value={form.plan}
                                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#031635]/20 focus:border-[#031635] transition"
                              >
                                {PLAN_OPTIONS.map((p) => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {form.action === 'upgrade_staff' && (
                            <div>
                              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Max Staff</label>
                              <input
                                type="number"
                                min={1}
                                max={200}
                                value={form.max_staff}
                                onChange={(e) => setForm({ ...form, max_staff: parseInt(e.target.value) || 1 })}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#031635]/20 focus:border-[#031635] transition"
                              />
                            </div>
                          )}

                          {form.action === 'add_tokens' && (
                            <div>
                              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Tokens to Add</label>
                              <input
                                type="number"
                                min={1000}
                                step={10000}
                                value={form.token_amount}
                                onChange={(e) => setForm({ ...form, token_amount: parseInt(e.target.value) || 10000 })}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#031635]/20 focus:border-[#031635] transition"
                              />
                              <p className="text-[11px] text-gray-400 mt-1">
                                This increases the token limit — not resets it. The used counter stays unchanged.
                              </p>
                            </div>
                          )}

                          {form.action === 'reset_tokens' && (
                            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-[12px] text-amber-700">
                              This will set <strong>ai_tokens_used = 0</strong> for this agency. Use at the start of a new billing cycle.
                            </div>
                          )}

                          {/* Notes */}
                          <div>
                            <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Admin Note</label>
                            <textarea
                              rows={2}
                              value={form.note}
                              onChange={(e) => setForm({ ...form, note: e.target.value })}
                              placeholder="e.g. Paid 150,000 UZS via Click. Reference #8812"
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#031635]/20 focus:border-[#031635] transition resize-none"
                            />
                          </div>

                          {submitError && <p className="text-[12px] text-red-500">{submitError}</p>}
                          {submitSuccess && <p className="text-[12px] text-green-600 font-medium">{submitSuccess}</p>}

                          <button
                            onClick={() => handleApprove(agency.id)}
                            disabled={submitting}
                            className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-60 transition-opacity"
                            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
                          >
                            {submitting ? 'Applying...' : 'Apply & Record'}
                          </button>
                        </div>
                      </div>

                      {/* Right: Billing History */}
                      <div>
                        <h3 className="text-[12px] font-bold text-gray-600 uppercase tracking-widest mb-4">Billing History</h3>
                        {logsLoading === agency.id ? (
                          <div className="animate-pulse space-y-2">
                            {[1, 2, 3].map(i => <div key={i} className="h-8 bg-gray-200 rounded" />)}
                          </div>
                        ) : logs.length === 0 ? (
                          <p className="text-[13px] text-gray-400 italic">No billing actions recorded yet.</p>
                        ) : (
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                            {logs.map((log) => (
                              <div key={log.id} className="flex items-start gap-3">
                                <div className="mt-0.5">
                                  {log.action.includes('approve') ? (
                                    <CheckCircle size={14} className="text-green-500" />
                                  ) : (
                                    <Clock size={14} className="text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-medium text-gray-700 truncate">{log.action}</p>
                                  {log.new_value?.note && (
                                    <p className="text-[11px] text-gray-400 italic">{log.new_value.note}</p>
                                  )}
                                  <p className="text-[10px] text-gray-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
