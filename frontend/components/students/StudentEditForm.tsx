'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

const STATUS_OPTIONS = ['intake', 'forms', 'writing', 'review', 'submitted', 'accepted', 'rejected']
const GPA_SCALES = ['4.0', '5.0', '10.0', '100']

// ── English test config ──────────────────────────────────────────────────────
const ENGLISH_TESTS = [
  { value: 'toefl_ibt',  label: 'TOEFL iBT',  range: '0–120' },
  { value: 'ielts',      label: 'IELTS',       range: '0–9' },
  { value: 'duolingo',   label: 'Duolingo',    range: '10–160' },
  { value: 'pte',        label: 'PTE Academic',range: '10–90' },
  { value: 'cambridge',  label: 'Cambridge',   range: 'C1/C2' },
]

const TEST_SUBSCORES: Record<string, { key: string; label: string; isText?: boolean }[]> = {
  toefl_ibt: [
    { key: 'total',     label: 'Total (0–120)' },
    { key: 'reading',   label: 'Reading (0–30)' },
    { key: 'listening', label: 'Listening (0–30)' },
    { key: 'speaking',  label: 'Speaking (0–30)' },
    { key: 'writing',   label: 'Writing (0–30)' },
  ],
  ielts: [
    { key: 'total',     label: 'Overall Band (0–9)' },
    { key: 'listening', label: 'Listening (0–9)' },
    { key: 'reading',   label: 'Reading (0–9)' },
    { key: 'writing',   label: 'Writing (0–9)' },
    { key: 'speaking',  label: 'Speaking (0–9)' },
  ],
  duolingo: [
    { key: 'total',         label: 'Overall (10–160)' },
    { key: 'literacy',      label: 'Literacy' },
    { key: 'comprehension', label: 'Comprehension' },
    { key: 'conversation',  label: 'Conversation' },
    { key: 'production',    label: 'Production' },
  ],
  pte: [
    { key: 'total',     label: 'Overall (10–90)' },
    { key: 'listening', label: 'Listening' },
    { key: 'reading',   label: 'Reading' },
    { key: 'writing',   label: 'Writing' },
    { key: 'speaking',  label: 'Speaking' },
  ],
  cambridge: [
    { key: 'total',           label: 'Overall Score (0–100)' },
    { key: 'reading',         label: 'Reading' },
    { key: 'use_of_english',  label: 'Use of English' },
    { key: 'writing',         label: 'Writing' },
    { key: 'listening',       label: 'Listening' },
    { key: 'speaking',        label: 'Speaking' },
    { key: 'grade',           label: 'Grade (A/B/C)', isText: true },
  ],
}

interface StudentEditFormProps {
  student: {
    id: string
    full_name: string
    preferred_name?: string | null
    email?: string | null
    phone?: string | null
    date_of_birth?: string | null
    nationality?: string | null
    telegram_username?: string | null
    status: string
    season?: string | null
    high_school_name?: string | null
    high_school_country?: string | null
    graduation_year?: number | null
    gpa?: number | null
    gpa_scale?: string | null
    intended_major?: string | null
    sat_total?: number | null
    sat_math?: number | null
    sat_reading?: number | null
    act_score?: number | null
    toefl_score?: number | null
    ielts_score?: number | null
    english_test_type?: string | null
    english_test_scores?: Record<string, number | string | null> | null
    parent_name?: string | null
    parent_email?: string | null
    parent_phone?: string | null
    notes?: string | null
  }
}

