'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Building2, Users, Activity } from 'lucide-react'

interface AdminStats {
  total_agencies: number
  total_students: number
  total_ai_jobs: number
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await apiFetch<{ total_agencies: number; total_students: number; total_ai_jobs: number }>('/api/super-admin/stats')
        setStats(data)
      } catch (err) {
        console.error('Failed to load stats', err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return <div className="text-[13px] text-gray-500">Loading master metrics...</div>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-[20px] font-semibold text-gray-900 mb-6">Global Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          color="text-green-600" 
          bg="bg-green-50" 
        />
      </div>

      <div className="bg-white rounded-[10px] p-6 border border-gray-200">
        <h2 className="text-[15px] font-medium text-gray-800 mb-4">Platform Health / Burn Rate</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-[6px] border border-dashed border-gray-200">
          <p className="text-[13px] text-gray-400">Token usage visualization module (Phase 3)</p>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white rounded-[10px] p-5 border border-gray-200 flex items-center shadow-sm">
      <div className={`w-12 h-12 rounded-[8px] ${bg} flex items-center justify-center mr-4`}>
        <Icon className={`${color}`} size={24} />
      </div>
      <div>
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-[28px] font-semibold text-gray-900 leading-none mt-1">{value}</p>
      </div>
    </div>
  )
}
