'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

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

function getActionBadgeClass(action: string) {
  if (action.includes('created')) return 'bg-emerald-50 text-emerald-700'
  if (action.includes('deleted')) return 'bg-red-50 text-red-700'
  if (action.includes('reverted')) return 'bg-purple-50 text-purple-700'
  return 'bg-blue-50 text-blue-700'
}

export default function GlobalAuditMatrix() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [reverting, setReverting] = useState<string | null>(null)
  const [search, setSearch] = useState('')

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
    if (!confirm('WARNING: Are you sure you want to completely inverse this action? This edits the database directly.')) return
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

  const filtered = logs.filter(
    (l) =>
      !search ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_id?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-2">
          Platform Audit Log
        </h1>
        <p className="text-on-surface-variant font-body text-lg">
          An immutable ledger of every row modified across all tenants.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm">
        {/* Search */}
        <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low/50 flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            placeholder="Search action or UUID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm text-on-surface w-full font-mono placeholder:text-on-surface-variant/50 placeholder:font-sans"
          />
          <span className="text-xs text-on-surface-variant">{filtered.length} entries</span>
        </div>

        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low/80 sticky top-0 z-10 border-b border-outline-variant/10">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Action Trace</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Entity Target</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-1/3">State Deltas</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-2xl">autorenew</span>
                    <p className="text-sm mt-2">Syncing ledger...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant italic">
                    No events captured.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const isRevertable = !!log.old_value && !!log.entity_id && !!log.entity_type
                  return (
                    <tr key={log.id} className="hover:bg-surface-container-low/30 transition-colors font-mono">
                      <td className="px-6 py-4 text-on-surface-variant text-xs whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded font-sans font-bold text-[10px] mb-1 uppercase ${getActionBadgeClass(log.action)}`}>
                          {log.action}
                        </span>
                        <div className="text-[10px] text-on-surface-variant/60 truncate w-[160px]">
                          usr: {log.user_id?.split('-')[0]}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-on-surface font-sans font-medium text-sm">{log.entity_type}</div>
                        <div className="text-[10px] text-on-surface-variant/60">{log.entity_id?.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        {log.old_value && (
                          <div className="text-error bg-error-container/30 p-1.5 rounded mb-1 text-[10px] truncate w-[280px]">
                            - {JSON.stringify(log.old_value)}
                          </div>
                        )}
                        {log.new_value && (
                          <div className="text-emerald-700 bg-emerald-50/80 p-1.5 rounded text-[10px] truncate w-[280px]">
                            + {JSON.stringify(log.new_value)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          disabled={!isRevertable || reverting === log.id}
                          onClick={() => handleRevert(log.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-medium transition-all ${
                            isRevertable
                              ? 'bg-surface-container-lowest border border-outline-variant/30 text-on-surface hover:text-error hover:border-error/30'
                              : 'bg-surface-container text-on-surface-variant/30 cursor-not-allowed'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">undo</span>
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
