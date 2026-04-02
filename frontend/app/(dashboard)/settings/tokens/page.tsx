'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

interface DayEntry {
  day: string
  tokens: number
}

interface TokenUsageData {
  tokens_used: number
  token_limit: number
  subscription_plan: string
  daily_chart: DayEntry[]
  by_agent_type: Record<string, number>
  recent_transactions: {
    id: string
    timestamp: string
    agent_type: string
    tokens_spent: number
    cost_usd: number
    model_name: string
  }[]
  total_transactions: number
}

const AGENT_TYPE_DISPLAY: Record<string, { label: string; icon: string; desc: string }> = {
  writer: {
    label: 'Essay Analysis',
    icon: 'description',
    desc: 'Structural review, tone assessment, and semantic coherence for student submissions.',
  },
  email: {
    label: 'Email Drafting',
    icon: 'alternate_email',
    desc: 'Personalized correspondence automation for admissions and scholarship inquiries.',
  },
  browser: {
    label: 'Profile Reviews',
    icon: 'person_search',
    desc: 'Holistic data synthesis and gap analysis for student academic and extracurricular profiles.',
  },
  coordinator: {
    label: 'Coordinator',
    icon: 'hub',
    desc: 'Orchestration of multi-step application workflows and deadline management.',
  },
}

function formatTimestamp(ts: string): string {
  if (!ts) return '—'
  try {
    const d = new Date(ts)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ts
  }
}

function shortDay(iso: string): string {
  if (!iso) return ''
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  try {
    return days[new Date(iso + 'T12:00:00Z').getUTCDay()]
  } catch {
    return iso.slice(5)
  }
}

function agentLabel(type: string): string {
  return AGENT_TYPE_DISPLAY[type]?.label ?? type
}

