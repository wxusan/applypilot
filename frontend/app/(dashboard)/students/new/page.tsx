'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { studentsApi } from '@/lib/api'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    preferred_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    nationality: '',
    graduation_year: '',
    high_school_name: '',
    high_school_country: '',
    gpa: '',
    gpa_scale: '4.0',
    sat_total: '',
    act_score: '',
    toefl_score: '',
    ielts_score: '',
    intended_major: '',
    application_type: 'freshman',
    season: '',
    status: 'intake',
    notes: '',
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    telegram_username: '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.full_name.trim()) {
      setError('Student name is required.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
        gpa: form.gpa ? Number(form.gpa) : null,
        gpa_scale: form.gpa_scale ? Number(form.gpa_scale) : 4.0,
        sat_total: form.sat_total ? Number(form.sat_total) : null,
        act_score: form.act_score ? Number(form.act_score) : null,
        toefl_score: form.toefl_score ? Number(form.toefl_score) : null,
        ielts_score: form.ielts_score ? Number(form.ielts_score) : null,
      }

      const student = await studentsApi.create(payload) as { id: string }
      router.push(`/students/${student.id}/profile`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full h-9 px-3 text-[13px] rounded-[6px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand transition"
  const inputStyle = { border: '0.5px solid #d1d5db' }
  const labelClass = "block text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-1.5"

  const Field = ({ label, field, type = 'text', placeholder = '' }: { label: string; field: string; type?: string; placeholder?: string }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        value={(form as Record<string, string>)[field]}
        onChange={set(field)}
        placeholder={placeholder}
        className={inputClass}
        style={inputStyle}
      />
    </div>
  )

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/students" className="text-gray-400 hover:text-gray-700 transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900">New Student</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Add a student to your agency pipeline</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal Info */}
        <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name *" field="full_name" placeholder="Jane Smith" />
            <Field label="Preferred Name" field="preferred_name" placeholder="Jane" />
            <Field label="Email" field="email" type="email" placeholder="jane@example.com" />
            <Field label="Phone" field="phone" placeholder="+1 (555) 000-0000" />
            <Field label="Date of Birth" field="date_of_birth" type="date" />
            <Field label="Nationality" field="nationality" placeholder="Uzbek" />
            <Field label="Telegram Username" field="telegram_username" placeholder="@jane" />
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={form.status}
                onChange={set('status')}
                className={inputClass}
                style={inputStyle}
              >
                {['intake', 'forms', 'writing', 'review', 'submitted', 'accepted', 'rejected'].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Parent Info */}
        <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Parent / Guardian</h2>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Parent Name" field="parent_name" />
            <Field label="Parent Email" field="parent_email" type="email" />
            <Field label="Parent Phone" field="parent_phone" />
          </div>
        </div>

        {/* Academic Info */}
        <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Academic Background</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="High School Name" field="high_school_name" />
            <Field label="High School Country" field="high_school_country" />
            <Field label="Graduation Year" field="graduation_year" type="number" placeholder="2025" />
            <Field label="Intended Major" field="intended_major" placeholder="Computer Science" />
            <Field label="GPA" field="gpa" type="number" placeholder="3.85" />
            <Field label="GPA Scale" field="gpa_scale" type="number" placeholder="4.0" />
          </div>
        </div>

        {/* Test Scores */}
        <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Test Scores</h2>
          <div className="grid grid-cols-4 gap-4">
            <Field label="SAT Total" field="sat_total" type="number" placeholder="1480" />
            <Field label="ACT" field="act_score" type="number" placeholder="32" />
            <Field label="TOEFL" field="toefl_score" type="number" placeholder="110" />
            <Field label="IELTS" field="ielts_score" type="number" placeholder="7.5" />
          </div>
        </div>

        {/* Application Info */}
        <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Application Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Application Type</label>
              <select value={form.application_type} onChange={set('application_type')} className={inputClass} style={inputStyle}>
                <option value="freshman">Freshman</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <Field label="Season (e.g. 2024-25)" field="season" placeholder="2024-25" />
          </div>
          <div className="mt-4">
            <label className={labelClass}>Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              placeholder="Internal notes about this student…"
              className="w-full px-3 py-2 text-[13px] rounded-[6px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand transition resize-none"
              style={{ border: '0.5px solid #d1d5db' }}
            />
          </div>
        </div>

        {error && (
          <div
            className="rounded-[6px] px-4 py-3 text-[13px] text-danger-text"
            style={{ backgroundColor: '#FCEBEB', border: '0.5px solid #f5c2c2' }}
          >
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="h-9 px-5 rounded-[6px] text-[13px] font-medium text-white transition disabled:opacity-60"
            style={{ backgroundColor: '#1D9E75' }}
          >
            {loading ? 'Creating…' : 'Create Student'}
          </button>
          <Link
            href="/students"
            className="h-9 px-5 rounded-[6px] text-[13px] text-gray-500 flex items-center transition hover:bg-gray-50"
            style={{ border: '0.5px solid #e5e7eb' }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
