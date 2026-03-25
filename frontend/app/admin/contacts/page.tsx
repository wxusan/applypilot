'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Phone, Mail, User, RefreshCw } from 'lucide-react'

interface Contact {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  source: string
  role: string | null
  note: string | null
  agency_id: string | null
  created_at: string
}

const SOURCE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  waitlist:        { label: 'Waitlist',        color: '#7C3AED', bg: '#F5F3FF' },
  access_request:  { label: 'Access Request',  color: '#B45309', bg: '#FFFBEB' },
  student:         { label: 'Student',          color: '#0369A1', bg: '#EFF6FF' },
  staff_invite:    { label: 'Staff Invite',     color: '#166534', bg: '#F0FDF4' },
  agency_created:  { label: 'Agency Owner',     color: '#be123c', bg: '#FFF1F2' },
}

const SOURCES = ['', 'waitlist', 'access_request', 'student', 'staff_invite', 'agency_created']

function SourceBadge({ source }: { source: string }) {
  const s = SOURCE_LABELS[source] ?? { label: source, color: '#374151', bg: '#F3F4F6' }
  return (
    <span
      className="inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {s.label}
    </span>
  )
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('')
  const [offset, setOffset] = useState(0)
  const LIMIT = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (source) params.set('source', source)
      params.set('limit', String(LIMIT))
      params.set('offset', String(offset))
      const res = await fetch(`/api/contacts?${params.toString()}`)
      const data = await res.json()
      setContacts(data.contacts || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, source, offset])

  useEffect(() => {
    setOffset(0)
  }, [search, source])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-gray-900">People Database</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Everyone who has ever filled a form on ApplyPilot — {total.toLocaleString()} total.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors border border-gray-200"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#031635]/20 w-56 transition"
          />
        </div>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#031635]/20 bg-white text-gray-700 transition"
        >
          <option value="">All sources</option>
          {SOURCES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{SOURCE_LABELS[s]?.label ?? s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-gray-50 text-[11px] font-medium text-gray-500 uppercase tracking-widest border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Person</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3 text-right">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/70">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400 text-[13px]">
                  Loading…
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400 text-[13px]">
                  {search || source ? 'No contacts match your filters.' : 'No contacts yet. They will appear here as forms are filled.'}
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                  {/* Person */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <User size={13} className="text-gray-400" />
                      </div>
                      <span className="font-medium text-gray-900 truncate max-w-[160px]">
                        {c.name || <span className="text-gray-400 italic">Unknown</span>}
                      </span>
                    </div>
                  </td>
                  {/* Contact */}
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Phone size={11} className="text-gray-400 shrink-0" />
                          <span className="font-mono text-[12px]">{c.phone}</span>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Mail size={11} className="text-gray-400 shrink-0" />
                          <span className="text-[12px] truncate max-w-[180px]">{c.email}</span>
                        </div>
                      )}
                      {!c.phone && !c.email && (
                        <span className="text-gray-300 text-[11px]">—</span>
                      )}
                    </div>
                  </td>
                  {/* Source */}
                  <td className="px-4 py-3">
                    <SourceBadge source={c.source} />
                  </td>
                  {/* Note */}
                  <td className="px-4 py-3 max-w-[220px]">
                    {c.note ? (
                      <span className="text-gray-500 text-[12px] truncate block" title={c.note}>
                        {c.note}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-[11px]">—</span>
                    )}
                  </td>
                  {/* When */}
                  <td className="px-4 py-3 text-right text-gray-400 text-[12px] whitespace-nowrap">
                    {timeAgo(c.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-500">
            <span>
              Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total.toLocaleString()}
            </span>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Prev
              </button>
              <button
                disabled={offset + LIMIT >= total}
                onClick={() => setOffset(offset + LIMIT)}
                className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
