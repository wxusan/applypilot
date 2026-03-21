'use client'

import { useState, useTransition } from 'react'
import { apiFetch } from '@/lib/api'

const SECTIONS = [
  { key: 'personal_info',   label: 'Personal Info' },
  { key: 'family',          label: 'Family' },
  { key: 'education',       label: 'Education' },
  { key: 'test_scores',     label: 'Test Scores' },
  { key: 'activities',      label: 'Activities' },
  { key: 'writing',         label: 'Writing' },
  { key: 'additional_info', label: 'Additional Info' },
  { key: 'school_report',   label: 'School Report' },
  { key: 'recommendations', label: 'Recommendations' },
  { key: 'payment',         label: 'Payment' },
]

type SectionStatus = 'not_started' | 'in_progress' | 'completed'

const STATUS_CYCLE: SectionStatus[] = ['not_started', 'in_progress', 'completed']

const SECTION_STYLES: Record<SectionStatus, { bg: string; color: string; ring: string }> = {
  completed:   { bg: '#EAF3DE', color: '#3B6D11', ring: '#3B6D11' },
  in_progress: { bg: '#E6F1FB', color: '#185FA5', ring: '#185FA5' },
  not_started: { bg: '#F3F4F6', color: '#9CA3AF', ring: '#E5E7EB' },
}

interface Props {
  applicationId: string
  initialStatus: Record<string, string>
  disabled?: boolean
}

export default function CommonAppSectionTracker({
  applicationId,
  initialStatus,
  disabled = false,
}: Props) {
  const [sectionStatus, setSectionStatus] = useState<Record<string, SectionStatus>>(
    () => {
      const s: Record<string, SectionStatus> = {}
      for (const sec of SECTIONS) {
        const v = initialStatus[sec.key] as SectionStatus
        s[sec.key] = STATUS_CYCLE.includes(v) ? v : 'not_started'
      }
      return s
    }
  )
  const [pending, startTransition] = useTransition()
  const [updatingKey, setUpdatingKey] = useState<string | null>(null)

  const completedCount = Object.values(sectionStatus).filter((v) => v === 'completed').length
  const progressPct = Math.round((completedCount / SECTIONS.length) * 100)

  async function handleClick(sectionKey: string) {
    if (disabled || updatingKey) return

    const current = sectionStatus[sectionKey]
    const nextIdx = (STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length
    const next = STATUS_CYCLE[nextIdx]

    // Optimistic update
    setSectionStatus((prev) => ({ ...prev, [sectionKey]: next }))
    setUpdatingKey(sectionKey)

    try {
      await apiFetch(`/api/applications/${applicationId}/sections`, {
        method: 'PATCH',
        body: JSON.stringify({ section: sectionKey, status: next }),
      })
    } catch {
      // Rollback on error
      setSectionStatus((prev) => ({ ...prev, [sectionKey]: current }))
    } finally {
      setUpdatingKey(null)
    }
  }

  return (
    <div>
      {/* Progress bar + label */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[12px] font-medium text-gray-500 uppercase tracking-[0.5px]">
          Common App Progress
        </p>
        <p className="text-[12px] font-mono text-gray-500">
          {completedCount} / {SECTIONS.length} — {progressPct}%
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full mb-3" style={{ backgroundColor: '#E5E7EB' }}>
        <div
          className="h-1 rounded-full transition-all duration-300"
          style={{
            width: `${progressPct}%`,
            backgroundColor: progressPct === 100 ? '#3B6D11' : '#1D9E75',
          }}
        />
      </div>

      {/* Section grid — click to cycle status */}
      <div className="grid grid-cols-5 gap-1.5">
        {SECTIONS.map((sec) => {
          const status = sectionStatus[sec.key]
          const style = SECTION_STYLES[status]
          const isUpdating = updatingKey === sec.key

          return (
            <button
              key={sec.key}
              onClick={() => handleClick(sec.key)}
              disabled={disabled || !!updatingKey}
              title={`${sec.label}: ${status.replace('_', ' ')} — click to advance`}
              className={`
                rounded-[4px] px-2 py-1.5 text-[11px] font-medium text-center
                transition-all duration-150 select-none
                ${!disabled && !updatingKey ? 'cursor-pointer hover:opacity-80 active:scale-95' : 'cursor-default'}
                ${isUpdating ? 'opacity-50' : ''}
              `}
              style={{
                backgroundColor: style.bg,
                color: style.color,
                outline: 'none',
              }}
            >
              {sec.label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mt-2.5">
        {([
          ['not_started', 'Not started'],
          ['in_progress', 'In progress'],
          ['completed', 'Complete'],
        ] as [SectionStatus, string][]).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-[2px] shrink-0"
              style={{ backgroundColor: SECTION_STYLES[status].bg, outline: `1px solid ${SECTION_STYLES[status].ring}` }}
            />
            <span className="text-[10px] text-gray-400">{label}</span>
          </div>
        ))}
        <span className="text-[10px] text-gray-300 ml-auto">click section to advance</span>
      </div>
    </div>
  )
}
