'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Undo2, Search } from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string
  old_value: any
  new_value: any
  created_at: string
  agency_id: string
  user_id: string
}

export default function GlobalAuditMatrix() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [reverting, setReverting] = useState<string | null>(null)

  async function loadLogs() {
    try {
      const data = await apiFetch<{ logs: AuditLog[] }>('/api/super-admin/audit')
      setLogs(data.logs || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const handleRevert = async (logId: string) => {
    if (!confirm('WARNING: Are you sure you want to completely inverse this action? This edits the database directly.')) return;
    
    setReverting(logId)
    try {
      await apiFetch(`/api/super-admin/audit/${logId}/revert`, { method: 'POST' })
      alert('Action successfully rolled back!')
      loadLogs()
    } catch (err: any) {
      alert(err.message || 'Cannot mathematically revert this action.')
    } finally {
      setReverting(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-gray-900">God-Mode Audit Matrix</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          An immutable ledger of every row modified across all tenants.
        </p>
      </div>

      <div className="bg-white rounded-[10px] border border-gray-200 flex flex-col flex-1 overflow-hidden shadow-sm">
        <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
          <Search size={16} className="text-gray-400 ml-2" />
          <input 
            type="text" 
            placeholder="Search action or UUID..."
            className="bg-transparent border-none focus:outline-none text-[13px] text-gray-700 w-full font-mono placeholder:text-gray-400 placeholder:font-sans"
          />
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-white text-[10px] font-medium text-gray-400 uppercase tracking-widest sticky top-0 border-b border-gray-200 shadow-sm z-10">
              <tr>
                <th className="px-4 py-3 border-r border-gray-100">Timestamp</th>
                <th className="px-4 py-3 border-r border-gray-100">Action Trace</th>
                <th className="px-4 py-3 border-r border-gray-100">Entity Target</th>
                <th className="px-4 py-3 border-r border-gray-100 w-1/3">State Deltas (JSON)</th>
                <th className="px-4 py-3 text-center">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Syncing ledger...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No events captured.</td></tr>
              ) : (
                logs.map((log) => {
                  const isRevertable = !!log.old_value && !!log.entity_id && !!log.entity_type
                  
                  return (
                    <tr key={log.id} className="hover:bg-[#FDFDFD] transition-colors font-mono">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap border-r border-gray-100">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100">
                        <span className={`inline-flex px-2 py-0.5 rounded font-bold text-[10px] mb-1 ${
                          log.action.includes('created') ? 'bg-green-50 text-green-700' :
                          log.action.includes('deleted') ? 'bg-red-50 text-red-700' :
                          log.action.includes('reverted') ? 'bg-purple-50 text-purple-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {log.action}
                        </span>
                        <div className="text-[10px] text-gray-400 truncate w-[160px]">
                          usr: {log.user_id?.split('-')[0]}...
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100">
                        <div className="text-gray-800 font-medium">{log.entity_type}</div>
                        <div className="text-[10px] text-gray-400">{log.entity_id}</div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100">
                        {log.old_value && (
                          <div className="text-red-400 bg-red-50/50 p-1.5 rounded mb-1 truncate w-[280px]">
                            - {JSON.stringify(log.old_value)}
                          </div>
                        )}
                        {log.new_value && (
                          <div className="text-green-500 bg-green-50/50 p-1.5 rounded truncate w-[280px]">
                            + {JSON.stringify(log.new_value)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          disabled={!isRevertable || reverting === log.id}
                          onClick={() => handleRevert(log.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] font-sans text-[11px] font-medium transition-all ${
                            isRevertable 
                              ? 'bg-white border border-gray-300 text-gray-700 hover:text-red-600 hover:border-red-300 shadow-sm'
                              : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          <Undo2 size={12} />
                          {reverting === log.id ? 'Reverting...' : 'Revert'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
