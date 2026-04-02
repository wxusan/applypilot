'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import RenewalConfirmedModal from '@/components/billing/RenewalConfirmedModal'

interface BillingStatus {
  status: string
  tokens_used: number
  token_limit: number
  subscription_plan: string
  recent_activity: { label: string; time: string }[]
  user_role?: string
}

interface PaymentRecord {
  id: string
  agency_name: string
  agency_initials: string
  tier: string
  outstanding: number
  status: 'active' | 'pending' | 'overdue'
  tokens_used?: number
  token_limit?: number
}

const PLAN_FEATURES = {
  starter: [
    { label: '15 Student Roster', included: true },
    { label: '2 Staff Accounts', included: true },
    { label: '1.5M AI Tokens / month', included: true },
    { label: 'Core AI Counselor', included: true },
    { label: 'Priority Support', included: false },
    { label: 'Advanced Analytics', included: false },
    { label: 'Custom Branded Portals', included: false },
  ],
  pro: [
    { label: '35 Student Roster', included: true },
    { label: '4 Staff Accounts', included: true },
    { label: '5M AI Tokens / month', included: true },
    { label: 'Advanced AI Analysis', included: true },
    { label: 'Priority 24/7 Support', included: true },
    { label: 'Advanced Analytics', included: true },
    { label: 'Custom Branded Portals', included: true },
  ],
  enterprise: [
    { label: 'Unlimited Students', included: true },
    { label: 'Unlimited Staff', included: true },
    { label: 'Unlimited AI Tokens', included: true },
    { label: 'Full AI Suite', included: true },
    { label: 'Dedicated Support', included: true },
    { label: 'Advanced Analytics', included: true },
    { label: 'Custom Integrations', included: true },
  ],
}

