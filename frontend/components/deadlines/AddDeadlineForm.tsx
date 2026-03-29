'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Lightbulb } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

const DEADLINE_TYPES = [
  { value: 'application',   label: 'Application' },
  { value: 'financial_aid', label: 'Financial Aid' },
  { value: 'scholarship',   label: 'Scholarship' },
  { value: 'test',          label: 'Test Registration' },
  { value: 'document',      label: 'Document' },
  { value: 'interview',     label: 'Interview' },
  { value: 'decision',      label: 'Decision' },
  { value: 'custom',        label: 'Custom' },
]

interface DateSuggestion {
  label: string
  date: string
  note?: string
}

/**
 * Deadline Intelligence — generates smart date suggestions based on the
 * deadline type.  All logic is client-side (no extra API call needed).
 */
function getSmartSuggestions(type: string, today: Date): DateSuggestion[] {
  const year = today.getFullYear()
  const month = today.getMonth() // 0-indexed
  // Helper: return ISO date string for a given year/month(0-idx)/day
  const iso = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  // Helper: only include dates that are >= today
  const future = (date: string) => date >= today.toISOString().slice(0, 10)

  switch (type) {
    case 'application': {
      const candidates: DateSuggestion[] = [
        { label: 'Early Decision I',  date: iso(year, 10, 1),  note: 'Nov 1' },
        { label: 'Early Decision II', date: iso(year, 10, 15), note: 'Nov 15' },
        { label: 'Early Action',      date: iso(year, 10, 1),  note: 'Nov 1' },
        { label: 'Regular Decision',  date: iso(year, 0, 1),   note: 'Jan 1' },
        { label: 'Regular Decision',  date: iso(year + 1, 0, 1), note: 'Jan 1 (next year)' },
        { label: 'Rolling Admission', date: iso(year, 1, 1),   note: 'Feb 1' },
      ]
      return candidates.filter((c) => future(c.date))
    }
    case 'financial_aid': {
      return [
        { label: 'FAFSA Priority',   date: iso(year + 1, 2, 1),  note: 'Mar 1' },
        { label: 'CSS Profile',      date: iso(year, 10, 15), note: 'Nov 15' },
        { label: 'State Aid',        date: iso(year, 2, 1),   note: 'Mar 1' },
        { label: 'Institutional',    date: iso(year + 1, 1, 1),  note: 'Feb 1' },
      ].filter((c) => future(c.date))
    }
    case 'scholarship': {
      return [
        { label: 'Merit Scholarship', date: iso(year, 11, 1),  note: 'Dec 1' },
        { label: 'Need-Based',        date: iso(year + 1, 1, 15), note: 'Feb 15' },
        { label: 'External Award',    date: iso(year + 1, 2, 15), note: 'Mar 15' },
      ].filter((c) => future(c.date))
    }
    case 'test': {
      // SAT/ACT are typically offered Aug, Oct, Nov, Dec, Mar, May
      const testMonths = [7, 9, 10, 11, 2, 4] // 0-indexed
      return testMonths
        .map((m) => {
          const y = m < month ? year + 1 : year
          // Approximate 3rd Saturday of that month
          const d = new Date(y, m, 1)
          const dayOfWeek = d.getDay()
          const firstSat = dayOfWeek === 6 ? 1 : 7 - dayOfWeek + 1
          const thirdSat = firstSat + 14
          const dateStr = iso(y, m, thirdSat)
          const monthName = d.toLocaleString('en-US', { month: 'short' })
          return { label: `SAT / ACT — ${monthName} ${y}`, date: dateStr }
        })
        .filter((c) => future(c.date))
        .slice(0, 4)
    }
    case 'document': {
      return [
        { label: '2 weeks before app deadline', date: offsetDays(today, 14) },
        { label: '1 month before app deadline', date: offsetDays(today, 30) },
        { label: '6 weeks before app deadline', date: offsetDays(today, 42) },
      ]
    }
    case 'interview': {
      return [
        { label: 'Next week',    date: offsetDays(today, 7) },
        { label: 'In 2 weeks',   date: offsetDays(today, 14) },
        { label: 'In 3 weeks',   date: offsetDays(today, 21) },
      ]
    }
    case 'decision': {
      return [
        { label: 'Early Decision',  date: iso(year, 11, 15), note: 'Dec 15' },
        { label: 'Early Action',    date: iso(year + 1, 0, 15), note: 'Jan 15' },
        { label: 'Regular',         date: iso(year + 1, 3, 1),  note: 'Apr 1' },
        { label: 'Commitment Day',  date: iso(year + 1, 4, 1),  note: 'May 1' },
      ].filter((c) => future(c.date))
    }
    default:
      return []
  }
}

