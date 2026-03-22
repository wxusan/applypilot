'use client'

import { useRef } from 'react'

interface SeasonFilterProps {
  seasons: string[]
  currentSeason?: string
  q?: string
  status?: string
}

export default function SeasonFilter({ seasons, currentSeason, q, status }: SeasonFilterProps) {
  const formRef = useRef<HTMLFormElement>(null)

  if (seasons.length === 0) return null

  return (
    <form ref={formRef} method="GET" className="relative">
      {q && <input type="hidden" name="q" value={q} />}
      {status && <input type="hidden" name="status" value={status} />}
      <select
        name="season"
        defaultValue={currentSeason ?? ''}
        onChange={() => formRef.current?.submit()}
        className="h-8 pl-2.5 pr-7 text-[12px] rounded-[6px] bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand appearance-none cursor-pointer"
        style={{ border: '0.5px solid #d1d5db' }}
      >
        <option value="">All seasons</option>
        {seasons.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {/* Chevron icon */}
      <svg
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
        width="10" height="10" viewBox="0 0 16 16" fill="none"
      >
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </form>
  )
}
