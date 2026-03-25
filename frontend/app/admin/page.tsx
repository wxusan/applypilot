'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Building2, Users, Activity } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AdminStats {
  total_agencies: number
  total_students: number
  total_ai_jobs: number
}

interface ChartDay {
  name: string
  date: string
  tokens: number
  cost: number
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [chart, setChart] = useState<ChartDay[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingChart, setLoadingChart] = useState(true)

  useEffect(() => {
    apiFetch<AdminStats>('/api/super-admin/stats')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoadingStats(false))

    apiFetch<{ chart: ChartDay[] }>('/api/super-admin/stats/token-chart')
      .then((d) => setChart(d.chart))
      .catch(console.error)
      .finally(() => setLoadingChart(false))
  }, [])

  const totalTokensThisWeek = chart.reduce((s, d) => s + d.tokens, 0)
  const totalCostThisWeek = chart.reduce((s, d) => s + d.cost, 0)
  const hasData = chart.some((d) => d.tokens > 0)

  if (loadingStats) {
    return <div className="text-[13px] text-gray-400 font-mono animate-pulse">Loading stats...</div>
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-full space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold text-gray-900">Network Overview</h1>
        <p className="text-[13px] text-gray-500 mt-1">Live platform metrics across all tenants.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Active Agencies" value={stats?.total_agencies ?? 0} icon={Building2} color="text-blue-600" bg="bg-blue-50" />
        <MetricCard title="Total Students" value={stats?.total_students ?? 0} icon={Users} color="text-purple-600" bg="bg-purple-50" />
        <MetricCard title="AI Jobs Run" value={stats?.total_ai_jobs ?? 0} icon={Activity} color="text-[#1D9E75]" bg="bg-[#E1F5EE]" />
      </div>

      {/* Token burn chart */}
      <div className="flex-1 bg-white rounded-[10px] p-6 border border-gray-200 shadow-sm flex flex-col min-h-[300px]">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-medium text-gray-800">AI Token Burn — Last 7 Days</h2>
            {!loadingChart && (
              <p className="text-[12px] text-gray-400 mt-0.5">
                {hasData
                  ? `${totalTokensThisWeek.toLocaleString()} tokens · $${totalCostThisWeek.toFixed(4)} total cost`
                  : 'No AI activity recorded this week'}
              </p>
            )}
          </div>
          <div className="text-[11px] font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">All Agencies</div>
        </div>

        {loadingChart ? (
          <div className="flex-1 flex items-center justify-center text-gray-300 text-[13px]">Loading chart...</div>
        ) : !hasData ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <Activity size={32} className="mb-3 opacity-40" />
            <p className="text-[13px]">No AI token usage in the last 7 days.</p>
            <p className="text-[11px] mt-1">Token burn will appear here once agents run.</p>
          </div>
        ) : (
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} dx={-10} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => {
                    const n = typeof value === 'number' ? value : 0
                    return name === 'tokens'
                      ? [`${n.toLocaleString()} tokens`, 'Tokens']
                      : [`$${n.toFixed(4)}`, 'Cost']
                  }}
                />
                <Area type="monotone" dataKey="tokens" stroke="#1D9E75" strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" activeDot={{ r: 4, strokeWidth: 0, fill: '#1D9E75' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white rounded-[10px] p-6 border border-gray-200 flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-widest">{title}</p>
        <div className={`w-8 h-8 rounded-[6px] ${bg} flex items-center justify-center`}>
          <Icon className={color} size={16} />
        </div>
      </div>
      <p className="text-[32px] font-semibold text-gray-900 leading-none">{value}</p>
    </div>
  )
}
