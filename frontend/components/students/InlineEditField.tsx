'use client'

import { useState, useRef } from 'react'
import { Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface Props {
  studentId: string
  fieldName: string
  value: string | number | null | undefined
  label: string
  mono?: boolean
  type?: 'text' | 'number' | 'email' | 'tel'
  multiline?: boolean
}

export default function InlineEditField({
  studentId,
  fieldName,
  value,
  label,
  mono = false,
  type = 'text',
  multiline = false,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState(String(value ?? ''))
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const { success: toastSuccess, error: toastError } = useToast()

  const startEdit = () => {
    setInputVal(String(value ?? ''))
    setEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      textareaRef.current?.focus()
    }, 0)
  }

  const cancel = () => setEditing(false)

  const save = async () => {
    const trimmed = inputVal.trim()
    const original = String(value ?? '')
    if (trimmed === original) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      const parsed = type === 'number' && trimmed !== '' ? Number(trimmed) : trimmed || null
      await apiFetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ [fieldName]: parsed }),
      })
      toastSuccess(`${label} updated`)
      setEditing(false)
      router.refresh()
    } catch {
      toastError(`Failed to update ${label}`)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = `text-[13px] text-gray-700 rounded-[4px] px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#1D9E75] disabled:opacity-60 ${mono ? 'font-mono' : ''}`
  const inputStyle = { border: '0.5px solid #1D9E75', minWidth: '120px' }

  if (editing) {
    return (
      <div className="flex items-start gap-2">
        <dt className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px] shrink-0 w-20 pt-0.5">
          {label}
        </dt>
        <dd>
          {multiline ? (
            <textarea
              ref={textareaRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === 'Escape') cancel()
              }}
              disabled={saving}
              rows={3}
              className={`${inputClass} resize-none w-full`}
              style={{ ...inputStyle, minWidth: '200px' }}
            />
          ) : (
            <input
              ref={inputRef}
              type={type}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save()
                if (e.key === 'Escape') cancel()
              }}
              disabled={saving}
              className={inputClass}
              style={inputStyle}
            />
          )}
        </dd>
      </div>
    )
  }

  return (
    <div className="flex items-baseline gap-2 group">
      <dt className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px] shrink-0 w-20">
        {label}
      </dt>
      <dd
        className={`text-[13px] text-gray-700 cursor-pointer hover:text-gray-900 flex items-center gap-1 ${mono ? 'font-mono' : ''}`}
        onClick={startEdit}
        title={`Click to edit ${label}`}
      >
        <span className={!value && value !== 0 ? 'text-gray-400' : ''}>
          {value !== null && value !== undefined && value !== '' ? value : '—'}
        </span>
        <Pencil
          size={10}
          className="opacity-0 group-hover:opacity-40 transition-opacity text-gray-400 shrink-0"
        />
      </dd>
    </div>
  )
}
