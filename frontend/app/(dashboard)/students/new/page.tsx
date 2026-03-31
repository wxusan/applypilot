'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { studentsApi } from '@/lib/api'
import { trackContact } from '@/lib/trackContact'
import Link from 'next/link'

const inputCls =
  'w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all'
const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.6px] text-gray-500 mb-1.5'

const STATUSES = ['intake', 'forms', 'writing', 'review', 'submitted', 'accepted', 'rejected']
const APP_TYPES = [
  { value: 'freshman', label: 'Freshman', desc: 'First-year undergraduate' },
  { value: 'transfer', label: 'Transfer', desc: 'Transferring from another school' },
  { value: 'graduate', label: 'Graduate', desc: "Master's or PhD program" },
]

export default function NewStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    nationality: '',
    season: '',
    status: 'intake',
    application_type: 'freshman',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Full name is required.'); return }
    setError(null)
    setLoading(true)
    try {
      const payload = {
        ...form,
        date_of_birth: form.date_of_birth || null,
      }
      const student = await studentsApi.create(payload) as { id: string }
      trackContact({
        name: form.full_name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        source: 'student',
        role: 'student',
      })
      router.push(`/students/${student.id}/profile`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto pb-16 pt-4">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-gray-400 mb-6">
        <Link href="/students" className="hover:text-primary transition-colors">Students</Link>
        <span>/</span>
        <span className="text-gray-600">New Student</span>
      </div>

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[22px] font-bold text-gray-900">Add a Student</h1>
        <p className="text-[13px] text-gray-400 mt-1">
          Just the basics to get started. You'll fill out the full dossier from their profile.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">

          {/* Full name */}
          <div>
            <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
            <input
              type="text" value={form.full_name} onChange={set('full_name')}
              placeholder="e.g. Amir Tashmatov"
              className={inputCls} autoFocus
            />
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Phone</label>
              <input type="tel" value={form.phone} onChange={set('phone')}
                placeholder="+998 90 000 00 00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="student@example.com" className={inputCls} />
            </div>
          </div>

          {/* DOB + Nationality */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nationality</label>
              <input type="text" value={form.nationality} onChange={set('nationality')}
                placeholder="e.g. Uzbekistan" className={inputCls} />
            </div>
          </div>

          {/* Season + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Application Season</label>
              <input type="text" value={form.season} onChange={set('season')}
                placeholder="e.g. 2025-26" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Application type */}
          <div>
            <label className={labelCls}>Application Type</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {APP_TYPES.map(opt => (
                <label
                  key={opt.value}
                  className={`flex flex-col gap-0.5 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    form.application_type === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input type="radio" name="application_type" value={opt.value}
                    checked={form.application_type === opt.value} onChange={set('application_type')} className="sr-only" />
                  <span className="text-[12px] font-bold text-gray-900">{opt.label}</span>
                  <span className="text-[10px] text-gray-400 leading-tight">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mt-5">
          <Link href="/students" className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors">
            ← Cancel
          </Link>
          <button
            type="submit" disabled={loading}
            className="flex items-center gap-2 px-7 py-2.5 rounded-lg text-white text-[13px] font-semibold shadow-sm hover:opacity-90 disabled:opacity-60 transition-all"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            {loading ? 'Creating…' : 'Create & Open Profile'}
            {!loading && <span className="material-symbols-outlined text-base">arrow_forward</span>}
          </button>
        </div>
      </form>
    </div>
  )
}
