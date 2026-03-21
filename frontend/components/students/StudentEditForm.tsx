'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

const STATUS_OPTIONS = ['intake', 'forms', 'writing', 'review', 'submitted', 'accepted', 'rejected']
const GPA_SCALES = ['4.0', '5.0', '10.0', '100']

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
    toefl_score: student.toefl_score?.toString() ?? '',
    ielts_score: student.ielts_score?.toString() ?? '',
    parent_name: student.parent_name ?? '',
    parent_email: student.parent_email ?? '',
    parent_phone: student.parent_phone ?? '',
    notes: student.notes ?? '',
  })

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
      toefl_score: form.toefl_score ? parseInt(form.toefl_score) : null,
      ielts_score: form.ielts_score ? parseFloat(form.ielts_score) : null,
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

      {/* Test Scores */}
      <section>
        <h3 className="text-[12px] font-medium text-gray-400 uppercase tracking-[0.5px] mb-3">Test Scores</h3>
        <div className="grid grid-cols-3 gap-4">
          {field('SAT Total', 'sat_total', 'number', true)}
          {field('SAT Math', 'sat_math', 'number', true)}
          {field('SAT Reading', 'sat_reading', 'number', true)}
          {field('ACT', 'act_score', 'number', true)}
          {field('TOEFL', 'toefl_score', 'number', true)}
          {field('IELTS', 'ielts_score', 'number', true)}
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
