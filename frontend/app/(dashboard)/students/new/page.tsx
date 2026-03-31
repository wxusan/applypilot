'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { studentsApi } from '@/lib/api'
import { trackContact } from '@/lib/trackContact'
import Link from 'next/link'

// ─── Defined outside component to prevent re-mount on each keystroke ─────────
const inputCls =
  'w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all'
const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.6px] text-gray-500 mb-1.5'

function Field({
  label, field, type = 'text', placeholder = '', form, onChange, required,
}: {
  label: string; field: string; type?: string; placeholder?: string
  form: Record<string, string>; onChange: (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
}) {
  return (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={form[field] ?? ''} onChange={onChange(field)} placeholder={placeholder} className={inputCls} />
    </div>
  )
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 pb-4 mb-5 border-b border-gray-100">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <h3 className="text-[14px] font-bold text-gray-900">{title}</h3>
        <p className="text-[11px] text-gray-400">{subtitle}</p>
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

const STATUSES = ['intake', 'forms', 'writing', 'review', 'submitted', 'accepted', 'rejected']
const APP_TYPES = [
  { value: 'freshman', label: 'Freshman', desc: 'First-year undergraduate' },
  { value: 'transfer', label: 'Transfer', desc: 'Transferring from another institution' },
  { value: 'graduate', label: 'Graduate', desc: "Master's or PhD program" },
]

export default function NewStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    // Personal
    full_name: '', preferred_name: '', email: '', phone: '',
    date_of_birth: '', nationality: '', telegram_username: '', status: 'intake',
    // Passport & Travel
    passport_number: '', passport_expiry: '',
    // Parent
    parent_name: '', parent_email: '', parent_phone: '',
    // Academic
    high_school_name: '', high_school_country: '', graduation_year: '',
    gpa: '', gpa_scale: '4.0', class_rank: '',
    sat_total: '', sat_math: '', sat_reading: '',
    act_score: '', toefl_score: '', ielts_score: '', duolingo_score: '',
    // Intent
    application_type: 'freshman', season: '', intended_major: '', notes: '',
  })

  const [languagesText, setLanguagesText] = useState('')

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  const setInput = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.full_name.trim()) { setError('Student full name is required.'); return }

    setLoading(true)
    try {
      const languages = languagesText
        .split(',')
        .map(l => l.trim())
        .filter(Boolean)

      const payload = {
        ...form,
        date_of_birth: form.date_of_birth || null,
        passport_expiry: form.passport_expiry || null,
        graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
        gpa: form.gpa ? Number(form.gpa) : null,
        gpa_scale: form.gpa_scale ? Number(form.gpa_scale) : 4.0,
        class_rank: form.class_rank || null,
        sat_total: form.sat_total ? Number(form.sat_total) : null,
        sat_math: form.sat_math ? Number(form.sat_math) : null,
        sat_reading: form.sat_reading ? Number(form.sat_reading) : null,
        act_score: form.act_score ? Number(form.act_score) : null,
        toefl_score: form.toefl_score ? Number(form.toefl_score) : null,
        ielts_score: form.ielts_score ? Number(form.ielts_score) : null,
        duolingo_score: form.duolingo_score ? Number(form.duolingo_score) : null,
        languages,
      }

      const student = await studentsApi.create(payload) as { id: string }
      trackContact({
        name: form.full_name,
        phone: form.phone || form.parent_phone || undefined,
        email: form.email || form.parent_email || undefined,
        source: 'student', role: 'student',
        note: [form.high_school_name, form.nationality, form.intended_major].filter(Boolean).join(' · ') || undefined,
      })
      router.push(`/students/${student.id}/profile`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const gpaPct = form.gpa ? Math.min(100, (Number(form.gpa) / Number(form.gpa_scale || 4)) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto pb-20">

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[12px] text-gray-400 mb-3">
          <Link href="/students" className="hover:text-primary transition-colors">Students</Link>
          <span>/</span>
          <span className="text-gray-600">New Student</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create Student Profile</h1>
        <p className="text-[13px] text-gray-500 mt-1">Fill in what you know now — everything can be updated later from the student profile.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── 1. Personal Information ──────────────────────────────────── */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <SectionHeader icon="person" title="Personal Information" subtitle="Core identity and contact details" />
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Full Name" field="full_name" placeholder="e.g. Amir Tashmatov" form={form} onChange={setInput} required />
            <Field label="Preferred Name" field="preferred_name" placeholder="e.g. Amir" form={form} onChange={setInput} />
            <Field label="Date of Birth" field="date_of_birth" type="date" form={form} onChange={setInput} />
            <Field label="Nationality / Citizenship" field="nationality" placeholder="e.g. Uzbekistan" form={form} onChange={setInput} />
            <Field label="Email Address" field="email" type="email" placeholder="student@example.com" form={form} onChange={setInput} />
            <Field label="Phone Number" field="phone" placeholder="+998 90 000 00 00" form={form} onChange={setInput} />
            <Field label="Telegram Username" field="telegram_username" placeholder="@username" form={form} onChange={setInput} />
            <div>
              <label className={labelCls}>Pipeline Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── 2. Passport & Languages ───────────────────────────────────── */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <SectionHeader icon="travel_explore" title="Passport & Languages" subtitle="Required for visa and travel documentation" />
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Passport Number" field="passport_number" placeholder="e.g. AA1234567" form={form} onChange={setInput} />
            <Field label="Passport Expiry Date" field="passport_expiry" type="date" form={form} onChange={setInput} />
            <div className="col-span-2">
              <label className={labelCls}>Languages Spoken</label>
              <input
                type="text"
                value={languagesText}
                onChange={e => setLanguagesText(e.target.value)}
                placeholder="e.g. Uzbek, Russian, English"
                className={inputCls}
              />
              <p className="text-[11px] text-gray-400 mt-1">Separate multiple languages with a comma.</p>
            </div>
          </div>
        </div>

        {/* ── 3. Parent / Guardian ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <SectionHeader icon="family_restroom" title="Parent / Guardian" subtitle="Primary family contact" />
          <div className="grid grid-cols-3 gap-x-5 gap-y-4">
            <Field label="Full Name" field="parent_name" placeholder="e.g. Behzod Tashmatov" form={form} onChange={setInput} />
            <Field label="Email" field="parent_email" type="email" placeholder="parent@example.com" form={form} onChange={setInput} />
            <Field label="Phone" field="parent_phone" placeholder="+998 90 000 00 00" form={form} onChange={setInput} />
          </div>
        </div>

        {/* ── 4. Academic Profile ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <SectionHeader icon="menu_book" title="Academic Profile" subtitle="High school, GPA, and standardized test scores" />

          {/* School info */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-4 mb-5">
            <Field label="High School Name" field="high_school_name" placeholder="e.g. Tashkent International School" form={form} onChange={setInput} />
            <Field label="High School Country" field="high_school_country" placeholder="e.g. Uzbekistan" form={form} onChange={setInput} />
            <Field label="Graduation Year" field="graduation_year" type="number" placeholder="2025" form={form} onChange={setInput} />
            <Field label="Class Rank" field="class_rank" placeholder="e.g. 5 / 120" form={form} onChange={setInput} />
          </div>

          {/* GPA bar */}
          <div className="border border-gray-100 rounded-lg p-4 mb-4">
            <label className={labelCls}>Cumulative GPA</label>
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-1">
                <input
                  type="number" value={form.gpa} onChange={set('gpa')}
                  placeholder="3.85" step="0.01" min="0"
                  className="w-20 text-[22px] font-bold text-primary bg-transparent border-none outline-none focus:ring-0 p-0"
                />
                <span className="text-gray-400 text-[13px]">/</span>
                <input
                  type="number" value={form.gpa_scale} onChange={set('gpa_scale')}
                  step="0.1" min="1"
                  className="w-10 text-[13px] text-gray-500 bg-transparent border-none outline-none focus:ring-0 p-0"
                />
              </div>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${gpaPct}%` }} />
              </div>
              <span className="text-[12px] text-gray-400 w-8 text-right shrink-0">{gpaPct.toFixed(0)}%</span>
            </div>
          </div>

          {/* Score cards */}
          <div className="grid grid-cols-3 gap-4">
            {/* SAT */}
            <div className="border border-gray-100 rounded-lg p-4">
              <p className={labelCls}>SAT</p>
              <input type="number" value={form.sat_total} onChange={set('sat_total')} placeholder="1540"
                className="w-full text-[20px] font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0 mb-0.5" />
              <p className="text-[9px] text-gray-400 uppercase font-semibold mb-3">Total</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input type="number" value={form.sat_math} onChange={set('sat_math')} placeholder="780"
                    className="w-full text-[13px] text-gray-700 bg-transparent border-none outline-none focus:ring-0 p-0" />
                  <p className="text-[9px] text-gray-400 uppercase font-semibold">Math</p>
                </div>
                <div>
                  <input type="number" value={form.sat_reading} onChange={set('sat_reading')} placeholder="760"
                    className="w-full text-[13px] text-gray-700 bg-transparent border-none outline-none focus:ring-0 p-0" />
                  <p className="text-[9px] text-gray-400 uppercase font-semibold">Reading</p>
                </div>
              </div>
            </div>

            {/* ACT */}
            <div className="border border-gray-100 rounded-lg p-4">
              <p className={labelCls}>ACT</p>
              <input type="number" value={form.act_score} onChange={set('act_score')} placeholder="34"
                className="w-full text-[20px] font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0 mb-0.5" />
              <p className="text-[9px] text-gray-400 uppercase font-semibold">Composite</p>
            </div>

            {/* English Proficiency */}
            <div className="border border-gray-100 rounded-lg p-4">
              <p className={labelCls}>English Proficiency</p>
              <div className="space-y-2.5">
                <div>
                  <input type="number" value={form.toefl_score} onChange={set('toefl_score')} placeholder="112"
                    className="w-full text-[18px] font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0" />
                  <p className="text-[9px] text-gray-400 uppercase font-semibold">TOEFL</p>
                </div>
                <div>
                  <input type="number" value={form.ielts_score} onChange={set('ielts_score')} placeholder="7.5" step="0.5"
                    className="w-full text-[13px] text-gray-700 bg-transparent border-none outline-none focus:ring-0 p-0" />
                  <p className="text-[9px] text-gray-400 uppercase font-semibold">IELTS</p>
                </div>
                <div>
                  <input type="number" value={form.duolingo_score} onChange={set('duolingo_score')} placeholder="135"
                    className="w-full text-[13px] text-gray-700 bg-transparent border-none outline-none focus:ring-0 p-0" />
                  <p className="text-[9px] text-gray-400 uppercase font-semibold">Duolingo</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. Application Intent ────────────────────────────────────── */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <SectionHeader icon="flag" title="Application Intent" subtitle="Target program, cycle, and counselor notes" />

          <div className="grid grid-cols-3 gap-3 mb-5">
            {APP_TYPES.map(opt => (
              <label
                key={opt.value}
                className={`flex flex-col gap-0.5 p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                  form.application_type === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <input type="radio" name="application_type" value={opt.value}
                  checked={form.application_type === opt.value} onChange={set('application_type')} className="sr-only" />
                <span className="text-[13px] font-bold text-gray-900">{opt.label}</span>
                <span className="text-[11px] text-gray-400">{opt.desc}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-4 mb-4">
            <Field label="Intended Major / Field" field="intended_major" placeholder="e.g. Computer Science" form={form} onChange={setInput} />
            <Field label="Application Season" field="season" placeholder="e.g. 2025-26" form={form} onChange={setInput} />
          </div>

          <div>
            <label className={labelCls}>Internal Notes</label>
            <textarea
              value={form.notes} onChange={set('notes')} rows={3}
              placeholder="Notes visible only to your team…"
              className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/students" className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors">
            ← Cancel
          </Link>
          <button
            type="submit" disabled={loading}
            className="flex items-center gap-2 px-7 py-2.5 rounded-lg text-white text-[13px] font-semibold shadow-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            {loading ? 'Creating…' : 'Create Profile'}
            {!loading && <span className="material-symbols-outlined text-base">arrow_forward</span>}
          </button>
        </div>
      </form>
    </div>
  )
}
