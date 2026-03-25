'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

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

interface Agency {
  id: string
  name: string
  slug: string
}

const PAGE_SIZE = 50

const ENTITY_TYPES = ['', 'agency', 'student', 'staff', 'application', 'scheduler']

function getActionBadge(action: string) {
  if (action.includes('creat')) return 'bg-emerald-50 text-emerald-700'
  if (action.includes('delet')) return 'bg-red-50 text-red-700'
  if (action.includes('revert')) return 'bg-purple-50 text-purple-700'
  if (action.includes('approv') || action.includes('billing')) return 'bg-blue-50 text-blue-700'
  if (action.includes('suspend') || action.includes('block')) return 'bg-orange-50 text-orange-700'
  return 'bg-gray-100 text-gray-600'
}

export default function GlobalAuditMatrix() {
  const searchParams = useSearchParams()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [agencies, setAgencies] = useState<Agency[]>([])

  // Filters
  const [agencyId, setAgencyId] = useState(searchParams.get('agency_id') || '')
  const [entityType, setEntityType] = useState('')
  const [actionSearch, setActionSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [offset, setOffset] = useState(0)

  // Load agencies for filter dropdown
  useEffect(() => {
    apiFetch<{ agencies: Agency[] }>('/api/super-admin/agencies')
      .then((d) => setAgencies(d.agencies || []))
      .catch(console.error)
  }, [])

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (agencyId) params.set('agency_id', agencyId)
      if (entityType) params.set('entity_type', entityType)
      if (actionSearch) params.set('action_like', actionSearch)
      if (fromDate) params.set('from_date', fromDate)
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(offset))

      const data = await apiFetch<{ logs: AuditLog[]; total: number }>(`/api/super-admin/audit?${params}`)
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [agencyId, entityType, actionSearch, fromDate, offset])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  // Reset offset when filters change
  function applyFilter(fn: () => void) {
    fn()
    setOffset(0)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-semibold text-gray-900">Audit Matrix</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          Immutable ledger of every row modified across all tenants.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Agency filter */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Agency</label>
            <select
              value={agencyId}
              onChange={(e) => applyFilter(() => setAgencyId(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#031635]/20 focus:border-[#031635] transition"
            >
              <option value="">All agencies</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Entity type filter */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Entity Type</label>
            <select
              value={entityType}
              onChange={(e) => applyFilter(() => setEntityType(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#031635]/20 focus:border-[#031635] transition"
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>{t || 'All types'}</option>
              ))}
            </select>
          </div>

          {/* Action search */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Action</label>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. billing_approve"
                value={actionSearch}
                onChange={(e) => applyFilter(() => setActionSearch(e.target.value))}
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#031635]/20 focus:border-[#031635] transition"
              />
            </div>
          </div>

          {/* Date from */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => applyFilter(() => setFromDate(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#031635]/20 focus:border-[#031635] transition"
            />
          </div>
        </div>

        {/* Active filters summary + clear */}
        {(agencyId || entityType || actionSearch || fromDate) && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <p className="text-[11px] text-gray-400">
              Showing filtered results — {total} entries
            </p>
            <button
              onClick={() => {
                setAgencyId('')
                setEntityType('')
                setActionSearch('')
                setFromDate('')
                setOffset(0)
              }}
              className="text-[11px] text-gray-500 hover:text-gray-800 underline underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 whitespace-nowrap">Timestamp</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Action</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Entity</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 w-[300px]">State Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-5 py-3">
                      <div className="h-5 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-gray-400 text-[13px] italic">
                    No audit entries found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Timestamp */}
                      <td className="px-5 py-3 text-[11px] text-gray-400 font-mono whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-[160px]">
                          usr:{log.user_id?.slice(0, 8)}…
                        </div>
                      </td>

                      {/* Entity */}
                      <td className="px-5 py-3">
                        <div className="text-[13px] font-medium text-gray-700">{log.entity_type || '—'}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{log.entity_id?.slice(0, 10)}…</div>
                      </td>

                      {/* State delta */}
                      <td className="px-5 py-3 max-w-[300px]">
                        {log.old_value && (
                          <div className="text-[10px] text-red-600 bg-red-50 border border-red-100 rounded px-1.5 py-1 mb-1 font-mono truncate">
                            − {JSON.stringify(log.old_value)}
                          </div>
                        )}
                        {log.new_value && (
                          <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-1 font-mono truncate">
                            + {JSON.stringify(log.new_value)}
                          </div>
                        )}
                        {!log.old_value && !log.new_value && (
                          <span className="text-[11px] text-gray-300 italic">no delta</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-[12px] text-gray-400">
              Page {currentPage} of {totalPages} · {total} total entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={offset === 0 || loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <button
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={offset + PAGE_SIZE >= total || loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