export default function TokenUsagePage() {
  const [data, setData] = useState<TokenUsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<TokenUsageData>('/api/settings/billing/tokens')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const tokensRemaining = data ? data.token_limit - data.tokens_used : null
  const efficiencyPct =
    data && data.token_limit > 0
      ? Math.round((1 - data.tokens_used / data.token_limit) * 100)
      : null

  const maxDayTokens = data
    ? Math.max(...data.daily_chart.map((d) => d.tokens), 1)
    : 1

  // Sort agent types by usage desc for service breakdown
  const agentBreakdown = data
    ? Object.entries(data.by_agent_type)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
    : []

  const totalBreakdownTokens = agentBreakdown.reduce((s, [, v]) => s + v, 0) || 1

  return (
    <div className="space-y-10">
      {/* Breadcrumbs & Header */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-on-surface-variant text-sm font-medium">
          <span>Administration</span>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span>Billing</span>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-semibold">Token Usage</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h3 className="font-headline text-4xl font-extrabold text-primary tracking-tight">Token Usage Detail</h3>
            <p className="text-on-surface-variant mt-2 max-w-2xl">
              A comprehensive breakdown of your institutional computational resources utilized by AI Pilot during the current billing cycle.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-2.5 bg-surface-container text-on-surface font-semibold rounded-lg hover:bg-surface-container-high transition-colors flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-sm">download</span> Export Report
            </button>
          </div>
        </div>
      </section>

      {/* Usage Overview Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Main Chart Area */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-[0_40px_40px_rgba(3,22,53,0.04)]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Utilization Velocity</p>
              <h4 className="font-headline text-2xl font-bold text-primary">Daily Consumption (7 Days)</h4>
            </div>
          </div>
          {loading ? (
            <div className="h-64 bg-surface-container animate-pulse rounded-xl" />
          ) : (
            <div className="h-64 flex items-end justify-between gap-4 px-4">
              {(data?.daily_chart ?? []).map((bar) => {
                const pct = Math.max((bar.tokens / maxDayTokens) * 100, 2)
                return (
                  <div key={bar.day} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-primary rounded-t-lg relative"
                      style={{ height: `${pct}%` }}
                      title={`${bar.tokens.toLocaleString()} tokens`}
                    />
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                      {shortDay(bar.day)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          <div className="mt-8 pt-8 border-t border-outline-variant/15 flex gap-8">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary"></span>
              <span className="text-xs font-bold text-primary">Tokens Consumed / Day</span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-primary p-8 rounded-xl text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Current Balance</p>
              <h4 className="text-4xl font-extrabold tracking-tight mb-4">
                {loading ? '—' : tokensRemaining !== null ? tokensRemaining.toLocaleString() : '—'}
              </h4>
              <p className="text-sm font-medium opacity-80">Remaining tokens across all Pilot services.</p>
            </div>
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          <div className="bg-surface-container-low p-8 rounded-xl flex-1 border border-outline-variant/15">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 text-center">Efficiency Rating</p>
            <div className="flex flex-col items-center justify-center h-full gap-4 py-4">
              <div className="w-32 h-32 rounded-full border-[10px] border-primary-container flex items-center justify-center relative">
                {efficiencyPct !== null && (
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
                    <circle
                      cx="64" cy="64" fill="none" r="54"
                      stroke="#031635"
                      strokeDasharray="339.29"
                      strokeDashoffset={339.29 * (1 - efficiencyPct / 100)}
                      strokeWidth="10"
                    />
                  </svg>
                )}
                <span className="text-2xl font-extrabold text-primary">
                  {loading ? '—' : efficiencyPct !== null ? `${efficiencyPct}%` : '—'}
                </span>
              </div>
              <p className="text-xs font-semibold text-on-surface-variant text-center leading-relaxed">
                Tokens remaining relative to your plan limit.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Service Breakdown */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="font-headline text-2xl font-bold text-primary">Service Breakdown</h4>
          <span className="text-sm font-bold text-on-surface-variant">Last 30 days</span>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-surface-container animate-pulse rounded-xl" />
            ))}
          </div>
        ) : agentBreakdown.length === 0 ? (
          <div className="p-8 bg-surface-container-lowest rounded-xl text-center text-on-surface-variant text-sm">
            No AI usage recorded in the last 30 days.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agentBreakdown.map(([type, tokens]) => {
              const meta = AGENT_TYPE_DISPLAY[type] ?? { label: type, icon: 'smart_toy', desc: 'AI operations.' }
              const widthPct = Math.round((tokens / totalBreakdownTokens) * 100)
              return (
                <div key={type} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-primary">{meta.icon}</span>
                  </div>
                  <h5 className="font-headline text-lg font-extrabold text-primary mb-2">{meta.label}</h5>
                  <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">{meta.desc}</p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-on-surface-variant uppercase">Token Usage</span>
                      <span className="text-lg font-bold text-primary">{tokens.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: `${widthPct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase">
                      <span>{widthPct}% of tracked usage</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Recent Transactions Table */}
      <section className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10 shadow-sm">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h4 className="font-headline text-lg font-bold text-primary">Recent Transactions</h4>
          <span className="text-sm font-bold text-on-surface-variant">
            {data ? `${data.total_transactions.toLocaleString()} total operations this month` : ''}
          </span>
        </div>
        {loading ? (
          <div className="h-48 bg-surface-container animate-pulse" />
        ) : !data || data.recent_transactions.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant text-sm">No transactions recorded yet.</div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Operation</th>
                  <th className="px-6 py-4">Model</th>
                  <th className="px-6 py-4">Resource Cost</th>
                  <th className="px-6 py-4">USD Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {data.recent_transactions.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-5 text-xs font-medium text-on-surface-variant">
                      {formatTimestamp(row.timestamp)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        <span className="text-sm font-semibold text-primary">{agentLabel(row.agent_type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-on-surface-variant">
                      {row.model_name || '—'}
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-primary">
                      {row.tokens_spent.toLocaleString()} Tokens
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">
                      ${row.cost_usd.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-6 bg-surface-container-low flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant">
                Showing last {data.recent_transactions.length} of {data.total_transactions.toLocaleString()} operations
              </span>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
