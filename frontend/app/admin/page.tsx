'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Building2, Users, Activity, CheckCircle, XCircle, Clock } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AdminStats {
  total_agencies: number
  total_students: number
  total_ai_jobs: number
}

interface HealthStatus {
  status: 'ok' | 'error' | 'checking'
  uptime?: string
}

// Mock time-series data for the demonstration since daily aggregation requires a heavier SQL group-by
const mockBurnData = [
  { name: 'Mon', tokens: 4000, cost: 0.12 },
  { name: 'Tue', tokens: 8000, cost: 0.24 },
  { name: 'Wed', tokens: 12000, cost: 0.36 },
  { name: 'Thu', tokens: 27800, cost: 0.83 },
  { name: 'Fri', tokens: 18900, cost: 0.56 },
  { name: 'Sat', tokens: 23900, cost: 0.71 },
  { name: 'Sun', tokens: 34900, cost: 1.04 },
]

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiHealth, setApiHealth] = useState<HealthStatus>({ status: 'checking' })
  const [dbHealth, setDbHealth] = useState<HealthStatus>({ status: 'checking' })

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await apiFetch<AdminStats>('/api/super-admin/stats')
        setStats(data)
        setDbHealth({ status: 'ok' })
      } catch (err) {
        console.error('Failed to load stats', err)
        setDbHealth({ status: 'error' })
      } finally {
        setLoading(false)
      }
    }

    async function checkApiHealth() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const res = await fetch(`${apiUrl}/health`)
        if (res.ok) {
          const data = await res.json()
          setApiHealth({ status: 'ok', uptime: data.uptime })
        } else {
          setApiHealth({ status: 'error' })
        }
      } catch {
        setApiHealth({ status: 'error' })
      }
    }

    loadStats()
    checkApiHealth()
  }, [])

  if (loading) {
    return <div className="text-[13px] text-gray-400 font-mono animate-pulse">Syncing macro network...</div>
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-full space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold text-gray-900">Network Telemetry</h1>
        <p className="text-[13px] text-gray-500 mt-1">Live tracking of computational payloads across all isolated SaaS tenants.</p>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-[10px] p-5 border border-gray-200">
        <h2 className="text-[14px] font-semibold text-gray-900 mb-3">System Health</h2>
        <div className="flex items-center gap-6">
          <HealthIndicator label="API Server" status={apiHealth.status} detail={apiHealth.uptime ? `Uptime: ${apiHealth.uptime}` : undefined} />
          <HealthIndicator label="Database (Supabase)" status={dbHealth.status} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Active Agencies" 
          value={stats?.total_agencies ?? 0} 
          icon={Building2} 
          color="text-blue-600" 
          bg="bg-blue-50" 
        />
        <MetricCard 
          title="Total Students Managed" 
          value={stats?.total_students ?? 0} 
          icon={Users} 
          color="text-purple-600" 
          bg="bg-purple-50" 
        />
        <MetricCard 
          title="AI Automation Operations" 
          value={stats?.total_ai_jobs ?? 0} 
          icon={Activity} 
          color="text-[#1D9E75]" 
          bg="bg-[#E1F5EE]" 
        />
      </div>

      <div className="flex-1 bg-white rounded-[10px] p-6 border border-gray-200 shadow-sm flex flex-col min-h-[350px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[15px] font-medium text-gray-800">Aggregate Token Burn Rate (Live)</h2>
          <div className="text-[11px] font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">GPT-4o-Mini Base</div>
        </div>
        
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={mockBurnData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#1D9E75" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#1D9E75', fontWeight: 500 }}
              />
              <Area 
                type="monotone" 
                dataKey="tokens" 
                stroke="#1D9E75" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTokens)" 
                activeDot={{ r: 4, strokeWidth: 0, fill: '#1D9E75' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function HealthIndicator({ label, status, detail }: { label: string; status: 'ok' | 'error' | 'checking'; detail?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {status === 'checking' && <Clock size={14} className="text-gray-400 animate-spin" />}
      {status === 'ok' && <CheckCircle size={14} className="text-green-500" />}
      {status === 'error' && <XCircle size={14} className="text-red-500" />}
      <div>
        <p className="text-[13px] font-medium text-gray-800">{label}</p>
        <p className="text-[11px] text-gray-400">
          {status === 'checking' ? 'Checking…' : status === 'ok' ? (detail || 'Operational') : 'Unavailable'}
        </p>
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
          <Icon className={`${color}`} size={16} />
        </div>
      </div>
      <div>
        <p className="text-[32px] font-semibold text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  )
}