function StatusBadge({ status }: { status: PaymentRecord['status'] }) {
  const map = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-orange-100 text-orange-800',
    overdue: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider ${map[status]}`}>
      {status}
    </span>
  )
}

export default function BillingSettings() {
  const router = useRouter()
  const [data, setData] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [noteForm, setNoteForm] = useState({ amount: '', method: 'Bank Transfer', note: '' })
  const [showRenewalConfirmed, setShowRenewalConfirmed] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const result = await apiFetch<BillingStatus>('/api/settings/billing')
        setData(result)

        // Load agency payment records if super_admin
        if (result.user_role === 'super_admin') {
          setPaymentsLoading(true)
          try {
            const agencyData = await apiFetch<PaymentRecord[]>('/api/settings/billing/agencies')
            setPayments(agencyData)
          } catch {
            // Keep empty on error
          } finally {
            setPaymentsLoading(false)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const percentage = data ? Math.min((data.tokens_used / data.token_limit) * 100, 100) : 0
  const isDanger = percentage >= 90
  const isWarning = percentage >= 75 && percentage < 90

  const barColor = isDanger
    ? 'bg-red-500'
    : isWarning
    ? 'bg-amber-500'
    : 'bg-[#031635]'

  const percentColor = isDanger
    ? 'text-red-600'
    : isWarning
    ? 'text-amber-600'
    : 'text-[#031635]'

  return (
    <div className="max-w-5xl space-y-12 pb-16">

      {/* ── PAGE HEADER ── */}
      <div>
        <h1 className="font-[Manrope] text-[22px] font-bold text-[#031635]">Billing &amp; Quota</h1>
        <p className="text-[13px] text-gray-500 mt-1">Manage your agency's usage, subscription plan, and payment records.</p>
      </div>

      {/* ════════════════════════════════════════════
          SECTION 1 — Token Usage
      ════════════════════════════════════════════ */}
      <section>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-7 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#031635] mt-0.5" style={{ fontSize: 20 }}>bolt</span>
              <div>
                <h2 className="font-[Manrope] text-[15px] font-bold text-[#031635]">Active Token Limit</h2>
                <p className="text-[12px] text-gray-500 mt-0.5 max-w-md">
                  Tokens are consumed when an AI Agent drafts an essay, processes an email, or extracts data from uploaded PDFs.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 bg-[#031635] text-white text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>workspace_premium</span>
                {loading ? '—' : `Current Plan: ${data?.subscription_plan ?? 'Professional'}`}
              </span>
            </div>
          </div>

          {/* Usage meter */}
          <div className="px-7 py-6">
            {loading ? (
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ) : data ? (
              <>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className={`text-[28px] font-[Manrope] font-extrabold ${isDanger ? 'text-red-600' : 'text-[#031635]'}`}>
                      {data.tokens_used.toLocaleString()}
                    </span>
                    <span className="text-[13px] text-gray-400 ml-1.5">/ {data.token_limit.toLocaleString()} tokens</span>
                  </div>
                  <span className={`text-[13px] font-semibold ${percentColor}`}>
                    {percentage.toFixed(1)}% consumed
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Threshold labels */}
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-gray-400">0</span>
                  <span className="text-[10px] text-amber-500">75% warning</span>
                  <span className="text-[10px] text-red-500">90% critical</span>
                  <span className="text-[10px] text-gray-400">{data.token_limit.toLocaleString()}</span>
                </div>

                {isDanger && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-red-600 mt-0.5" style={{ fontSize: 18 }}>warning</span>
                    <p className="text-[12px] text-red-700 leading-relaxed">
                      <strong>Critical:</strong> Your agency is approaching its computational limit. AI engines will be suspended at 100%. Contact support to increase your quota.
                    </p>
                  </div>
                )}

                {isWarning && !isDanger && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-amber-600 mt-0.5" style={{ fontSize: 18 }}>info</span>
                    <p className="text-[12px] text-amber-700 leading-relaxed">
                      You've used over 75% of your token quota. Consider upgrading your plan or reducing AI usage.
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Recent activity */}
          {data && data.recent_activity && data.recent_activity.length > 0 && (
            <div className="px-7 py-5 border-t border-gray-100 bg-[#f7f9fb]">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Recent Activity</p>
              <div className="space-y-2">
                {data.recent_activity.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600">{item.label}</span>
                    <span className="text-[11px] text-gray-400">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 2 — Plan Comparison
      ════════════════════════════════════════════ */}
      <section>
        <div className="mb-6">
          <h2 className="font-[Manrope] text-[20px] font-extrabold text-[#031635]">Elevate Your Agency</h2>
          <p className="text-[13px] text-gray-500 mt-1">Choose the plan that best fits your team's scale and ambitions.</p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

          {/* Starter */}
          <div className="bg-[#f7f9fb] border border-gray-200 rounded-2xl p-6 flex flex-col">
            <div className="mb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Starter</p>
              <div className="flex items-end gap-1">
                <span className="font-[Manrope] text-[28px] font-extrabold text-[#031635]">$79</span>
                <span className="text-[12px] text-gray-500 mb-1">/mo</span>
              </div>
              <p className="text-[12px] text-gray-500 mt-1">For small agencies getting started</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {PLAN_FEATURES.starter.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px]">
                  <span
                    className={`material-symbols-outlined shrink-0 ${f.included ? 'text-[#031635]' : 'text-gray-300'}`}
                    style={{ fontSize: 16 }}
                  >
                    {f.included ? 'check_circle' : 'cancel'}
                  </span>
                  <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>{f.label}</span>
                </li>
              ))}
            </ul>
            <button className="w-full py-2.5 rounded-xl border border-[#031635] text-[#031635] text-[13px] font-bold hover:bg-[#031635] hover:text-white transition-all">
              Current Plan
            </button>
          </div>

          {/* Pro — Recommended */}
          <div className="bg-white border-2 border-[#031635] rounded-2xl p-6 flex flex-col shadow-xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-[#031635] text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                Recommended
              </span>
            </div>
            <div className="mb-4 mt-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pro</p>
              <div className="flex items-end gap-1">
                <span className="font-[Manrope] text-[28px] font-extrabold text-[#031635]">$199</span>
                <span className="text-[12px] text-gray-500 mb-1">/mo</span>
              </div>
              <p className="text-[12px] text-gray-500 mt-1">For growing agencies scaling fast</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {PLAN_FEATURES.pro.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px]">
                  <span
                    className={`material-symbols-outlined shrink-0 ${f.included ? 'text-[#031635]' : 'text-gray-300'}`}
                    style={{ fontSize: 16 }}
                  >
                    {f.included ? 'verified' : 'cancel'}
                  </span>
                  <span className={f.included ? 'text-gray-800 font-medium' : 'text-gray-400'}>{f.label}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowRenewalConfirmed(true)}
              className="w-full py-2.5 rounded-xl text-white text-[13px] font-bold bg-gradient-to-br from-[#031635] to-[#1a2b4b] hover:from-[#1a2b4b] hover:to-[#031635] transition-all shadow-lg"
            >
              Request Upgrade
            </button>
          </div>

          {/* Enterprise */}
          <div className="bg-[#f7f9fb] border border-gray-200 rounded-2xl p-6 flex flex-col">
            <div className="mb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Enterprise</p>
              <div className="flex items-end gap-1">
                <span className="font-[Manrope] text-[28px] font-extrabold text-[#031635]">$499</span>
                <span className="text-[12px] text-gray-500 mb-1">/mo</span>
              </div>
              <p className="text-[12px] text-gray-500 mt-1">Tailored for large-scale operations</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {PLAN_FEATURES.enterprise.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px]">
                  <span className="material-symbols-outlined text-[#031635] shrink-0" style={{ fontSize: 16 }}>
                    check_circle
                  </span>
                  <span className="text-gray-700">{f.label}</span>
                </li>
              ))}
            </ul>
            <button className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-700 text-[13px] font-bold hover:border-[#031635] hover:text-[#031635] transition-all">
              Contact Sales
            </button>
          </div>
        </div>

        {/* Capacity Breakdown */}
        <div className="bg-[#f2f4f6] rounded-3xl p-7 mb-5">
          <p className="font-[Manrope] text-[13px] font-bold text-[#031635] uppercase tracking-widest mb-5">Capacity Breakdown: Starter → Pro</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            {[
              { icon: 'group', label: 'Student Roster', from: '15', to: '35' },
              { icon: 'badge', label: 'Staff Accounts', from: '2', to: '4' },
              { icon: 'bolt', label: 'AI Tokens / mo', from: '1.5M', to: '5M' },
              { icon: 'support_agent', label: 'Support', from: 'Standard', to: 'Priority 24/7' },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-2xl p-5 border border-gray-200">
                <span className="material-symbols-outlined text-[#031635] mb-3 block" style={{ fontSize: 22 }}>{item.icon}</span>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{item.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-gray-400 line-through">{item.from}</span>
                  <span className="material-symbols-outlined text-[#031635]" style={{ fontSize: 16 }}>arrow_forward</span>
                  <span className="text-[15px] font-[Manrope] font-extrabold text-[#031635]">{item.to}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notice card */}
        <div className="bg-[#031635] rounded-2xl px-7 py-5 flex items-start gap-4">
          <span className="material-symbols-outlined text-white/60 mt-0.5 shrink-0" style={{ fontSize: 20 }}>info</span>
          <div>
            <p className="font-[Manrope] text-[13px] font-bold text-white mb-1">Notice for Agency Admins</p>
            <p className="text-[12px] text-white/70 leading-relaxed">
              Plan upgrades take effect immediately upon approval. Your token quota will be adjusted pro-rated for the current billing cycle. All data and student records are retained across plan changes. Contact support if you experience any discrepancies after an upgrade.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 3 — Payment Records & Note Panel (038)
          Only visible to super_admin role
      ════════════════════════════════════════════ */}
      {data?.user_role === 'super_admin' && <section>
        <div className="mb-6">
          <h2 className="font-[Manrope] text-[20px] font-extrabold text-[#031635]">Agency Payment Records</h2>
          <p className="text-[13px] text-gray-500 mt-1">Manage financial records and log manual payment entries for registered agencies.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Agencies', value: paymentsLoading ? '—' : payments.length.toString() },
            { label: 'Active Subscriptions', value: paymentsLoading ? '—' : payments.filter(p => p.status === 'active').length.toString() },
            { label: 'System Uptime', value: '99.9%', highlight: true },
            { label: 'Pending Review', value: paymentsLoading ? '—' : payments.filter(p => p.status === 'pending').length.toString() },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#f2f4f6] rounded-2xl px-5 py-4 border border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={`font-[Manrope] text-[22px] font-extrabold ${stat.highlight ? 'text-green-600' : 'text-[#031635]'}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-[#f2f4f6] rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#e6e8ea]/60">
                  <th className="px-6 py-4 font-[Manrope] text-[12px] font-bold text-[#031635]">Agency Name</th>
                  <th className="px-6 py-4 font-[Manrope] text-[12px] font-bold text-[#031635]">Tier</th>
                  <th className="px-6 py-4 font-[Manrope] text-[12px] font-bold text-[#031635]">Outstanding</th>
                  <th className="px-6 py-4 font-[Manrope] text-[12px] font-bold text-[#031635]">Status</th>
                  <th className="px-6 py-4 font-[Manrope] text-[12px] font-bold text-[#031635] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/60">
                {paymentsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">Loading agency records…</td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">No agencies found.</td>
                  </tr>
                ) : null}
                {payments.map((agency) => (
                  <>
                    <tr
                      key={agency.id}
                      className="bg-white hover:bg-[#f7f9fb] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#1a2b4b]/20 rounded-xl flex items-center justify-center text-[#031635] text-[11px] font-black">
                            {agency.agency_initials}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-[#031635]">{agency.agency_name}</p>
                            <p className="text-[11px] text-gray-400">ID: {agency.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[12px] text-gray-600">{agency.tier}</td>
                      <td className="px-6 py-4 text-[13px] font-bold">
                        <span className={agency.outstanding > 0 ? 'text-red-600' : 'text-gray-600'}>
                          ${agency.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={agency.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setExpandedRow(expandedRow === agency.id ? null : agency.id)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
                            expandedRow === agency.id
                              ? 'bg-[#031635] text-white'
                              : 'text-[#031635] hover:bg-[#031635]/5'
                          }`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                            {expandedRow === agency.id ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                          </span>
                          {expandedRow === agency.id ? 'Close' : 'Manage'}
                        </button>
                      </td>
                    </tr>

                    {/* Expansion Panel */}
                    {expandedRow === agency.id && (
                      <tr key={`${agency.id}-panel`} className="bg-white">
                        <td colSpan={5} className="p-0">
                          <div className="p-8 bg-[#f7f9fb]/70 border-y border-gray-100">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                              {/* Left: Ledger summary */}
                              <div className="lg:col-span-1 space-y-5">
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Manual Payment Entry</p>
                                  <p className="text-[12px] text-gray-500 leading-relaxed">
                                    Record payments received through offline channels or manual gateways to update the agency ledger.
                                  </p>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                  <div className="flex items-center gap-2 mb-4 text-[#031635]">
                                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>account_balance_wallet</span>
                                    <span className="font-[Manrope] text-[13px] font-bold">Ledger Summary</span>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex justify-between text-[12px]">
                                      <span className="text-gray-500">Plan</span>
                                      <span className="font-medium text-[#031635]">{agency.tier}</span>
                                    </div>
                                    {agency.token_limit != null && agency.token_limit > 0 && (
                                      <div className="flex justify-between text-[12px]">
                                        <span className="text-gray-500">Token Usage</span>
                                        <span className="font-medium text-[#031635]">
                                          {(agency.tokens_used ?? 0).toLocaleString()} / {agency.token_limit.toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                    <div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-[12px]">
                                      <span className="text-[#031635]">Outstanding</span>
                                      <span className={agency.outstanding > 0 ? 'text-red-600' : 'text-green-700'}>
                                        ${agency.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Right: Form */}
                              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-7 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                  <div className="space-y-1.5">
                                    <label className="block text-[12px] font-bold text-[#031635]">Payment Amount</label>
                                    <div className="relative">
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-[13px]">$</span>
                                      <input
                                        type="number"
                                        placeholder="0.00"
                                        value={noteForm.amount}
                                        onChange={(e) => setNoteForm({ ...noteForm, amount: e.target.value })}
                                        className="w-full bg-[#f2f4f6] border-0 border-b-2 border-transparent focus:border-[#031635] focus:ring-0 rounded-xl py-3 pl-10 pr-4 text-[13px] font-medium text-[#031635] transition-all outline-none"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="block text-[12px] font-bold text-[#031635]">Payment Method</label>
                                    <select
                                      value={noteForm.method}
                                      onChange={(e) => setNoteForm({ ...noteForm, method: e.target.value })}
                                      className="w-full bg-[#f2f4f6] border-0 border-b-2 border-transparent focus:border-[#031635] focus:ring-0 rounded-xl py-3 px-4 text-[13px] font-medium text-[#031635] transition-all outline-none"
                                    >
                                      <option>Click</option>
                                      <option>Payme</option>
                                      <option>Bank Transfer</option>
                                      <option>Cash Deposit</option>
                                      <option>International Wire</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="space-y-1.5 mb-6">
                                  <label className="block text-[12px] font-bold text-[#031635]">Internal Note</label>
                                  <textarea
                                    rows={4}
                                    placeholder="Add specific details about this transaction for the audit trail..."
                                    value={noteForm.note}
                                    onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
                                    className="w-full bg-[#f2f4f6] border-0 border-b-2 border-transparent focus:border-[#031635] focus:ring-0 rounded-xl py-3 px-4 text-[13px] font-medium text-[#031635] leading-relaxed transition-all outline-none resize-none"
                                  />
                                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>info</span>
                                    This note is only visible to super-admins and auditors.
                                  </p>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                  <button
                                    type="button"
                                    onClick={() => setNoteForm({ amount: '', method: 'Bank Transfer', note: '' })}
                                    className="px-5 py-2.5 text-[12px] font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                                  >
                                    Discard
                                  </button>
                                  <button
                                    type="button"
                                    className="bg-gradient-to-br from-[#031635] to-[#1a2b4b] text-white px-7 py-2.5 rounded-xl text-[12px] font-bold shadow-lg hover:shadow-[#031635]/20 flex items-center gap-2 transition-all active:scale-95"
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>save</span>
                                    Save Record
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>}

      {showRenewalConfirmed && (
        <RenewalConfirmedModal
          onGoToBilling={() => setShowRenewalConfirmed(false)}
          onReturnToDashboard={() => router.push('/dashboard')}
          onClose={() => setShowRenewalConfirmed(false)}
        />
      )}
    </div>
  )
}
