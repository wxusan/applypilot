'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowUp, ArrowDown } from 'lucide-react'

const DEADLINE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'application', label: 'Application' },
  { value: 'financial_aid', label: 'Financial Aid' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'test', label: 'Test' },
  { value: 'document', label: 'Document' },
  { value: 'interview', label: 'Interview' },
  { value: 'decision', label: 'Decision' },
  { value: 'custom', label: 'Custom' },
]

interface Props {
  sortDir: string
  filterType: string
}

export default function DeadlineFilters({ sortDir, filterType }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString())
    if (value) p.set(key, value)
    else p.delete(key)
    router.push(`?${p.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => update('sort', sortDir === 'asc' ? 'desc' : 'asc')}
        className="h-7 px-3 flex items-center gap-1.5 rounded-[6px] text-[12px] text-gray-600 bg-white transition hover:bg-gray-50"
        style={{ border: '0.5px solid #e5e7eb' }}
        title={sortDir === 'asc' ? 'Sort: earliest first' : 'Sort: latest first'}
      >
        Due date
        {sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      </button>

      <select
        value={filterType}
        onChange={(e) => update('type', e.target.value)}
        className="h-7 pl-2 pr-6 rounded-[6px] text-[12px] text-gray-600 bg-white focus:outline-none appearance-none"
        style={{ border: '0.5px solid #e5e7eb' }}
      >
        {DEADLINE_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  )
}
