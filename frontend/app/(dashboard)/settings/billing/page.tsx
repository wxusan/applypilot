'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

interface BillingStatus {
  status: string
  tokens_used: number
  token_limit: number
  subscription_plan: string
  recent_activity: any[]
}

export default function BillingSettings() {
  const [data, setData] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const result = await apiFetch<BillingStatus>('/api/settings/billing')
        setData(result)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined text-lg animate-spin">autorenew</span>
        <span className="text-sm font-mono">Calculating balances...</span>
      </div>
    )
  }

  if (!data) return null

  const percentage = Math.min((data.tokens_used / data.token_limit) * 100, 100)
  const isDanger = percentage >= 90
  const isWarning = percentage >= 75 && percentage < 90

  const barColor = isDanger ? 'bg-error' : isWarning ? 'bg-amber-500' : 'bg-primary'
  const usageTextColor = isDanger ? 'text-error' : isWarning ? 'text-amber-600' : 'text-on-surface'

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-2">
          Billing &amp; Quota
        </h1>
        <p className="text-on-surface-variant text-lg">
          Manage your agency&#39;s AI usage limits and computational allowances.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Token Usage Card */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="px-8 py-6 border-b border-outline-variant/10 bg-surface-container-low/30 flex items-start justify-between">
              <div>
                <h2 className="font-headline font-bold text-xl text-primary flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary">bolt</span>
                  Active Token Limit
                </h2>
                <p className="text-sm text-on-surface-variant max-w-md">
                  Tokens are consumed whenever an AI Agent drafts an essay, processes an email, or extracts information from uploaded PDFs.
                </p>
              </div>
              <span className="text-[10px] font-bold px-3 py-1 bg-surface-container text-on-surface-variant rounded-full uppercase tracking-widest shrink-0 ml-4">
                {data.subscription_plan} Plan
              </span>
            </div>

            {/* Usage meter */}
            <div className="px-8 py-6">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <span className={`text-4xl font-headline font-extrabold tracking-tight ${usageTextColor}`}>
                    {data.tokens_used.toLocaleString()}
                  </span>
                  <span className="text-on-surface-variant ml-2">/ {data.token_limit.toLocaleString()}</span>
                </div>
                <div className={`text-sm font-bold flex items-center gap-1.5 ${usageTextColor}`}>
                  <span className="material-symbols-outlined text-lg">
                    {isDanger ? 'battery_alert' : 'battery_full'}
                  </span>
                  {percentage.toFixed(1)}% Consumed
                </div>
              </div>

              <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {isDanger && (
                <div className="mt-6 bg-error-container/30 border border-error/20 rounded-xl px-5 py-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-error shrink-0 mt-0.5">battery_alert</span>
                  <div>
                    <p className="font-bold text-error text-sm mb-1">Critical Usage Warning</p>
                    <p className="text-sm text-on-surface-variant">
                      Your agency is dangerously close to its computational limit. AI engines will be suspended if this meter reaches 100%. Contact Support to increase limits.
                    </p>
                  </div>
                </div>
              )}

              {isWarning && (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-600 shrink-0 mt-0.5">warning</span>
                  <p className="text-sm text-amber-800">
                    Your usage is approaching the limit. Consider upgrading your plan or conserving AI usage.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar: Plan info */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Current Plan */}
          <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-[120px]">auto_awesome</span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-primary-container mb-4">
                Current Plan
              </p>
              <h3 className="font-headline font-extrabold text-2xl mb-2">
                {data.subscription_plan}
              </h3>
              <p className="text-xs text-on-primary-container leading-relaxed mb-6">
                Your plan includes AI-powered essay drafting, browser automation, and email intelligence.
              </p>
              <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold transition-all">
                Upgrade Plan
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm">
            <h4 className="font-headline font-bold text-primary mb-4">Usage Summary</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">Tokens Used</span>
                <span className="text-sm font-bold text-on-surface">{data.tokens_used.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">Token Limit</span>
                <span className="text-sm font-bold text-on-surface">{data.token_limit.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">Remaining</span>
                <span className={`text-sm font-bold ${isDanger ? 'text-error' : 'text-primary'}`}>
                  {Math.max(0, data.token_limit - data.tokens_used).toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-outline-variant/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Status</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    isDanger ? 'bg-error-container/50 text-error' :
                    isWarning ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isDanger ? 'Critical' : isWarning ? 'Warning' : 'Healthy'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
