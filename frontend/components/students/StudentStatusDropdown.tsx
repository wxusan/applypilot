'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { getStatusStyle } from '@/lib/utils'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = [
  'intake', 'forms', 'writing', 'review',
  'submitted', 'accepted', 'rejected', 'archived',
] as const

interface StudentStatusDropdownProps {
  studentId: string
  currentStatus: string
}

export default function StudentStatusDropdown({ studentId, currentStatus }: StudentStatusDropdownProps) {
  const [status, setStatus] = useState(currentStatus)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { success: toastSuccess, error: toastError } = useToast()
  const router = useRouter()

  const style = getStatusStyle(status)

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = async (newStatus: string) => {
    if (newStatus === status || saving) return
    setOpen(false)
    setSaving(true)
    const prev = status
    setStatus(newStatus) // optimistic
    try {
      await apiFetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      const newStyle = getStatusStyle(newStatus)
      toastSuccess(`Status updated to ${newStyle.label}`)
      router.refresh()
    } catch {
      setStatus(prev) // revert
      toastError('Failed to update status. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition-opacity disabled:opacity-60"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        <span className="capitalize">{style.label}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 bg-white rounded-[8px] py-1 min-w-[130px]"
          style={{ border: '0.5px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          {STATUS_OPTIONS.map((s) => {
            const st = getStatusStyle(s)
            return (
              <button
                key={s}
                onClick={() => handleSelect(s)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-50 transition-colors"
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: st.color }}
                />
                <span
                  className="text-[12px] font-medium capitalize"
                  style={{ color: s === status ? st.color : '#374151' }}
                >
                  {st.label}
                </span>
                {s === status && (
                  <span className="ml-auto text-[10px]" style={{ color: st.color }}>✓</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
