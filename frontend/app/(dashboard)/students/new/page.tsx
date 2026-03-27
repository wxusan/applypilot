'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { studentsApi } from '@/lib/api'
import { trackContact } from '@/lib/trackContact'
import Link from 'next/link'

// ─── These must be defined OUTSIDE the page component ───────────────────────
// If defined inside, React treats them as new component types on every render,
// which unmounts and remounts every Field on each keystroke → focus is lost.
const inputClass = "w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10 outline-none transition-all text-on-surface placeholder:text-on-surface-variant/50"
const labelClass = "block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2"

function Field({
  label, field, type = 'text', placeholder = '', form, onChange,
}: {
  label: string
  field: string
  type?: string
  placeholder?: string
  form: Record<string, string>
  onChange: (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="space-y-2">
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        value={form[field] ?? ''}
        onChange={onChange(field)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

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

  // Typed version for Field component (input only)
  const setInput = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
      trackContact({
        name: form.full_name,
        phone: form.phone || form.parent_phone || undefined,
        email: form.email || form.parent_email || undefined,
        source: 'student',
        role: 'student',
        note: [form.high_school_name, form.nationality, form.intended_major].filter(Boolean).join(' · ') || undefined,
      })
      router.push(`/students/${student.id}/profile`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-12 max-w-6xl">
      {/* Left Column: Stepper */}
      <aside className="lg:w-1/4">
        <div className="sticky top-8">
          <h2 className="font-headline text-2xl font-extrabold text-primary mb-8 tracking-tight">
            Onboarding Dossier
          </h2>
          <div className="relative">
            {/* Stepper Line */}
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-surface-container-high" />
            <ul className="space-y-10 relative">
              <li className="flex gap-6 items-start">
                <div className="relative z-10 w-6 h-6 rounded-full bg-primary flex items-center justify-center ring-4 ring-surface">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
                <div>
                  <p className="font-bold text-primary text-sm leading-none mb-1">Personal Identity</p>
                  <p className="text-xs text-on-surface-variant">Core student data</p>
                </div>
              </li>
              <li className="flex gap-6 items-start">
                <div className="relative z-10 w-6 h-6 rounded-full bg-primary ring-4 ring-surface flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <div>
                  <p className="font-bold text-primary text-sm leading-none mb-1">Academic Profile</p>
                  <p className="text-xs text-on-surface-variant">Transcript &amp; test scores</p>
                </div>
              </li>
              <li className="flex gap-6 items-start">
                <div className="relative z-10 w-6 h-6 rounded-full bg-surface-container-high ring-4 ring-surface" />
                <div>
                  <p className="font-semibold text-on-surface-variant text-sm leading-none mb-1">Enrollment Intent</p>
                  <p className="text-xs text-on-surface-variant">Cycle &amp; major targets</p>
                </div>
              </li>
              <li className="flex gap-6 items-start">
                <div className="relative z-10 w-6 h-6 rounded-full bg-surface-container-high ring-4 ring-surface" />
                <div>
                  <p className="font-semibold text-on-surface-variant text-sm leading-none mb-1">Review &amp; Submit</p>
                  <p className="text-xs text-on-surface-variant">Final validation check</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Right Column: Form */}
      <div className="lg:w-3/4">
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Section: Personal Information */}
          <section className="bg-surface-container-low rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary">person</span>
              <h3 className="font-headline font-bold text-xl text-primary">Personal Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Field label="Full Name *" field="full_name" placeholder="e.g. Alexander Hamilton" form={form} onChange={setInput} />
              <Field label="Preferred Name" field="preferred_name" placeholder="e.g. Alex" form={form} onChange={setInput} />
              <Field label="Email Address" field="email" type="email" placeholder="student@university.edu" form={form} onChange={setInput} />
              <Field label="Phone" field="phone" placeholder="+1 (555) 000-0000" form={form} onChange={setInput} />
              <Field label="Date of Birth" field="date_of_birth" type="date" form={form} onChange={setInput} />
              <Field label="Nationality / Citizenship" field="nationality" placeholder="e.g. United States" form={form} onChange={setInput} />
              <Field label="Telegram Username" field="telegram_username" placeholder="@username" form={form} onChange={setInput} />
              <div className="space-y-2">
                <label className={labelClass}>Status</label>
                <select
                  value={form.status}
                  onChange={set('status')}
                  className={inputClass}
                >
                  {['intake', 'forms', 'writing', 'review', 'submitted', 'accepted', 'rejected'].map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Section: Parent / Guardian */}
          <section className="bg-surface-container-low rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary">family_restroom</span>
              <h3 className="font-headline font-bold text-xl text-primary">Parent / Guardian</h3>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <Field label="Parent Name" field="parent_name" placeholder="Full name" form={form} onChange={setInput} />
              <Field label="Parent Email" field="parent_email" type="email" placeholder="parent@example.com" form={form} onChange={setInput} />
              <Field label="Parent Phone" field="parent_phone" placeholder="+1 (555) 000-0000" form={form} onChange={setInput} />
            </div>
          </section>

          {/* Section: Academic Profile */}
          <section className="bg-surface-container-low rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary">menu_book</span>
              <h3 className="font-headline font-bold text-xl text-primary">Academic Profile</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* GPA Card */}
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  Cumulative GPA
                </label>
                <div className="flex items-end gap-2">
                  <input
                    type="number"
                    value={form.gpa}
                    onChange={set('gpa')}
                    placeholder="3.85"
                    step="0.01"
                    min="0"
                    max="4"
                    className="w-20 text-2xl font-headline font-bold text-primary border-none p-0 focus:ring-0 bg-transparent outline-none"
                  />
                  <span className="text-on-surface-variant text-sm pb-1">/ 4.0</span>
                </div>
                <div className="mt-4 h-1 w-full bg-surface-container-low rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: form.gpa ? `${Math.min(100, (Number(form.gpa) / 4) * 100)}%` : '0%' }}
                  />
                </div>
              </div>

              {/* SAT/ACT Card */}
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  SAT / ACT Score
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    value={form.sat_total}
                    onChange={set('sat_total')}
                    placeholder="1540"
                    className="w-full text-2xl font-headline font-bold text-primary border-none p-0 focus:ring-0 bg-transparent outline-none"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant font-semibold uppercase">SAT Total</p>
                <input
                  type="number"
                  value={form.act_score}
                  onChange={set('act_score')}
                  placeholder="32"
                  className="mt-2 w-full text-sm text-on-surface border-none p-0 focus:ring-0 bg-transparent outline-none placeholder:text-on-surface-variant/50"
                />
                <p className="text-[10px] text-on-surface-variant font-semibold uppercase">ACT Score</p>
              </div>

              {/* TOEFL/IELTS Card */}
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  TOEFL / IELTS
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    value={form.toefl_score}
                    onChange={set('toefl_score')}
                    placeholder="112"
                    className="w-full text-2xl font-headline font-bold text-primary border-none p-0 focus:ring-0 bg-transparent outline-none"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant font-semibold uppercase">TOEFL Score</p>
                <input
                  type="number"
                  value={form.ielts_score}
                  onChange={set('ielts_score')}
                  placeholder="7.5"
                  step="0.5"
                  className="mt-2 w-full text-sm text-on-surface border-none p-0 focus:ring-0 bg-transparent outline-none placeholder:text-on-surface-variant/50"
                />
                <p className="text-[10px] text-on-surface-variant font-semibold uppercase">IELTS Score</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Field label="High School Name" field="high_school_name" placeholder="Search school database..." form={form} onChange={setInput} />
              <Field label="High School Country" field="high_school_country" placeholder="e.g. United States" form={form} onChange={setInput} />
              <Field label="Graduation Year" field="graduation_year" type="number" placeholder="2025" form={form} onChange={setInput} />
              <Field label="GPA Scale" field="gpa_scale" type="number" placeholder="4.0" form={form} onChange={setInput} />
            </div>
          </section>

          {/* Section: Enrollment Strategy */}
          <section className="bg-surface-container-low rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary">target</span>
              <h3 className="font-headline font-bold text-xl text-primary">Enrollment Strategy</h3>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className={labelClass}>Application Type</label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'freshman', label: 'Freshman (First Year)' },
                    { value: 'transfer', label: 'Transfer Student' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-4 bg-surface-container-lowest rounded-xl cursor-pointer border-2 transition-all ${form.application_type === opt.value ? 'border-primary' : 'border-transparent hover:border-primary/20'}`}
                    >
                      <input
                        type="radio"
                        name="application_type"
                        value={opt.value}
                        checked={form.application_type === opt.value}
                        onChange={set('application_type')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-semibold text-on-surface">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <Field label="Application Season" field="season" placeholder="e.g. 2024-25" form={form} onChange={setInput} />
                <Field label="Intended Major" field="intended_major" placeholder="e.g. Computer Science" form={form} onChange={setInput} />
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <label className={labelClass}>Internal Notes</label>
              <textarea
                value={form.notes}
                onChange={set('notes')}
                rows={4}
                placeholder="Internal notes about this student..."
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10 outline-none transition-all text-on-surface resize-none placeholder:text-on-surface-variant/50"
              />
            </div>
          </section>

          {error && (
            <div className="bg-error-container/30 border border-error/20 rounded-xl px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-green-600 text-lg">verified_user</span>
              <span className="text-xs font-medium">Data is saved on submission</span>
            </div>
            <div className="flex gap-4">
              <Link
                href="/students"
                className="px-8 py-3 bg-surface-container-high text-primary font-bold rounded-xl text-sm hover:bg-surface-dim transition-all"
              >
                Discard Draft
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3 text-white font-headline font-extrabold rounded-xl text-sm shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
              >
                <span>{loading ? 'Creating…' : 'Create Student Profile'}</span>
                {!loading && <span className="material-symbols-outlined text-lg">chevron_right</span>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