function offsetDays(base: Date, days: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatSuggestionDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface AddDeadlineFormProps {
  studentId: string
}

export default function AddDeadlineForm({ studentId }: AddDeadlineFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<DateSuggestion[]>([])

  const [form, setForm] = useState({
    title: '',
    type: 'application',
    due_date: '',
  })

  // Regenerate suggestions whenever the deadline type changes
  useEffect(() => {
    const s = getSmartSuggestions(form.type, new Date())
    setSuggestions(s)
  }, [form.type])

  function reset() {
    setForm({ title: '', type: 'application', due_date: '' })
    setError(null)
  }

  function applySuggestion(suggestion: DateSuggestion) {
    setForm((prev) => ({
      ...prev,
      due_date: suggestion.date,
      // Auto-fill title if it's still empty
      title: prev.title || suggestion.label,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.due_date) {
      setError('Title and due date are required')
      return
    }
    setLoading(true)
    setError(null)

    try {
      await apiFetch('/api/deadlines', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          title: form.title.trim(),
          type: form.type,
          due_date: form.due_date,
        }),
      })
      setOpen(false)
      reset()
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add deadline')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-9 px-4 rounded-[6px] text-[13px] font-medium text-white flex items-center gap-2 transition hover:opacity-90"
        style={{ backgroundColor: '#1D9E75' }}
      >
        <Plus size={14} />
        Add Deadline
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div
            className="bg-white rounded-[12px] w-full max-w-md p-6"
            style={{ border: '0.5px solid #e5e7eb' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-semibold text-gray-900">Add Deadline</h2>
              <button
                onClick={() => { setOpen(false); reset() }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75] bg-white"
                  style={{ border: '0.5px solid #d1d5db' }}
                >
                  {DEADLINE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* ── Smart date suggestions (Deadline Intelligence) ── */}
              {suggestions.length > 0 && (
                <div className="rounded-[8px] p-3" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Lightbulb size={12} className="text-emerald-600" />
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                      Smart Suggestions
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applySuggestion(s)}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-all hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: form.due_date === s.date ? '#1D9E75' : '#fff',
                          color: form.due_date === s.date ? '#fff' : '#065F46',
                          border: `1px solid ${form.due_date === s.date ? '#1D9E75' : '#6EE7B7'}`,
                        }}
                        title={s.note}
                      >
                        {s.label}
                        <span className="ml-1 opacity-60">· {formatSuggestionDate(s.date)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Common App submission"
                  className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                  style={{ border: '0.5px solid #d1d5db' }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">
                  Due Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                  style={{ border: '0.5px solid #d1d5db' }}
                />
              </div>

              {error && <p className="text-[12px] text-[#A32D2D]">{error}</p>}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setOpen(false); reset() }}
                  className="h-9 px-4 rounded-[6px] text-[13px] text-gray-500 hover:bg-gray-50 transition"
                  style={{ border: '0.5px solid #e5e7eb' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-9 px-4 rounded-[6px] text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#1D9E75' }}
                >
                  {loading ? 'Adding…' : 'Add Deadline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
