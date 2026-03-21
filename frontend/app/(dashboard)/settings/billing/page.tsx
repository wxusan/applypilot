'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Battery, BatteryWarning, Zap } from 'lucide-react'

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

  if (loading) return <div className="text-[13px] text-gray-500 font-mono animate-pulse">Calculating balances...</div>
  if (!data) return null

  const percentage = Math.min((data.tokens_used / data.token_limit) * 100, 100)
  const isDanger = percentage >= 90
  const isWarning = percentage >= 75 && percentage < 90

  return (
    <div className="max-w-3xl">
      <h1 className="text-[20px] font-semibold text-gray-900">Billing & Quota</h1>
      <p className="text-[13px] text-gray-500 mt-1 mb-8">Manage your agency's mechanical usage limits and computational allowances.</p>

      <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden shadow-sm mb-8">
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-medium text-gray-900 flex items-center gap-2">
              <Zap size={16} className="text-brand" /> 
              Active Token Limit
            </h2>
            <p className="text-[13px] text-gray-500 mt-1 max-w-[400px]">
              Tokens are consumed immediately whenever an autonomous Agent drafts an essay, processes an email, or extracts information from uploaded PDFs.
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex bg-gray-100 text-gray-700 font-bold px-2 py-1 rounded uppercase text-[10px] tracking-wider">
              {data.subscription_plan} PLAN
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className={`text-[24px] font-semibold ${isDanger ? 'text-red-600' : 'text-gray-900'}`}>
                {data.tokens_used.toLocaleString()}
              </span>
              <span className="text-[13px] text-gray-500 ml-1">/ {data.token_limit.toLocaleString()}</span>
            </div>
            <div className={`text-[12px] font-medium flex items-center gap-1 ${isDanger ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-gray-500'}`}>
              {isDanger ? <BatteryWarning size={14} /> : <Battery size={14} />}
              {percentage.toFixed(1)}% Consumed
            </div>
          </div>

          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-[#1D9E75]'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {isDanger && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-[12px] p-3 rounded-[6px] flex items-start gap-2">
              <BatteryWarning size={16} className="shrink-0 mt-0.5" />
              <p>Critical: Your agency is dangerously close to its computational limit. Artificial Intelligence engines will be forcibly suspended if this meter crosses 100%. Contact Support to increase limits.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