export default function StudentEditForm({ student }: StudentEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // English proficiency state
  const [engTestType, setEngTestType] = useState<string>(
    student.english_test_type ?? (student.toefl_score ? 'toefl_ibt' : student.ielts_score ? 'ielts' : 'toefl_ibt')
  )
  const [engScores, setEngScores] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(student.english_test_scores ?? {}).map(([k, v]) => [k, v?.toString() ?? ''])
    )
  )
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extractSuccess, setExtractSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    full_name: student.full_name ?? '',
    preferred_name: student.preferred_name ?? '',
    email: student.email ?? '',
    phone: student.phone ?? '',
    date_of_birth: student.date_of_birth ?? '',
    nationality: student.nationality ?? '',
    telegram_username: student.telegram_username ?? '',
    status: student.status ?? 'intake',
    season: student.season ?? '',
    high_school_name: student.high_school_name ?? '',
    high_school_country: student.high_school_country ?? '',
    graduation_year: student.graduation_year?.toString() ?? '',
    gpa: student.gpa?.toString() ?? '',
    gpa_scale: student.gpa_scale ?? '4.0',
    intended_major: student.intended_major ?? '',
    sat_total: student.sat_total?.toString() ?? '',
    sat_math: student.sat_math?.toString() ?? '',
    sat_reading: student.sat_reading?.toString() ?? '',
    act_score: student.act_score?.toString() ?? '',
    parent_name: student.parent_name ?? '',
    parent_email: student.parent_email ?? '',
    parent_phone: student.parent_phone ?? '',
    notes: student.notes ?? '',
  })

  async function handleExtract(file: File) {
    setExtracting(true)
    setExtractError(null)
    setExtractSuccess(false)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const { createBrowserClient } = await import('@/lib/supabase-browser')
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''

      const res = await fetch(`/api/students/${student.id}/extract-english-scores`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? `Error ${res.status}`)
      }
      const data = await res.json() as { test_type: string; scores: Record<string, number | string | null> }
      // Set detected test type and scores
      if (data.test_type) setEngTestType(data.test_type)
      if (data.scores) {
        setEngScores(
          Object.fromEntries(
            Object.entries(data.scores)
              .filter(([, v]) => v !== null && v !== undefined)
              .map(([k, v]) => [k, v!.toString()])
          )
        )
      }
      setExtractSuccess(true)
    } catch (err: unknown) {
      setExtractError(err instanceof Error ? err.message : 'Extraction failed')
    } finally {
      setExtracting(false)
    }
  }

  function field(label: string, key: keyof typeof form, type = 'text', mono = false) {
    return (
      <div key={key}>
        <label className="block text-[12px] font-medium text-gray-500 mb-1">{label}</label>
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className={`w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75] ${mono ? 'font-mono' : ''}`}
          style={{ border: '0.5px solid #d1d5db' }}
        />
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) {
      setError('Full name is required')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Build english_test_scores — convert strings to numbers where applicable
    const subscoreFields = TEST_SUBSCORES[engTestType] ?? []
    const builtScores: Record<string, number | string | null> = {}
    for (const { key, isText } of subscoreFields as { key: string; label: string; isText?: boolean }[]) {
      const raw = engScores[key]
      if (raw) {
        builtScores[key] = isText ? raw : (isNaN(parseFloat(raw)) ? null : parseFloat(raw))
      }
    }

    const payload: Record<string, unknown> = {
      full_name: form.full_name.trim(),
      preferred_name: form.preferred_name || null,
      email: form.email || null,
      phone: form.phone || null,
      date_of_birth: form.date_of_birth || null,
      nationality: form.nationality || null,
      telegram_username: form.telegram_username || null,
      status: form.status,
      season: form.season || null,
      high_school_name: form.high_school_name || null,
      high_school_country: form.high_school_country || null,
      graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
      gpa: form.gpa ? parseFloat(form.gpa) : null,
      gpa_scale: form.gpa_scale || null,
      intended_major: form.intended_major || null,
      sat_total: form.sat_total ? parseInt(form.sat_total) : null,
      sat_math: form.sat_math ? parseInt(form.sat_math) : null,
      sat_reading: form.sat_reading ? parseInt(form.sat_reading) : null,
      act_score: form.act_score ? parseInt(form.act_score) : null,
      // Unified English proficiency
      english_test_type: engTestType || null,
      english_test_scores: Object.keys(builtScores).length > 0 ? builtScores : null,
      // Keep legacy columns in sync for backward compat
      toefl_score: engTestType === 'toefl_ibt' && builtScores.total ? Number(builtScores.total) : null,
      ielts_score: engTestType === 'ielts' && builtScores.total ? Number(builtScores.total) : null,
      duolingo_score: engTestType === 'duolingo' && builtScores.total ? Number(builtScores.total) : null,
      parent_name: form.parent_name || null,
      parent_email: form.parent_email || null,
      parent_phone: form.parent_phone || null,
      notes: form.notes || null,
    }

    try {
      await apiFetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      setSuccess(true)
      router.refresh()
      router.push(`/students/${student.id}/profile`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal */}
      <section>
        <h3 className="text-[12px] font-medium text-gray-400 uppercase tracking-[0.5px] mb-3">Personal</h3>
        <div className="grid grid-cols-3 gap-4">
          {field('Full Name', 'full_name')}
          {field('Preferred Name', 'preferred_name')}
          {field('Email', 'email', 'email')}
          {field('Phone', 'phone', 'tel')}
          {field('Date of Birth', 'date_of_birth', 'date')}
          {field('Nationality', 'nationality')}
          {field('Telegram', 'telegram_username')}
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75] bg-white capitalize"
              style={{ border: '0.5px solid #d1d5db' }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>
          {field('Season', 'season')}
        </div>
      </section>

      {/* Academic */}
      <section>
        <h3 className="text-[12px] font-medium text-gray-400 uppercase tracking-[0.5px] mb-3">Academic</h3>
        <div className="grid grid-cols-3 gap-4">
          {field('High School', 'high_school_name')}
          {field('HS Country', 'high_school_country')}
          {field('Graduation Year', 'graduation_year', 'number', true)}
          {field('GPA', 'gpa', 'number', true)}
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1">GPA Scale</label>
            <select
              value={form.gpa_scale}
              onChange={(e) => setForm({ ...form, gpa_scale: e.target.value })}
              className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75] bg-white"
              style={{ border: '0.5px solid #d1d5db' }}
            >
              {GPA_SCALES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {field('Intended Major', 'intended_major')}
        </div>
      </section>

      {/* Test Scores — SAT / ACT */}
      <section>
        <h3 className="text-[12px] font-medium text-gray-400 uppercase tracking-[0.5px] mb-3">Standardised Tests</h3>
        <div className="grid grid-cols-4 gap-4">
          {field('SAT Total', 'sat_total', 'number', true)}
          {field('SAT Math', 'sat_math', 'number', true)}
          {field('SAT Reading', 'sat_reading', 'number', true)}
          {field('ACT', 'act_score', 'number', true)}
        </div>
      </section>

      {/* English Proficiency */}
      <section>
        <h3 className="text-[12px] font-medium text-gray-400 uppercase tracking-[0.5px] mb-3">English Proficiency</h3>

        {/* Test type selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {ENGLISH_TESTS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { setEngTestType(t.value); setEngScores({}); setExtractSuccess(false) }}
              className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition border ${
                engTestType === t.value
                  ? 'bg-[#031635] text-white border-[#031635]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-[10px] ${engTestType === t.value ? 'text-white/60' : 'text-gray-400'}`}>
                {t.range}
              </span>
            </button>
          ))}
        </div>

        {/* Upload score report → AI extraction */}
        <div
          className="relative rounded-[8px] border-2 border-dashed mb-4 p-4 flex items-center gap-4 cursor-pointer group transition-colors"
          style={{ borderColor: extractSuccess ? '#1D9E75' : '#d1d5db', background: extractSuccess ? '#f0fdf4' : '#fafafa' }}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleExtract(f) }}
          />
          {extracting ? (
            <>
              <div className="w-8 h-8 rounded-full border-2 border-[#031635] border-t-transparent animate-spin shrink-0" />
              <div>
                <p className="text-[12px] font-semibold text-[#031635]">Analysing score report…</p>
                <p className="text-[11px] text-gray-400">GPT-4o Vision is reading your document</p>
              </div>
            </>
          ) : extractSuccess ? (
            <>
              <span className="material-symbols-outlined text-[#1D9E75] shrink-0">check_circle</span>
              <div>
                <p className="text-[12px] font-semibold text-[#1D9E75]">Scores extracted successfully</p>
                <p className="text-[11px] text-gray-400">Review the fields below and upload again to rescan</p>
              </div>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-gray-400 group-hover:text-[#031635] transition shrink-0">upload_file</span>
              <div>
                <p className="text-[12px] font-semibold text-gray-700">Upload score report</p>
                <p className="text-[11px] text-gray-400">JPEG, PNG, WebP or PDF · AI will extract all sub-scores automatically</p>
              </div>
            </>
          )}
        </div>
        {extractError && (
          <p className="text-[11px] text-red-500 mb-3">⚠ {extractError}</p>
        )}

        {/* Sub-score fields */}
        <div className="grid grid-cols-3 gap-4">
          {(TEST_SUBSCORES[engTestType] ?? []).map(({ key, label, isText }: { key: string; label: string; isText?: boolean }) => (
            <div key={key}>
              <label className="block text-[12px] font-medium text-gray-500 mb-1">{label}</label>
              <input
                type={isText ? 'text' : 'number'}
                value={engScores[key] ?? ''}
                onChange={(e) => setEngScores({ ...engScores, [key]: e.target.value })}
                placeholder="—"
                className="w-full h-9 px-3 text-[13px] rounded-[6px] font-mono focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                style={{ border: '0.5px solid #d1d5db' }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Parent */}
      <section>
        <h3 className="text-[12px] font-medium text-gray-400 uppercase tracking-[0.5px] mb-3">Parent / Guardian</h3>
        <div className="grid grid-cols-3 gap-4">
          {field('Name', 'parent_name')}
          {field('Email', 'parent_email', 'email')}
          {field('Phone', 'parent_phone', 'tel')}
        </div>
      </section>

      {/* Notes */}
      <section>
        <h3 className="text-[12px] font-medium text-gray-400 uppercase tracking-[0.5px] mb-3">Notes</h3>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 text-[13px] rounded-[6px] resize-none focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
          style={{ border: '0.5px solid #d1d5db' }}
        />
      </section>

      {error && <p className="text-[12px] text-[#A32D2D]">{error}</p>}
      {success && <p className="text-[12px] text-[#3B6D11]">Changes saved.</p>}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(`/students/${student.id}/profile`)}
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
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
