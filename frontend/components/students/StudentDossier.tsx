'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────
type Student = Record<string, any>

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputCls = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all'
const labelCls = 'block text-[10px] font-semibold uppercase tracking-[0.5px] text-gray-400 mb-1'
const valCls   = 'text-[13px] text-gray-900 min-h-[20px]'
const emptyCls = 'text-[13px] text-gray-300 italic'

// ─── Field components ─────────────────────────────────────────────────────────
function DisplayField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className={labelCls}>{label}</p>
      <p className={value != null && value !== '' ? valCls : emptyCls}>
        {value != null && value !== '' ? String(value) : '—'}
      </p>
    </div>
  )
}

function EditField({
  label, field, type = 'text', placeholder = '', form, onChange,
}: {
  label: string; field: string; type?: string; placeholder?: string
  form: Record<string, string>; onChange: (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input type={type} value={form[field] ?? ''} onChange={onChange(field) as any} placeholder={placeholder} className={inputCls} />
    </div>
  )
}

// ─── Section wrapper with Edit / Save / Cancel ────────────────────────────────
function Section({
  title, icon, hint, editing, onEdit, onSave, onCancel, saving, children,
}: {
  title: string; icon: string; hint?: string
  editing: boolean; onEdit: () => void; onSave: () => void; onCancel: () => void; saving: boolean
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0"
            style={{ background: 'rgba(29,158,117,0.08)' }}>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-gray-900">{title}</h3>
            {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
          </div>
        </div>
        {!editing ? (
          <button onClick={onEdit}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-gray-50">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={onCancel}
              className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={onSave} disabled={saving}
              className="flex items-center gap-1 text-[11px] font-bold text-white px-3 py-1.5 rounded-lg disabled:opacity-60 transition-all"
              style={{ background: '#1D9E75' }}>
              {saving
                ? <span className="material-symbols-outlined animate-spin" style={{ fontSize: 13 }}>progress_activity</span>
                : <span className="material-symbols-outlined" style={{ fontSize: 13 }}>check</span>}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

// ─── Main dossier component ───────────────────────────────────────────────────
export default function StudentDossier({ student }: { student: Student }) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})

  // Open a section for editing
  const startEdit = (section: string, fields: Record<string, string>) => {
    setActiveSection(section)
    setDraft(fields)
  }

  const cancelEdit = () => { setActiveSection(null); setDraft({}) }

  const saveSection = async (fields: Record<string, string | number | null>) => {
    setSaving(true)
    try {
      await apiFetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      })
      router.refresh()
      setActiveSection(null)
      setDraft({})
    } catch (err) {
      alert((err as Error).message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const setField = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft(prev => ({ ...prev, [f]: e.target.value }))

  const isEditing = (s: string) => activeSection === s

  // ── Prepare payload helpers ──────────────────────────────────────────────
  const str = (f: string) => draft[f] || null
  const num = (f: string) => draft[f] ? Number(draft[f]) : null
  const bool = (f: string) => draft[f] === 'true'

  return (
    <div className="space-y-4">

      {/* ── 1. Personal Identity ─────────────────────────────────────── */}
      <Section
        title="Personal Identity" icon="person"
        hint="Common App: Personal Information"
        editing={isEditing('personal')}
        onEdit={() => startEdit('personal', {
          full_name: student.full_name ?? '',
          preferred_name: student.preferred_name ?? '',
          date_of_birth: student.date_of_birth ?? '',
          nationality: student.nationality ?? '',
          gender: student.gender ?? '',
          pronouns: student.pronouns ?? '',
          city_of_birth: student.city_of_birth ?? '',
          country_of_birth: student.country_of_birth ?? '',
          email: student.email ?? '',
          phone: student.phone ?? '',
          telegram_username: student.telegram_username ?? '',
          visa_status: student.visa_status ?? '',
          languages_at_home: student.languages_at_home ?? '',
        })}
        onCancel={cancelEdit}
        onSave={() => saveSection({
          full_name: str('full_name'), preferred_name: str('preferred_name'),
          date_of_birth: str('date_of_birth'), nationality: str('nationality'),
          gender: str('gender'), pronouns: str('pronouns'),
          city_of_birth: str('city_of_birth'), country_of_birth: str('country_of_birth'),
          email: str('email'), phone: str('phone'), telegram_username: str('telegram_username'),
          visa_status: str('visa_status'), languages_at_home: str('languages_at_home'),
        })}
        saving={saving}
      >
        {isEditing('personal') ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <EditField label="Legal Full Name *" field="full_name" placeholder="Amir Tashmatov" form={draft} onChange={setField} />
            <EditField label="Preferred / Common Name" field="preferred_name" placeholder="Amir" form={draft} onChange={setField} />
            <EditField label="Date of Birth" field="date_of_birth" type="date" form={draft} onChange={setField} />
            <EditField label="Nationality / Citizenship" field="nationality" placeholder="Uzbekistan" form={draft} onChange={setField} />
            <EditField label="City of Birth" field="city_of_birth" placeholder="Tashkent" form={draft} onChange={setField} />
            <EditField label="Country of Birth" field="country_of_birth" placeholder="Uzbekistan" form={draft} onChange={setField} />
            <EditField label="Gender" field="gender" placeholder="e.g. Male / Female / Non-binary" form={draft} onChange={setField} />
            <EditField label="Pronouns (optional)" field="pronouns" placeholder="e.g. he/him" form={draft} onChange={setField} />
            <EditField label="Email" field="email" type="email" placeholder="student@example.com" form={draft} onChange={setField} />
            <EditField label="Phone" field="phone" placeholder="+998 90 000 00 00" form={draft} onChange={setField} />
            <EditField label="Telegram" field="telegram_username" placeholder="@username" form={draft} onChange={setField} />
            <EditField label="Visa Status" field="visa_status" placeholder="e.g. F-1, None" form={draft} onChange={setField} />
            <div className="col-span-2">
              <EditField label="Primary Language at Home" field="languages_at_home" placeholder="e.g. Uzbek" form={draft} onChange={setField} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <DisplayField label="Legal Full Name" value={student.full_name} />
            <DisplayField label="Preferred Name" value={student.preferred_name} />
            <DisplayField label="Date of Birth" value={student.date_of_birth} />
            <DisplayField label="Nationality" value={student.nationality} />
            <DisplayField label="City of Birth" value={student.city_of_birth} />
            <DisplayField label="Country of Birth" value={student.country_of_birth} />
            <DisplayField label="Gender" value={student.gender} />
            <DisplayField label="Pronouns" value={student.pronouns} />
            <DisplayField label="Visa Status" value={student.visa_status} />
            <DisplayField label="Email" value={student.email} />
            <DisplayField label="Phone" value={student.phone} />
            <DisplayField label="Telegram" value={student.telegram_username} />
            <DisplayField label="Language at Home" value={student.languages_at_home} />
          </div>
        )}
      </Section>

      {/* ── 2. Address & Passport ────────────────────────────────────── */}
      <Section
        title="Address & Passport" icon="travel_explore"
        hint="Permanent address + passport details"
        editing={isEditing('address')}
        onEdit={() => startEdit('address', {
          address_street: student.address_street ?? '',
          address_city: student.address_city ?? '',
          address_country: student.address_country ?? '',
          address_zip: student.address_zip ?? '',
          passport_number: student.passport_number ?? '',
          passport_expiry: student.passport_expiry ?? '',
          languages: Array.isArray(student.languages) ? student.languages.join(', ') : '',
        })}
        onCancel={cancelEdit}
        onSave={() => saveSection({
          address_street: str('address_street'), address_city: str('address_city'),
          address_country: str('address_country'), address_zip: str('address_zip'),
          passport_number: str('passport_number'), passport_expiry: str('passport_expiry'),
          languages: (draft.languages || '').split(',').map((l: string) => l.trim()).filter(Boolean),
        })}
        saving={saving}
      >
        {isEditing('address') ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="col-span-2">
              <EditField label="Street Address" field="address_street" placeholder="123 Main St" form={draft} onChange={setField} />
            </div>
            <EditField label="City" field="address_city" placeholder="Tashkent" form={draft} onChange={setField} />
            <EditField label="Country" field="address_country" placeholder="Uzbekistan" form={draft} onChange={setField} />
            <EditField label="Zip / Postal Code" field="address_zip" placeholder="100000" form={draft} onChange={setField} />
            <EditField label="Passport Number" field="passport_number" placeholder="AA1234567" form={draft} onChange={setField} />
            <EditField label="Passport Expiry" field="passport_expiry" type="date" form={draft} onChange={setField} />
            <div className="col-span-2">
              <label className={labelCls}>Languages Spoken (comma-separated)</label>
              <input type="text" value={draft.languages ?? ''} onChange={e => setDraft(p => ({ ...p, languages: e.target.value }))}
                placeholder="e.g. Uzbek, Russian, English" className={inputCls} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <DisplayField label="Street" value={student.address_street} />
            <DisplayField label="City" value={student.address_city} />
            <DisplayField label="Country" value={student.address_country} />
            <DisplayField label="Zip Code" value={student.address_zip} />
            <DisplayField label="Passport Number" value={student.passport_number} />
            <DisplayField label="Passport Expiry" value={student.passport_expiry} />
            <div className="col-span-3">
              <p className={labelCls}>Languages Spoken</p>
              <p className={valCls}>
                {Array.isArray(student.languages) && student.languages.length > 0
                  ? student.languages.join(', ')
                  : <span className={emptyCls}>—</span>}
              </p>
            </div>
          </div>
        )}
      </Section>

      {/* ── 3. Family ────────────────────────────────────────────────── */}
      <Section
        title="Family Background" icon="family_restroom"
        hint="Common App: Family section"
        editing={isEditing('family')}
        onEdit={() => startEdit('family', {
          father_name: student.father_name ?? '',
          father_email: student.father_email ?? '',
          father_phone: student.father_phone ?? '',
          father_education: student.father_education ?? '',
          father_occupation: student.father_occupation ?? '',
          father_employer: student.father_employer ?? '',
          mother_name: student.mother_name ?? '',
          mother_email: student.mother_email ?? '',
          mother_phone: student.mother_phone ?? '',
          mother_education: student.mother_education ?? '',
          mother_occupation: student.mother_occupation ?? '',
          mother_employer: student.mother_employer ?? '',
          parents_marital_status: student.parents_marital_status ?? '',
          first_generation_student: student.first_generation_student ? 'true' : 'false',
        })}
        onCancel={cancelEdit}
        onSave={() => saveSection({
          father_name: str('father_name'), father_email: str('father_email'), father_phone: str('father_phone'),
          father_education: str('father_education'), father_occupation: str('father_occupation'), father_employer: str('father_employer'),
          mother_name: str('mother_name'), mother_email: str('mother_email'), mother_phone: str('mother_phone'),
          mother_education: str('mother_education'), mother_occupation: str('mother_occupation'), mother_employer: str('mother_employer'),
          parents_marital_status: str('parents_marital_status'),
          first_generation_student: bool('first_generation_student'),
        })}
        saving={saving}
      >
        {isEditing('family') ? (
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Father</p>
              <div className="grid grid-cols-3 gap-x-5 gap-y-3">
                <EditField label="Full Name" field="father_name" placeholder="Behzod Tashmatov" form={draft} onChange={setField} />
                <EditField label="Email" field="father_email" type="email" placeholder="father@example.com" form={draft} onChange={setField} />
                <EditField label="Phone" field="father_phone" placeholder="+998 90 000 00 00" form={draft} onChange={setField} />
                <EditField label="Education Level" field="father_education" placeholder="e.g. Bachelor's" form={draft} onChange={setField} />
                <EditField label="Occupation" field="father_occupation" placeholder="e.g. Engineer" form={draft} onChange={setField} />
                <EditField label="Employer" field="father_employer" placeholder="e.g. Gazprom" form={draft} onChange={setField} />
              </div>
            </div>
            <div className="border-t border-gray-50 pt-5">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Mother</p>
              <div className="grid grid-cols-3 gap-x-5 gap-y-3">
                <EditField label="Full Name" field="mother_name" placeholder="Malika Tashmatova" form={draft} onChange={setField} />
                <EditField label="Email" field="mother_email" type="email" placeholder="mother@example.com" form={draft} onChange={setField} />
                <EditField label="Phone" field="mother_phone" placeholder="+998 90 000 00 00" form={draft} onChange={setField} />
                <EditField label="Education Level" field="mother_education" placeholder="e.g. Master's" form={draft} onChange={setField} />
                <EditField label="Occupation" field="mother_occupation" placeholder="e.g. Doctor" form={draft} onChange={setField} />
                <EditField label="Employer" field="mother_employer" placeholder="e.g. City Hospital" form={draft} onChange={setField} />
              </div>
            </div>
            <div className="border-t border-gray-50 pt-5 grid grid-cols-2 gap-x-5 gap-y-3">
              <EditField label="Parents' Marital Status" field="parents_marital_status" placeholder="e.g. Married" form={draft} onChange={setField} />
              <div>
                <label className={labelCls}>First-Generation College Student?</label>
                <select value={draft.first_generation_student ?? 'false'} onChange={setField('first_generation_student') as any} className={inputCls}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Father</p>
              <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                <DisplayField label="Name" value={student.father_name} />
                <DisplayField label="Email" value={student.father_email} />
                <DisplayField label="Phone" value={student.father_phone} />
                <DisplayField label="Education" value={student.father_education} />
                <DisplayField label="Occupation" value={student.father_occupation} />
                <DisplayField label="Employer" value={student.father_employer} />
              </div>
            </div>
            <div className="border-t border-gray-50 pt-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Mother</p>
              <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                <DisplayField label="Name" value={student.mother_name} />
                <DisplayField label="Email" value={student.mother_email} />
                <DisplayField label="Phone" value={student.mother_phone} />
                <DisplayField label="Education" value={student.mother_education} />
                <DisplayField label="Occupation" value={student.mother_occupation} />
                <DisplayField label="Employer" value={student.mother_employer} />
              </div>
            </div>
            <div className="border-t border-gray-50 pt-4 grid grid-cols-3 gap-x-6 gap-y-3">
              <DisplayField label="Marital Status" value={student.parents_marital_status} />
              <DisplayField label="First-Generation" value={student.first_generation_student ? 'Yes' : null} />
            </div>
          </div>
        )}
      </Section>

      {/* ── 4. Academic Record ────────────────────────────────────────── */}
      <Section
        title="Academic Record" icon="menu_book"
        hint="Common App: Education section"
        editing={isEditing('academic')}
        onEdit={() => startEdit('academic', {
          high_school_name: student.high_school_name ?? '',
          high_school_country: student.high_school_country ?? '',
          school_ceeb_code: student.school_ceeb_code ?? '',
          school_type: student.school_type ?? '',
          school_city: student.school_city ?? '',
          graduation_year: student.graduation_year?.toString() ?? '',
          gpa: student.gpa?.toString() ?? '',
          gpa_scale: student.gpa_scale?.toString() ?? '4.0',
          class_rank: student.class_rank ?? '',
          class_size: student.class_size?.toString() ?? '',
          intended_major: student.intended_major ?? '',
          application_type: student.application_type ?? 'freshman',
          season: student.season ?? '',
        })}
        onCancel={cancelEdit}
        onSave={() => saveSection({
          high_school_name: str('high_school_name'), high_school_country: str('high_school_country'),
          school_ceeb_code: str('school_ceeb_code'), school_type: str('school_type'),
          school_city: str('school_city'), graduation_year: num('graduation_year'),
          gpa: num('gpa'), gpa_scale: num('gpa_scale') ?? 4.0,
          class_rank: str('class_rank'), class_size: num('class_size'),
          intended_major: str('intended_major'), application_type: str('application_type'),
          season: str('season'),
        })}
        saving={saving}
      >
        {isEditing('academic') ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="col-span-2">
              <EditField label="High School Name" field="high_school_name" placeholder="Tashkent International School" form={draft} onChange={setField} />
            </div>
            <EditField label="City" field="school_city" placeholder="Tashkent" form={draft} onChange={setField} />
            <EditField label="Country" field="high_school_country" placeholder="Uzbekistan" form={draft} onChange={setField} />
            <EditField label="CEEB Code" field="school_ceeb_code" placeholder="6-digit code" form={draft} onChange={setField} />
            <div>
              <label className={labelCls}>School Type</label>
              <select value={draft.school_type ?? ''} onChange={setField('school_type') as any} className={inputCls}>
                <option value="">— Select —</option>
                {['Public', 'Private', 'International', 'Home School', 'Religious'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <EditField label="Graduation Year" field="graduation_year" type="number" placeholder="2025" form={draft} onChange={setField} />
            <EditField label="GPA" field="gpa" type="number" placeholder="3.85" form={draft} onChange={setField} />
            <div>
              <label className={labelCls}>GPA Scale</label>
              <select value={draft.gpa_scale ?? '4.0'} onChange={setField('gpa_scale') as any} className={inputCls}>
                {['4.0', '5.0', '10.0', '100'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <EditField label="Class Rank" field="class_rank" placeholder="e.g. 5" form={draft} onChange={setField} />
            <EditField label="Class Size" field="class_size" type="number" placeholder="120" form={draft} onChange={setField} />
            <EditField label="Intended Major" field="intended_major" placeholder="e.g. Computer Science" form={draft} onChange={setField} />
            <div>
              <label className={labelCls}>Application Type</label>
              <select value={draft.application_type ?? 'freshman'} onChange={setField('application_type') as any} className={inputCls}>
                {['freshman', 'transfer', 'graduate'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <EditField label="Application Season" field="season" placeholder="2025-26" form={draft} onChange={setField} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <div className="col-span-3">
              <DisplayField label="High School" value={student.high_school_name} />
            </div>
            <DisplayField label="City" value={student.school_city} />
            <DisplayField label="Country" value={student.high_school_country} />
            <DisplayField label="School Type" value={student.school_type} />
            <DisplayField label="CEEB Code" value={student.school_ceeb_code} />
            <DisplayField label="Graduation Year" value={student.graduation_year} />
            <DisplayField label="GPA" value={student.gpa != null ? `${student.gpa} / ${student.gpa_scale ?? 4.0}` : null} />
            <DisplayField label="Class Rank" value={student.class_rank && student.class_size ? `${student.class_rank} of ${student.class_size}` : student.class_rank} />
            <DisplayField label="Intended Major" value={student.intended_major} />
            <DisplayField label="Application Type" value={student.application_type} />
            <DisplayField label="Season" value={student.season} />
          </div>
        )}
      </Section>

      {/* ── 5. Test Scores ────────────────────────────────────────────── */}
      <Section
        title="Test Scores" icon="assignment"
        hint="Common App: Testing section"
        editing={isEditing('scores')}
        onEdit={() => startEdit('scores', {
          sat_total: student.sat_total?.toString() ?? '',
          sat_math: student.sat_math?.toString() ?? '',
          sat_reading: student.sat_reading?.toString() ?? '',
          sat_essay: student.sat_essay?.toString() ?? '',
          act_score: student.act_score?.toString() ?? '',
          act_english: student.act_english?.toString() ?? '',
          act_math: student.act_math?.toString() ?? '',
          act_reading: student.act_reading?.toString() ?? '',
          act_science: student.act_science?.toString() ?? '',
          toefl_score: student.toefl_score?.toString() ?? '',
          ielts_score: student.ielts_score?.toString() ?? '',
          duolingo_score: student.duolingo_score?.toString() ?? '',
        })}
        onCancel={cancelEdit}
        onSave={() => saveSection({
          sat_total: num('sat_total'), sat_math: num('sat_math'), sat_reading: num('sat_reading'), sat_essay: num('sat_essay'),
          act_score: num('act_score'), act_english: num('act_english'), act_math: num('act_math'),
          act_reading: num('act_reading'), act_science: num('act_science'),
          toefl_score: num('toefl_score'), ielts_score: num('ielts_score'), duolingo_score: num('duolingo_score'),
        })}
        saving={saving}
      >
        {isEditing('scores') ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            {/* SAT */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">SAT</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <EditField label="Total" field="sat_total" type="number" placeholder="1540" form={draft} onChange={setField} />
                <EditField label="Essay" field="sat_essay" type="number" placeholder="16" form={draft} onChange={setField} />
                <EditField label="Math" field="sat_math" type="number" placeholder="780" form={draft} onChange={setField} />
                <EditField label="Reading & Writing" field="sat_reading" type="number" placeholder="760" form={draft} onChange={setField} />
              </div>
            </div>
            {/* ACT */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">ACT</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <EditField label="Composite" field="act_score" type="number" placeholder="34" form={draft} onChange={setField} />
                <EditField label="English" field="act_english" type="number" placeholder="35" form={draft} onChange={setField} />
                <EditField label="Math" field="act_math" type="number" placeholder="34" form={draft} onChange={setField} />
                <EditField label="Reading" field="act_reading" type="number" placeholder="35" form={draft} onChange={setField} />
                <EditField label="Science" field="act_science" type="number" placeholder="33" form={draft} onChange={setField} />
              </div>
            </div>
            {/* English Proficiency */}
            <div className="col-span-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">English Proficiency</p>
              <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                <EditField label="TOEFL" field="toefl_score" type="number" placeholder="112" form={draft} onChange={setField} />
                <EditField label="IELTS" field="ielts_score" type="number" placeholder="7.5" form={draft} onChange={setField} />
                <EditField label="Duolingo" field="duolingo_score" type="number" placeholder="135" form={draft} onChange={setField} />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-x-6 gap-y-1">
            {/* SAT */}
            <div className="col-span-4 mb-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">SAT</p>
            </div>
            <DisplayField label="Total" value={student.sat_total} />
            <DisplayField label="Math" value={student.sat_math} />
            <DisplayField label="Reading" value={student.sat_reading} />
            <DisplayField label="Essay" value={student.sat_essay} />
            {/* ACT */}
            <div className="col-span-4 mt-3 mb-1 border-t border-gray-50 pt-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">ACT</p>
            </div>
            <DisplayField label="Composite" value={student.act_score} />
            <DisplayField label="English" value={student.act_english} />
            <DisplayField label="Math" value={student.act_math} />
            <DisplayField label="Reading" value={student.act_reading} />
            <DisplayField label="Science" value={student.act_science} />
            {/* English */}
            <div className="col-span-4 mt-3 mb-1 border-t border-gray-50 pt-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">English Proficiency</p>
            </div>
            <DisplayField label="TOEFL" value={student.toefl_score} />
            <DisplayField label="IELTS" value={student.ielts_score} />
            <DisplayField label="Duolingo" value={student.duolingo_score} />
          </div>
        )}
      </Section>

      {/* ── 6. Teacher Recommendation Info ───────────────────────────── */}
      <TeacherRecSection student={student} onSave={async (payload) => {
        setSaving(true)
        try {
          await apiFetch(`/api/students/${student.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
          router.refresh()
        } catch (err) { alert((err as Error).message) }
        finally { setSaving(false) }
      }} saving={saving} />

      {/* ── 7. Counselor Notes ────────────────────────────────────────── */}
      <Section
        title="Counselor Context" icon="record_voice_over"
        hint="Notes the AI uses to write the counselor recommendation"
        editing={isEditing('counselor')}
        onEdit={() => startEdit('counselor', { counselor_notes: student.counselor_notes ?? '' })}
        onCancel={cancelEdit}
        onSave={() => saveSection({ counselor_notes: str('counselor_notes') })}
        saving={saving}
      >
        {isEditing('counselor') ? (
          <div>
            <label className={labelCls}>Counselor Notes</label>
            <textarea
              value={draft.counselor_notes ?? ''}
              onChange={e => setDraft(p => ({ ...p, counselor_notes: e.target.value }))}
              rows={6}
              placeholder="Describe the student's relationship with their counselor, academic standing, personal challenges, growth, community involvement, and any context the counselor should highlight in their letter…"
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none"
            />
          </div>
        ) : (
          <div>
            {student.counselor_notes
              ? <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">{student.counselor_notes}</p>
              : <p className={emptyCls}>No counselor context added yet. This is used by the AI to generate the counselor recommendation letter.</p>
            }
          </div>
        )}
      </Section>

      {/* ── 8. Internal Notes ────────────────────────────────────────── */}
      <Section
        title="Internal Notes" icon="sticky_note_2"
        hint="Private notes visible only to your team"
        editing={isEditing('notes')}
        onEdit={() => startEdit('notes', { notes: student.notes ?? '' })}
        onCancel={cancelEdit}
        onSave={() => saveSection({ notes: str('notes') })}
        saving={saving}
      >
        {isEditing('notes') ? (
          <textarea
            value={draft.notes ?? ''}
            onChange={e => setDraft(p => ({ ...p, notes: e.target.value }))}
            rows={4}
            placeholder="Internal notes about this student…"
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none"
          />
        ) : (
          <p className={student.notes ? 'text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed' : emptyCls}>
            {student.notes || 'No internal notes.'}
          </p>
        )}
      </Section>

    </div>
  )
}

// ─── Teacher Rec Section (separate state since it manages a list) ─────────────
function TeacherRecSection({
  student, onSave, saving,
}: {
  student: Student
  onSave: (payload: Record<string, any>) => Promise<void>
  saving: boolean
}) {
  const [editing, setEditing] = useState(false)
  const defaultTeacher = () => ({ name: '', email: '', subject: '', class_year: '', relationship_notes: '', highlights: '' })
  const [teachers, setTeachers] = useState<ReturnType<typeof defaultTeacher>[]>(
    () => (Array.isArray(student.teacher_rec_info) && student.teacher_rec_info.length > 0)
      ? student.teacher_rec_info
      : [defaultTeacher(), defaultTeacher()]
  )

  const setT = (i: number, f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTeachers(prev => prev.map((t, idx) => idx === i ? { ...t, [f]: e.target.value } : t))
  }

  const inputCls = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all'
  const labelCls = 'block text-[10px] font-semibold uppercase tracking-[0.5px] text-gray-400 mb-1'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(29,158,117,0.08)' }}>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>rate_review</span>
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-gray-900">Teacher Recommendation Info</h3>
            <p className="text-[11px] text-gray-400">AI uses this to draft teacher rec prompts</p>
          </div>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-gray-50">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(false)} className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={async () => { await onSave({ teacher_rec_info: teachers }); setEditing(false) }}
              disabled={saving}
              className="flex items-center gap-1 text-[11px] font-bold text-white px-3 py-1.5 rounded-lg disabled:opacity-60"
              style={{ background: '#1D9E75' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>check</span>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>
      <div className="px-6 py-5">
        {editing ? (
          <div className="space-y-6">
            {teachers.map((t, i) => (
              <div key={i} className={i > 0 ? 'border-t border-gray-50 pt-6' : ''}>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">Teacher {i + 1}</p>
                <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                  <div>
                    <label className={labelCls}>Full Name</label>
                    <input value={t.name} onChange={setT(i, 'name')} placeholder="e.g. Sarah Johnson" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" value={t.email} onChange={setT(i, 'email')} placeholder="teacher@school.edu" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Subject / Class</label>
                    <input value={t.subject} onChange={setT(i, 'subject')} placeholder="e.g. AP Chemistry (11th grade)" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Class Year</label>
                    <input value={t.class_year} onChange={setT(i, 'class_year')} placeholder="e.g. 11th grade, 2023-24" className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Relationship Notes</label>
                    <textarea value={t.relationship_notes} onChange={setT(i, 'relationship_notes')} rows={2}
                      placeholder="How does the student know this teacher? Any notable moments or projects together?"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>What Should They Highlight?</label>
                    <textarea value={t.highlights} onChange={setT(i, 'highlights')} rows={2}
                      placeholder="Specific achievements, skills, or qualities this teacher can vouch for…"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => setTeachers(p => [...p, defaultTeacher()])}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
              Add another teacher
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {(Array.isArray(student.teacher_rec_info) && student.teacher_rec_info.length > 0)
              ? student.teacher_rec_info.map((t: any, i: number) => (
                <div key={i} className={i > 0 ? 'border-t border-gray-50 pt-4' : ''}>
                  <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                    <div><p className="block text-[10px] font-semibold uppercase tracking-[0.5px] text-gray-400 mb-1">Teacher {i + 1}</p><p className="text-[13px] text-gray-900">{t.name || '—'}</p></div>
                    <div><p className="block text-[10px] font-semibold uppercase tracking-[0.5px] text-gray-400 mb-1">Email</p><p className="text-[13px] text-gray-900">{t.email || '—'}</p></div>
                    <div><p className="block text-[10px] font-semibold uppercase tracking-[0.5px] text-gray-400 mb-1">Subject</p><p className="text-[13px] text-gray-900">{t.subject || '—'}</p></div>
                    {t.highlights && <div className="col-span-3"><p className="block text-[10px] font-semibold uppercase tracking-[0.5px] text-gray-400 mb-1">Highlights</p><p className="text-[13px] text-gray-700">{t.highlights}</p></div>}
                  </div>
                </div>
              ))
              : <p className="text-[13px] text-gray-300 italic">No teacher info added yet. Add at least 2 teachers for Common App.</p>
            }
          </div>
        )}
      </div>
    </div>
  )
}
