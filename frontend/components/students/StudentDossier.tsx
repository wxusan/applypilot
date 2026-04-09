'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'

type Student = Record<string, any>

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputCls = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all'
const inputErrCls = 'w-full bg-white border border-red-300 rounded-lg px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all'
const labelCls = 'block text-[10px] font-semibold uppercase tracking-[0.5px] text-gray-400 mb-1'
const labelReqCls = 'block text-[10px] font-semibold uppercase tracking-[0.5px] text-gray-600 mb-1'

// ─── Required fields per section (used for completion tracking + validation) ──
const REQUIRED: Record<string, string[]> = {
  personal:   ['full_name', 'date_of_birth', 'nationality'],
  address:    ['address_country', 'passport_number'],
  family:     ['father_name', 'mother_name'],
  academic:   ['high_school_name', 'graduation_year', 'gpa'],
  scores:     [],   // at least one score — validated manually
  ap_ib:      [],   // optional section
  activities: [],   // at least one activity — validated manually
  teachers:   [],   // validated in TeacherRecSection
  counselor:  [],
  notes:      [],
}

// Check if a section is complete given the student object
function isSectionComplete(section: string, student: Student): boolean {
  const req = REQUIRED[section]
  if (!req.length) {
    if (section === 'scores')     return !!(student.sat_total || student.act_score || student.toefl_score || student.ielts_score)
    if (section === 'ap_ib')      return (Array.isArray(student.ap_scores) && student.ap_scores.length > 0) || (Array.isArray(student.ib_scores) && student.ib_scores.length > 0)
    if (section === 'activities') return Array.isArray(student.activities) && student.activities.length > 0
    if (section === 'teachers')   return Array.isArray(student.teacher_rec_info) && student.teacher_rec_info.some((t: any) => t.name && t.email)
    return true
  }
  return req.every(f => student[f] != null && student[f] !== '')
}

// ─── Field components ─────────────────────────────────────────────────────────
function DisplayField({ label, value, required }: { label: string; value?: string | number | null; required?: boolean }) {
  const empty = value == null || value === ''
  return (
    <div>
      <p className={required ? labelReqCls : labelCls}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </p>
      <p className={empty ? 'text-[13px] text-gray-300 italic' : 'text-[13px] text-gray-900'}>
        {empty ? '—' : String(value)}
      </p>
    </div>
  )
}

function EditField({
  label, field, type = 'text', placeholder = '', form, onChange, required, error,
}: {
  label: string; field: string; type?: string; placeholder?: string
  form: Record<string, string>; onChange: (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  required?: boolean; error?: boolean
}) {
  return (
    <div>
      <label className={required ? labelReqCls : labelCls}>
        {label}{required && <span className="text-red-400 ml-0.5"> *</span>}
        {!required && <span className="text-gray-300 ml-1 normal-case font-normal tracking-normal">(optional)</span>}
      </label>
      <input
        type={type}
        value={form[field] ?? ''}
        onChange={onChange(field) as any}
        placeholder={placeholder}
        className={error ? inputErrCls : inputCls}
      />
      {error && <p className="text-[11px] text-red-500 mt-0.5">This field is required</p>}
    </div>
  )
}

// ─── Section completion badge ─────────────────────────────────────────────────
function CompletionBadge({ complete }: { complete: boolean }) {
  if (complete) return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
      <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
      Complete
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>pending</span>
      Incomplete
    </span>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  id, title, icon, hint, editing, onEdit, onSave, onCancel, saving, complete, children,
}: {
  id: string; title: string; icon: string; hint?: string
  editing: boolean; onEdit: () => void; onSave: () => void; onCancel: () => void; saving: boolean
  complete: boolean; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(29,158,117,0.08)' }}>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-bold text-gray-900">{title}</h3>
              <CompletionBadge complete={complete} />
            </div>
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
                ? <span className="material-symbols-outlined" style={{ fontSize: 13 }}>progress_activity</span>
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

// ─── Progress overview ────────────────────────────────────────────────────────
function DossierProgress({ student }: { student: Student }) {
  const sections = [
    { id: 'personal',   label: 'Identity' },
    { id: 'address',    label: 'Passport' },
    { id: 'family',     label: 'Family' },
    { id: 'academic',   label: 'Academic' },
    { id: 'scores',     label: 'Scores' },
    { id: 'activities', label: 'Activities' },
    { id: 'teachers',   label: 'Teachers' },
  ]
  const done = sections.filter(s => isSectionComplete(s.id, student)).length
  const pct = Math.round((done / sections.length) * 100)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[13px] font-bold text-gray-900">Student Dossier</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Fill this in — our AI will handle Common App automatically based on what's here.
            <span className="text-amber-600 font-semibold"> Fields left blank won't be filled on Common App.</span>
          </p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-[22px] font-bold text-gray-900">{pct}<span className="text-[14px] text-gray-400">%</span></p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{done}/{sections.length} sections</p>
        </div>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-3 mt-3 flex-wrap">
        {sections.map(s => {
          const ok = isSectionComplete(s.id, student)
          return (
            <span key={s.id} className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${ok ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: ok ? "'FILL' 1" : "'FILL' 0" }}>
                {ok ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              {s.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main dossier ─────────────────────────────────────────────────────────────
export default function StudentDossier({ student }: { student: Student }) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const startEdit = (section: string, fields: Record<string, string>) => {
    setActiveSection(section)
    setDraft(fields)
    setFieldErrors({})
  }
  const cancelEdit = () => { setActiveSection(null); setDraft({}); setFieldErrors({}) }

  const validate = (section: string, current: Record<string, string>): boolean => {
    const req = REQUIRED[section] ?? []
    const errors: Record<string, boolean> = {}
    req.forEach(f => { if (!current[f]?.trim()) errors[f] = true })
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const saveSection = async (section: string, fields: Record<string, any>) => {
    if (!validate(section, draft)) return
    setSaving(true)
    try {
      await apiFetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      })
      router.refresh()
      setActiveSection(null)
      setDraft({})
      setFieldErrors({})
    } catch (err) {
      showToast((err as Error).message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const setField = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDraft(prev => ({ ...prev, [f]: e.target.value }))
    if (fieldErrors[f]) setFieldErrors(prev => ({ ...prev, [f]: false }))
  }

  const isEditing = (s: string) => activeSection === s
  const str = (f: string) => draft[f] || null
  const num = (f: string) => draft[f] ? Number(draft[f]) : null
  const bool = (f: string) => draft[f] === 'true'

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-xl text-white text-[13px] font-semibold shadow-xl ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <DossierProgress student={student} />

      {/* ── 1. Personal Identity ─────────────────────────────────────────── */}
      <Section
        id="personal" title="Personal Identity" icon="person"
        hint="Name, date of birth, contact info"
        complete={isSectionComplete('personal', student)}
        editing={isEditing('personal')}
        onEdit={() => startEdit('personal', {
          full_name: student.full_name ?? '',
          preferred_name: student.preferred_name ?? '',
          date_of_birth: student.date_of_birth ?? '',
          nationality: student.nationality ?? '',
          gender: student.gender ?? '',
          city_of_birth: student.city_of_birth ?? '',
          country_of_birth: student.country_of_birth ?? '',
          email: student.email ?? '',
          phone: student.phone ?? '',
          telegram_username: student.telegram_username ?? '',
          visa_status: student.visa_status ?? '',
          languages_at_home: student.languages_at_home ?? '',
        })}
        onCancel={cancelEdit}
        onSave={() => saveSection('personal', {
          full_name: str('full_name'), preferred_name: str('preferred_name'),
          date_of_birth: str('date_of_birth'), nationality: str('nationality'),
          gender: str('gender'),
          city_of_birth: str('city_of_birth'), country_of_birth: str('country_of_birth'),
          email: str('email'), phone: str('phone'),
          telegram_username: str('telegram_username'),
          visa_status: str('visa_status'), languages_at_home: str('languages_at_home'),
        })}
        saving={saving}
      >
        {isEditing('personal') ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <EditField label="Full Legal Name" field="full_name" placeholder="Amir Tashmatov" form={draft} onChange={setField} required error={fieldErrors.full_name} />
            <EditField label="Preferred / Nickname" field="preferred_name" placeholder="Amir" form={draft} onChange={setField} />
            <EditField label="Date of Birth" field="date_of_birth" type="date" form={draft} onChange={setField} required error={fieldErrors.date_of_birth} />
            <EditField label="Nationality" field="nationality" placeholder="Uzbekistan" form={draft} onChange={setField} required error={fieldErrors.nationality} />
            <EditField label="City of Birth" field="city_of_birth" placeholder="Tashkent" form={draft} onChange={setField} />
            <EditField label="Country of Birth" field="country_of_birth" placeholder="Uzbekistan" form={draft} onChange={setField} />
            <EditField label="Gender" field="gender" placeholder="e.g. Male / Female" form={draft} onChange={setField} />
            <EditField label="Visa Status" field="visa_status" placeholder="e.g. F-1, None" form={draft} onChange={setField} />
            <EditField label="Email" field="email" type="email" placeholder="student@example.com" form={draft} onChange={setField} />
            <EditField label="Phone" field="phone" placeholder="+998 90 000 00 00" form={draft} onChange={setField} />
            <EditField label="Telegram" field="telegram_username" placeholder="@username" form={draft} onChange={setField} />
            <EditField label="Primary Language at Home" field="languages_at_home" placeholder="e.g. Uzbek" form={draft} onChange={setField} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <DisplayField label="Full Name" value={student.full_name} required />
            <DisplayField label="Preferred Name" value={student.preferred_name} />
            <DisplayField label="Date of Birth" value={student.date_of_birth} required />
            <DisplayField label="Nationality" value={student.nationality} required />
            <DisplayField label="City of Birth" value={student.city_of_birth} />
            <DisplayField label="Country of Birth" value={student.country_of_birth} />
            <DisplayField label="Gender" value={student.gender} />
            <DisplayField label="Visa Status" value={student.visa_status} />
            <DisplayField label="Language at Home" value={student.languages_at_home} />
            <DisplayField label="Email" value={student.email} />
            <DisplayField label="Phone" value={student.phone} />
            <DisplayField label="Telegram" value={student.telegram_username} />
          </div>
        )}
      </Section>

      {/* ── 2. Address & Passport ────────────────────────────────────────── */}
      <Section
        id="address" title="Address & Passport" icon="travel_explore"
        hint="Home address + passport for visa applications"
        complete={isSectionComplete('address', student)}
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
        onSave={() => saveSection('address', {
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
              <EditField label="Street Address" field="address_street" placeholder="123 Amir Temur St" form={draft} onChange={setField} />
            </div>
            <EditField label="City" field="address_city" placeholder="Tashkent" form={draft} onChange={setField} />
            <EditField label="Country" field="address_country" placeholder="Uzbekistan" form={draft} onChange={setField} required error={fieldErrors.address_country} />
            <EditField label="Zip / Postal Code" field="address_zip" placeholder="100000" form={draft} onChange={setField} />
            <EditField label="Passport Number" field="passport_number" placeholder="AA1234567" form={draft} onChange={setField} required error={fieldErrors.passport_number} />
            <div className="col-span-2">
              <EditField label="Passport Expiry Date" field="passport_expiry" type="date" form={draft} onChange={setField} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Languages Spoken <span className="text-gray-300 font-normal tracking-normal">(separate with comma)</span></label>
              <input type="text" value={draft.languages ?? ''} onChange={e => setDraft(p => ({ ...p, languages: e.target.value }))}
                placeholder="e.g. Uzbek, Russian, English" className={inputCls} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <DisplayField label="Street" value={student.address_street} />
            <DisplayField label="City" value={student.address_city} />
            <DisplayField label="Country" value={student.address_country} required />
            <DisplayField label="Zip Code" value={student.address_zip} />
            <DisplayField label="Passport Number" value={student.passport_number} required />
            <DisplayField label="Passport Expiry" value={student.passport_expiry} />
            <div className="col-span-3">
              <p className={labelCls}>Languages Spoken</p>
              <p className="text-[13px] text-gray-900">
                {Array.isArray(student.languages) && student.languages.length > 0 ? student.languages.join(', ') : <span className="text-gray-300 italic">—</span>}
              </p>
            </div>
          </div>
        )}
      </Section>

      {/* ── 3. Family Background ─────────────────────────────────────────── */}
      <Section
        id="family" title="Family Background" icon="family_restroom"
        hint="Parents' info — used for Common App Family section"
        complete={isSectionComplete('family', student)}
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
        onSave={() => saveSection('family', {
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
            {/* Father */}
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Father</p>
              <div className="grid grid-cols-3 gap-x-5 gap-y-3">
                <EditField label="Full Name" field="father_name" placeholder="Behzod Tashmatov" form={draft} onChange={setField} required error={fieldErrors.father_name} />
                <EditField label="Email" field="father_email" type="email" placeholder="father@example.com" form={draft} onChange={setField} />
                <EditField label="Phone" field="father_phone" placeholder="+998 90 000 00 00" form={draft} onChange={setField} />
                <div>
                  <label className={labelCls}>Education Level <span className="text-gray-300 font-normal tracking-normal">(optional)</span></label>
                  <select value={draft.father_education ?? ''} onChange={setField('father_education') as any} className={inputCls}>
                    <option value="">— Select —</option>
                    {["No formal education","Some high school","High school diploma","Some college","Bachelor's degree","Master's degree","Doctoral degree","Professional degree"].map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <EditField label="Occupation" field="father_occupation" placeholder="e.g. Engineer" form={draft} onChange={setField} />
                <EditField label="Employer" field="father_employer" placeholder="e.g. Uzum" form={draft} onChange={setField} />
              </div>
            </div>
            {/* Mother */}
            <div className="border-t border-gray-50 pt-5">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Mother</p>
              <div className="grid grid-cols-3 gap-x-5 gap-y-3">
                <EditField label="Full Name" field="mother_name" placeholder="Malika Tashmatova" form={draft} onChange={setField} required error={fieldErrors.mother_name} />
                <EditField label="Email" field="mother_email" type="email" placeholder="mother@example.com" form={draft} onChange={setField} />
                <EditField label="Phone" field="mother_phone" placeholder="+998 90 000 00 00" form={draft} onChange={setField} />
                <div>
                  <label className={labelCls}>Education Level <span className="text-gray-300 font-normal tracking-normal">(optional)</span></label>
                  <select value={draft.mother_education ?? ''} onChange={setField('mother_education') as any} className={inputCls}>
                    <option value="">— Select —</option>
                    {["No formal education","Some high school","High school diploma","Some college","Bachelor's degree","Master's degree","Doctoral degree","Professional degree"].map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <EditField label="Occupation" field="mother_occupation" placeholder="e.g. Doctor" form={draft} onChange={setField} />
                <EditField label="Employer" field="mother_employer" placeholder="e.g. City Hospital" form={draft} onChange={setField} />
              </div>
            </div>
            {/* Context */}
            <div className="border-t border-gray-50 pt-5 grid grid-cols-2 gap-x-5 gap-y-3">
              <div>
                <label className={labelCls}>Parents' Marital Status <span className="text-gray-300 font-normal tracking-normal">(optional)</span></label>
                <select value={draft.parents_marital_status ?? ''} onChange={setField('parents_marital_status') as any} className={inputCls}>
                  <option value="">— Select —</option>
                  {['Married','Divorced','Separated','Never married','Widowed','Other'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>First-Generation College Student? <span className="text-gray-300 font-normal tracking-normal">(optional)</span></label>
                <select value={draft.first_generation_student ?? 'false'} onChange={setField('first_generation_student') as any} className={inputCls}>
                  <option value="false">No</option>
                  <option value="true">Yes — neither parent attended college</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Father</p>
              <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                <DisplayField label="Name" value={student.father_name} required />
                <DisplayField label="Email" value={student.father_email} />
                <DisplayField label="Phone" value={student.father_phone} />
                <DisplayField label="Education" value={student.father_education} />
                <DisplayField label="Occupation" value={student.father_occupation} />
                <DisplayField label="Employer" value={student.father_employer} />
              </div>
            </div>
            <div className="border-t border-gray-50 pt-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Mother</p>
              <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                <DisplayField label="Name" value={student.mother_name} required />
                <DisplayField label="Email" value={student.mother_email} />
                <DisplayField label="Phone" value={student.mother_phone} />
                <DisplayField label="Education" value={student.mother_education} />
                <DisplayField label="Occupation" value={student.mother_occupation} />
                <DisplayField label="Employer" value={student.mother_employer} />
              </div>
            </div>
            <div className="border-t border-gray-50 pt-4 grid grid-cols-3 gap-x-6 gap-y-3">
              <DisplayField label="Marital Status" value={student.parents_marital_status} />
              <DisplayField label="First-Generation" value={student.first_generation_student === true ? 'Yes' : student.first_generation_student === false ? 'No' : null} />
            </div>
          </div>
        )}
      </Section>

      {/* ── 4. Academic Record ───────────────────────────────────────────── */}
      <Section
        id="academic" title="Academic Record" icon="menu_book"
        hint="High school, GPA, intended major"
        complete={isSectionComplete('academic', student)}
        editing={isEditing('academic')}
        onEdit={() => startEdit('academic', {
          high_school_name: student.high_school_name ?? '',
          high_school_country: student.high_school_country ?? '',
          school_city: student.school_city ?? '',
          school_ceeb_code: student.school_ceeb_code ?? '',
          school_type: student.school_type ?? '',
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
        onSave={() => saveSection('academic', {
          high_school_name: str('high_school_name'), high_school_country: str('high_school_country'),
          school_city: str('school_city'), school_ceeb_code: str('school_ceeb_code'),
          school_type: str('school_type'),
          graduation_year: num('graduation_year'), gpa: num('gpa'),
          gpa_scale: num('gpa_scale') ?? 4.0,
          class_rank: str('class_rank'), class_size: num('class_size'),
          intended_major: str('intended_major'),
          application_type: str('application_type'), season: str('season'),
        })}
        saving={saving}
      >
        {isEditing('academic') ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="col-span-2">
              <EditField label="High School Name" field="high_school_name" placeholder="Tashkent International School" form={draft} onChange={setField} required error={fieldErrors.high_school_name} />
            </div>
            <EditField label="City" field="school_city" placeholder="Tashkent" form={draft} onChange={setField} />
            <EditField label="Country" field="high_school_country" placeholder="Uzbekistan" form={draft} onChange={setField} />
            <EditField label="CEEB Code" field="school_ceeb_code" placeholder="6-digit code" form={draft} onChange={setField} />
            <div>
              <label className={labelCls}>School Type <span className="text-gray-300 font-normal tracking-normal">(optional)</span></label>
              <select value={draft.school_type ?? ''} onChange={setField('school_type') as any} className={inputCls}>
                <option value="">— Select —</option>
                {['Public', 'Private', 'International', 'Religious', 'Home School'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <EditField label="Graduation Year" field="graduation_year" type="number" placeholder="2025" form={draft} onChange={setField} required error={fieldErrors.graduation_year} />
            <EditField label="GPA" field="gpa" type="number" placeholder="3.85" form={draft} onChange={setField} required error={fieldErrors.gpa} />
            <div>
              <label className={labelCls}>GPA Scale <span className="text-gray-300 font-normal tracking-normal">(optional)</span></label>
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
                {[['freshman','Freshman (First Year)'],['transfer','Transfer'],['graduate','Graduate']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <EditField label="Application Season" field="season" placeholder="2025-26" form={draft} onChange={setField} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <div className="col-span-3">
              <DisplayField label="High School" value={student.high_school_name} required />
            </div>
            <DisplayField label="City" value={student.school_city} />
            <DisplayField label="Country" value={student.high_school_country} />
            <DisplayField label="School Type" value={student.school_type} />
            <DisplayField label="CEEB Code" value={student.school_ceeb_code} />
            <DisplayField label="Graduation Year" value={student.graduation_year} required />
            <DisplayField label="GPA" value={student.gpa != null ? `${student.gpa} / ${student.gpa_scale ?? 4.0}` : null} required />
            <DisplayField label="Class Rank" value={student.class_rank && student.class_size ? `${student.class_rank} of ${student.class_size}` : student.class_rank} />
            <DisplayField label="Intended Major" value={student.intended_major} />
            <DisplayField label="Application Type" value={student.application_type} />
            <DisplayField label="Season" value={student.season} />
          </div>
        )}
      </Section>

      {/* ── 5. Test Scores ───────────────────────────────────────────────── */}
      <Section
        id="scores" title="Test Scores" icon="assignment"
        hint="SAT, ACT, TOEFL, IELTS — at least one required"
        complete={isSectionComplete('scores', student)}
        editing={isEditing('scores')}
        onEdit={() => startEdit('scores', {
          sat_total: student.sat_total?.toString() ?? '',
          sat_math: student.sat_math?.toString() ?? '',
          sat_reading: student.sat_reading?.toString() ?? '',
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
        onSave={() => {
          const hasOne = draft.sat_total || draft.act_score || draft.toefl_score || draft.ielts_score
          if (!hasOne) { showToast('Please enter at least one test score.'); return }
          saveSection('scores', {
            sat_total: num('sat_total'), sat_math: num('sat_math'), sat_reading: num('sat_reading'),
            act_score: num('act_score'), act_english: num('act_english'), act_math: num('act_math'),
            act_reading: num('act_reading'), act_science: num('act_science'),
            toefl_score: num('toefl_score'), ielts_score: num('ielts_score'), duolingo_score: num('duolingo_score'),
          })
        }}
        saving={saving}
      >
        {isEditing('scores') ? (
          <div className="space-y-5">
            <p className="text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Fill in what the student has. Only fields with scores will be used on Common App.
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">SAT</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <EditField label="Total" field="sat_total" type="number" placeholder="1540" form={draft} onChange={setField} />
                  <EditField label="Math" field="sat_math" type="number" placeholder="780" form={draft} onChange={setField} />
                  <EditField label="Reading & Writing" field="sat_reading" type="number" placeholder="760" form={draft} onChange={setField} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">ACT</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <EditField label="Composite" field="act_score" type="number" placeholder="34" form={draft} onChange={setField} />
                  <EditField label="English" field="act_english" type="number" placeholder="35" form={draft} onChange={setField} />
                  <EditField label="Math" field="act_math" type="number" placeholder="34" form={draft} onChange={setField} />
                  <EditField label="Reading" field="act_reading" type="number" placeholder="35" form={draft} onChange={setField} />
                  <EditField label="Science" field="act_science" type="number" placeholder="33" form={draft} onChange={setField} />
                </div>
              </div>
            </div>
            <div className="border-t border-gray-50 pt-4">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">English Proficiency</p>
              <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                <EditField label="TOEFL" field="toefl_score" type="number" placeholder="112" form={draft} onChange={setField} />
                <EditField label="IELTS" field="ielts_score" type="number" placeholder="7.5" form={draft} onChange={setField} />
                <EditField label="Duolingo" field="duolingo_score" type="number" placeholder="135" form={draft} onChange={setField} />
              </div>
            </div>
          </div>
        ) : (
          <div>
            {!(student.sat_total || student.act_score || student.toefl_score || student.ielts_score) ? (
              <p className="text-[13px] text-gray-300 italic">No test scores added yet.</p>
            ) : (
              <div className="grid grid-cols-4 gap-x-6 gap-y-4">
                {student.sat_total && <DisplayField label="SAT Total" value={student.sat_total} />}
                {student.sat_math && <DisplayField label="SAT Math" value={student.sat_math} />}
                {student.sat_reading && <DisplayField label="SAT Reading" value={student.sat_reading} />}
                {student.act_score && <DisplayField label="ACT Composite" value={student.act_score} />}
                {student.act_english && <DisplayField label="ACT English" value={student.act_english} />}
                {student.act_math && <DisplayField label="ACT Math" value={student.act_math} />}
                {student.act_reading && <DisplayField label="ACT Reading" value={student.act_reading} />}
                {student.act_science && <DisplayField label="ACT Science" value={student.act_science} />}
                {student.toefl_score && <DisplayField label="TOEFL" value={student.toefl_score} />}
                {student.ielts_score && <DisplayField label="IELTS" value={student.ielts_score} />}
                {student.duolingo_score && <DisplayField label="Duolingo" value={student.duolingo_score} />}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── 6. AP / IB Scores ───────────────────────────────────────────── */}
      <APAndIBSection
        student={student}
        onSave={async (payload) => {
          setSaving(true)
          try {
            await apiFetch(`/api/students/${student.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
            router.refresh()
          } catch (err) { showToast((err as Error).message || 'Something went wrong') }
          finally { setSaving(false) }
        }}
        saving={saving}
      />

      {/* ── 7. Activities ────────────────────────────────────────────────── */}
      <ActivitiesSection
        student={student}
        onSave={async (payload) => {
          setSaving(true)
          try {
            await apiFetch(`/api/students/${student.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
            router.refresh()
          } catch (err) { showToast((err as Error).message || 'Something went wrong') }
          finally { setSaving(false) }
        }}
        saving={saving}
      />

      {/* ── 8. Teacher Rec Info ──────────────────────────────────────────── */}
      <TeacherRecSection
        student={student}
        onSave={async (payload) => {
          setSaving(true)
          try {
            await apiFetch(`/api/students/${student.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
            router.refresh()
          } catch (err) { showToast((err as Error).message || 'Something went wrong') }
          finally { setSaving(false) }
        }}
        saving={saving}
      />

      {/* ── 9. Counselor Context ─────────────────────────────────────────── */}
      <Section
        id="counselor" title="Counselor Context" icon="record_voice_over"
        hint="Used by AI to write the counselor recommendation letter"
        complete={isSectionComplete('counselor', student)}
        editing={isEditing('counselor')}
        onEdit={() => startEdit('counselor', { counselor_notes: student.counselor_notes ?? '' })}
        onCancel={cancelEdit}
        onSave={() => saveSection('counselor', { counselor_notes: str('counselor_notes') })}
        saving={saving}
      >
        {isEditing('counselor') ? (
          <div>
            <label className={labelCls}>Notes for the counselor letter <span className="text-gray-300 font-normal tracking-normal">(optional — but very helpful)</span></label>
            <textarea
              value={draft.counselor_notes ?? ''}
              onChange={e => setDraft(p => ({ ...p, counselor_notes: e.target.value }))}
              rows={6}
              placeholder="Describe the student — their growth, challenges, achievements, character. What should the counselor emphasize? Any context the counselor would highlight in their letter?"
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>
        ) : (
          student.counselor_notes
            ? <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">{student.counselor_notes}</p>
            : <p className="text-[13px] text-gray-300 italic">Nothing added yet. The AI will skip the counselor letter if this is empty.</p>
        )}
      </Section>

      {/* ── 10. Internal Notes ──────────────────────────────────────────── */}
      <Section
        id="notes" title="Internal Notes" icon="sticky_note_2"
        hint="Private — only visible to your team"
        complete={true}
        editing={isEditing('notes')}
        onEdit={() => startEdit('notes', { notes: student.notes ?? '' })}
        onCancel={cancelEdit}
        onSave={() => saveSection('notes', { notes: str('notes') })}
        saving={saving}
      >
        {isEditing('notes') ? (
          <textarea
            value={draft.notes ?? ''}
            onChange={e => setDraft(p => ({ ...p, notes: e.target.value }))}
            rows={4}
            placeholder="Internal notes about this student visible only to your team…"
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          />
        ) : (
          <p className={student.notes ? 'text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed' : 'text-[13px] text-gray-300 italic'}>
            {student.notes || 'No internal notes.'}
          </p>
        )}
      </Section>

    </div>
  )
}

// ─── AP & IB Scores Section ───────────────────────────────────────────────────
const AP_SUBJECTS = [
  'Art History','Biology','Calculus AB','Calculus BC','Chemistry',
  'Chinese Language & Culture','Computer Science A','Computer Science Principles',
  'English Language & Composition','English Literature & Composition',
  'Environmental Science','European History','French Language & Culture',
  'German Language & Culture','Human Geography','Italian Language & Culture',
  'Japanese Language & Culture','Latin','Macroeconomics','Microeconomics',
  'Music Theory','Physics 1','Physics 2','Physics C: E&M','Physics C: Mechanics',
  'Psychology','Research','Seminar','Spanish Language & Culture',
  'Spanish Literature & Culture','Statistics','Studio Art: 2-D Design',
  'Studio Art: 3-D Design','Studio Art: Drawing','US Government & Politics',
  'US History','World History: Modern','Other',
]
const IB_SUBJECTS = [
  'Biology','Business Management','Chemistry','Computer Science','Dance',
  'Design Technology','Economics','English A: Language & Literature',
  'English A: Literature','Environmental Systems & Societies','Film',
  'French B','Geography','Global Politics','History','Information Technology',
  'Language A: Literature','Math: Analysis & Approaches','Math: Applications & Interpretation',
  'Music','Philosophy','Physics','Psychology','Russian B','Spanish B',
  'Sports, Exercise & Health Science','Theatre','Visual Arts','World Religions','Other',
]

function APAndIBSection({ student, onSave, saving }: {
  student: Student
  onSave: (payload: Record<string, any>) => Promise<void>
  saving: boolean
}) {
  const [editing, setEditing] = useState(false)
  const blankAP = () => ({ subject: '', score: '' })
  const blankIB = () => ({ subject: '', level: 'HL', score: '' })

  const [apScores, setApScores] = useState<{ subject: string; score: string }[]>(
    () => Array.isArray(student.ap_scores) && student.ap_scores.length > 0
      ? student.ap_scores.map((s: any) => ({ subject: s.subject ?? '', score: String(s.score ?? '') }))
      : []
  )
  const [ibScores, setIbScores] = useState<{ subject: string; level: string; score: string }[]>(
    () => Array.isArray(student.ib_scores) && student.ib_scores.length > 0
      ? student.ib_scores.map((s: any) => ({ subject: s.subject ?? '', level: s.level ?? 'HL', score: String(s.score ?? '') }))
      : []
  )

  const complete = (Array.isArray(student.ap_scores) && student.ap_scores.length > 0) ||
                   (Array.isArray(student.ib_scores) && student.ib_scores.length > 0)

  const handleSave = async () => {
    const ap = apScores.filter(s => s.subject).map(s => ({ subject: s.subject, score: Number(s.score) || null }))
    const ib = ibScores.filter(s => s.subject).map(s => ({ subject: s.subject, level: s.level, score: Number(s.score) || null }))
    await onSave({ ap_scores: ap, ib_scores: ib })
    setEditing(false)
  }

  const cls = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all'
  const lbl = 'block text-[10px] font-semibold uppercase tracking-[0.5px] text-gray-400 mb-1'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(29,158,117,0.08)' }}>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-bold text-gray-900">AP & IB Scores</h3>
              <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${complete ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}>
                <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: complete ? "'FILL' 1" : "'FILL' 0" }}>
                  {complete ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                {complete ? 'Complete' : 'Not added'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Optional — only add if the student has AP or IB exams</p>
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
            <button onClick={handleSave} disabled={saving}
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
            {/* AP Scores */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">AP Exams</p>
                <button onClick={() => setApScores(p => [...p, blankAP()])}
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:opacity-80">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>Add AP Exam
                </button>
              </div>
              {apScores.length === 0 && (
                <p className="text-[12px] text-gray-400 italic">No AP exams added.</p>
              )}
              <div className="space-y-2">
                {apScores.map((s, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="flex-1">
                      <select value={s.subject} onChange={e => setApScores(p => p.map((x, idx) => idx === i ? { ...x, subject: e.target.value } : x))} className={cls}>
                        <option value="">— Select Subject —</option>
                        {AP_SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                      </select>
                    </div>
                    <div className="w-24">
                      <select value={s.score} onChange={e => setApScores(p => p.map((x, idx) => idx === i ? { ...x, score: e.target.value } : x))} className={cls}>
                        <option value="">Score</option>
                        {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <button onClick={() => setApScores(p => p.filter((_, idx) => idx !== i))}
                      className="text-gray-300 hover:text-red-400 transition-colors">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* IB Scores */}
            <div className="border-t border-gray-50 pt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">IB Exams</p>
                <button onClick={() => setIbScores(p => [...p, blankIB()])}
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:opacity-80">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>Add IB Exam
                </button>
              </div>
              {ibScores.length === 0 && (
                <p className="text-[12px] text-gray-400 italic">No IB exams added.</p>
              )}
              <div className="space-y-2">
                {ibScores.map((s, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="flex-1">
                      <select value={s.subject} onChange={e => setIbScores(p => p.map((x, idx) => idx === i ? { ...x, subject: e.target.value } : x))} className={cls}>
                        <option value="">— Select Subject —</option>
                        {IB_SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                      </select>
                    </div>
                    <div className="w-20">
                      <select value={s.level} onChange={e => setIbScores(p => p.map((x, idx) => idx === i ? { ...x, level: e.target.value } : x))} className={cls}>
                        <option value="HL">HL</option>
                        <option value="SL">SL</option>
                      </select>
                    </div>
                    <div className="w-24">
                      <select value={s.score} onChange={e => setIbScores(p => p.map((x, idx) => idx === i ? { ...x, score: e.target.value } : x))} className={cls}>
                        <option value="">Score</option>
                        {[7,6,5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <button onClick={() => setIbScores(p => p.filter((_, idx) => idx !== i))}
                      className="text-gray-300 hover:text-red-400 transition-colors">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!complete ? (
              <p className="text-[13px] text-gray-300 italic">No AP or IB scores added. Skip if the student hasn't taken these exams.</p>
            ) : (
              <>
                {Array.isArray(student.ap_scores) && student.ap_scores.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">AP Exams</p>
                    <div className="flex flex-wrap gap-2">
                      {student.ap_scores.map((s: any, i: number) => (
                        <span key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
                          <span className="text-[12px] text-gray-700 font-medium">{s.subject}</span>
                          <span className="text-[11px] font-bold text-primary bg-primary/10 rounded px-1.5">{s.score}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {Array.isArray(student.ib_scores) && student.ib_scores.length > 0 && (
                  <div className={Array.isArray(student.ap_scores) && student.ap_scores.length > 0 ? 'border-t border-gray-50 pt-4' : ''}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">IB Exams</p>
                    <div className="flex flex-wrap gap-2">
                      {student.ib_scores.map((s: any, i: number) => (
                        <span key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
                          <span className="text-[12px] text-gray-700 font-medium">{s.subject}</span>
                          <span className="text-[10px] text-gray-400 font-semibold">{s.level}</span>
                          <span className="text-[11px] font-bold text-primary bg-primary/10 rounded px-1.5">{s.score}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Activities Section ───────────────────────────────────────────────────────
const ACTIVITY_TYPES = [
  'Academic','Art','Athletics: Club','Athletics: JV/Varsity','Career/Internship',
  'Community Service','Computer/Technology','Cultural','Dance','Debate/Speech',
  'Environmental','Family Responsibilities','Foreign Language','Government/Politics',
  'Music: Instrumental','Music: Vocal','Religious','Research','Science/Math',
  'Theater/Drama','Work (Paid)','Other',
]

function ActivitiesSection({ student, onSave, saving }: {
  student: Student
  onSave: (payload: Record<string, any>) => Promise<void>
  saving: boolean
}) {
  const [editing, setEditing] = useState(false)
  const blankActivity = () => ({
    activity_type: '', position: '', organization: '', description: '',
    hours_per_week: '', weeks_per_year: '', grades: [] as string[], still_doing: false,
  })

  const [activities, setActivities] = useState<ReturnType<typeof blankActivity>[]>(
    () => Array.isArray(student.activities) && student.activities.length > 0
      ? student.activities
      : [blankActivity()]
  )
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const complete = Array.isArray(student.activities) && student.activities.length > 0

  const setA = (i: number, f: string, val: any) => {
    setActivities(prev => prev.map((a, idx) => idx === i ? { ...a, [f]: val } : a))
    setErrors(prev => ({ ...prev, [`${i}_${f}`]: false }))
  }

  const toggleGrade = (i: number, grade: string) => {
    const curr = activities[i].grades ?? []
    const next = curr.includes(grade) ? curr.filter(g => g !== grade) : [...curr, grade]
    setA(i, 'grades', next)
  }

  const handleSave = async () => {
    const errs: Record<string, boolean> = {}
    activities.forEach((a, i) => {
      if (!a.organization.trim()) errs[`${i}_organization`] = true
      if (!a.activity_type)       errs[`${i}_activity_type`] = true
    })
    if (Object.keys(errs).length) { setErrors(errs); return }
    const payload = activities.filter(a => a.organization.trim())
    await onSave({ activities: payload })
    setEditing(false)
  }

  const cls = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all'
  const errCls = 'w-full bg-white border border-red-300 rounded-lg px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all'
  const lbl = 'block text-[10px] font-semibold uppercase tracking-[0.5px] text-gray-400 mb-1'
  const GRADES = ['9','10','11','12']

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(29,158,117,0.08)' }}>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-bold text-gray-900">Activities & Extracurriculars</h3>
              <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${complete ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
                <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: complete ? "'FILL' 1" : "'FILL' 0" }}>
                  {complete ? 'check_circle' : 'pending'}
                </span>
                {complete ? `${student.activities.length} added` : 'Incomplete'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Common App allows up to 10 activities — enter them here for AI auto-fill</p>
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
            <button onClick={handleSave} disabled={saving}
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
            <p className="text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Common App limits descriptions to 150 characters. The AI will auto-trim if needed — but write naturally here.
            </p>
            {activities.map((a, i) => (
              <div key={i} className={i > 0 ? 'border-t border-gray-50 pt-6' : ''}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Activity {i + 1}</p>
                  {activities.length > 1 && (
                    <button onClick={() => setActivities(p => p.filter((_, idx) => idx !== i))}
                      className="text-[11px] text-gray-300 hover:text-red-400 transition-colors flex items-center gap-0.5">
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                  <div>
                    <label className={lbl}>Activity Type <span className="text-red-400">*</span></label>
                    <select value={a.activity_type} onChange={e => setA(i, 'activity_type', e.target.value)}
                      className={errors[`${i}_activity_type`] ? errCls : cls}>
                      <option value="">— Select —</option>
                      {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors[`${i}_activity_type`] && <p className="text-[11px] text-red-500 mt-0.5">Required</p>}
                  </div>
                  <div>
                    <label className={lbl}>Organization / Group Name <span className="text-red-400">*</span></label>
                    <input value={a.organization} onChange={e => setA(i, 'organization', e.target.value)}
                      placeholder="e.g. National Honor Society" className={errors[`${i}_organization`] ? errCls : cls} />
                    {errors[`${i}_organization`] && <p className="text-[11px] text-red-500 mt-0.5">Required</p>}
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Position / Role <span className="text-gray-300 font-normal tracking-normal">(optional)</span></label>
                    <input value={a.position} onChange={e => setA(i, 'position', e.target.value)}
                      placeholder="e.g. President, Team Captain, Member" className={cls} />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>
                      Description <span className="text-gray-300 font-normal tracking-normal">(optional — AI will write if blank)</span>
                      {a.description && <span className="ml-2 font-normal normal-case tracking-normal text-gray-400">{a.description.length}/150 chars</span>}
                    </label>
                    <textarea value={a.description} onChange={e => setA(i, 'description', e.target.value)}
                      rows={2}
                      placeholder="Describe what you did and any accomplishments…"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                  </div>
                  <div>
                    <label className={lbl}>Hours per Week <span className="text-gray-300 font-normal tracking-normal">(optional)</span></label>
                    <input type="number" value={a.hours_per_week} onChange={e => setA(i, 'hours_per_week', e.target.value)}
                      placeholder="e.g. 5" className={cls} />
                  </div>
                  <div>
                    <label className={lbl}>Weeks per Year <span className="text-gray-300 font-normal tracking-normal">(optional)</span></label>
                    <input type="number" value={a.weeks_per_year} onChange={e => setA(i, 'weeks_per_year', e.target.value)}
                      placeholder="e.g. 40" className={cls} />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Participation Grades <span className="text-gray-300 font-normal tracking-normal">(optional)</span></label>
                    <div className="flex gap-2 mt-1">
                      {GRADES.map(g => (
                        <button key={g} type="button"
                          onClick={() => toggleGrade(i, g)}
                          className={`w-10 h-8 rounded-lg text-[12px] font-bold border transition-all ${
                            (a.grades ?? []).includes(g)
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-400 border-gray-200 hover:border-primary/40'
                          }`}>
                          {g}
                        </button>
                      ))}
                      <label className="flex items-center gap-2 ml-4 cursor-pointer">
                        <input type="checkbox" checked={a.still_doing} onChange={e => setA(i, 'still_doing', e.target.checked)}
                          className="rounded" />
                        <span className="text-[12px] text-gray-600">Still doing in college</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {activities.length < 10 && (
              <button onClick={() => setActivities(p => [...p, blankActivity()])}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:opacity-80 transition-opacity">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
                Add another activity
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {!complete ? (
              <p className="text-[13px] text-gray-300 italic">No activities added yet. Common App has up to 10 slots — fill these in for best results.</p>
            ) : (
              student.activities.map((a: any, i: number) => (
                <div key={i} className={i > 0 ? 'border-t border-gray-50 pt-4' : ''}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-primary bg-primary/8 rounded px-2 py-0.5">{a.activity_type || 'Other'}</span>
                        {a.still_doing && <span className="text-[10px] font-semibold text-green-600 bg-green-50 rounded px-2 py-0.5">Continuing in college</span>}
                      </div>
                      <p className="text-[13px] font-semibold text-gray-900">{a.organization}</p>
                      {a.position && <p className="text-[12px] text-gray-500">{a.position}</p>}
                      {a.description && <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">{a.description}</p>}
                    </div>
                    <div className="text-right shrink-0 text-[11px] text-gray-400 space-y-0.5">
                      {a.hours_per_week && <p>{a.hours_per_week} hrs/wk</p>}
                      {a.weeks_per_year && <p>{a.weeks_per_year} wks/yr</p>}
                      {Array.isArray(a.grades) && a.grades.length > 0 && <p>Grades: {a.grades.join(', ')}</p>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Teacher Rec Section ──────────────────────────────────────────────────────
function TeacherRecSection({ student, onSave, saving }: {
  student: Student
  onSave: (payload: Record<string, any>) => Promise<void>
  saving: boolean
}) {
  const [editing, setEditing] = useState(false)
  const blank = () => ({ name: '', email: '', subject: '', class_year: '', relationship_notes: '', highlights: '' })
  const [teachers, setTeachers] = useState<ReturnType<typeof blank>[]>(
    () => Array.isArray(student.teacher_rec_info) && student.teacher_rec_info.length > 0
      ? student.teacher_rec_info
      : [blank(), blank()]
  )
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const setT = (i: number, f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTeachers(prev => prev.map((t, idx) => idx === i ? { ...t, [f]: e.target.value } : t))
    setErrors(prev => ({ ...prev, [`${i}_${f}`]: false }))
  }

  const handleSave = async () => {
    const errs: Record<string, boolean> = {}
    teachers.forEach((t, i) => {
      if (!t.name.trim()) errs[`${i}_name`] = true
      if (!t.email.trim()) errs[`${i}_email`] = true
    })
    if (Object.keys(errs).length) { setErrors(errs); return }
    await onSave({ teacher_rec_info: teachers })
    setEditing(false)
  }

  const complete = Array.isArray(student.teacher_rec_info) && student.teacher_rec_info.some((t: any) => t.name && t.email)

  const cls = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all'
  const errCls = 'w-full bg-white border border-red-300 rounded-lg px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all'
  const lbl = 'block text-[10px] font-semibold uppercase tracking-[0.5px] text-gray-400 mb-1'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(29,158,117,0.08)' }}>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>rate_review</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-bold text-gray-900">Teacher Recommendation Info</h3>
              <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${complete ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
                <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: complete ? "'FILL' 1" : "'FILL' 0" }}>
                  {complete ? 'check_circle' : 'pending'}
                </span>
                {complete ? 'Complete' : 'Incomplete'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">AI uses this to draft teacher rec request emails</p>
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
            <button onClick={handleSave} disabled={saving}
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
            <p className="text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Name and email are required per teacher. Subject and notes help the AI write a more specific rec request.
            </p>
            {teachers.map((t, i) => (
              <div key={i} className={i > 0 ? 'border-t border-gray-50 pt-6' : ''}>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Teacher {i + 1}</p>
                <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                  <div>
                    <label className={lbl}>Full Name <span className="text-red-400">*</span></label>
                    <input value={t.name} onChange={setT(i, 'name')} placeholder="e.g. Sarah Johnson"
                      className={errors[`${i}_name`] ? errCls : cls} />
                    {errors[`${i}_name`] && <p className="text-[11px] text-red-500 mt-0.5">Required</p>}
                  </div>
                  <div>
                    <label className={lbl}>Email <span className="text-red-400">*</span></label>
                    <input type="email" value={t.email} onChange={setT(i, 'email')} placeholder="teacher@school.edu"
                      className={errors[`${i}_email`] ? errCls : cls} />
                    {errors[`${i}_email`] && <p className="text-[11px] text-red-500 mt-0.5">Required</p>}
                  </div>
                  <div>
                    <label className={lbl}>Subject / Class <span className="text-gray-300 font-normal tracking-normal">(optional)</span></label>
                    <input value={t.subject} onChange={setT(i, 'subject')} placeholder="e.g. AP Chemistry, 11th grade" className={cls} />
                  </div>
                  <div>
                    <label className={lbl}>Class Year <span className="text-gray-300 font-normal tracking-normal">(optional)</span></label>
                    <input value={t.class_year} onChange={setT(i, 'class_year')} placeholder="e.g. 2023-24" className={cls} />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>What should they highlight? <span className="text-gray-300 font-normal tracking-normal">(optional)</span></label>
                    <textarea value={t.highlights} onChange={setT(i, 'highlights')} rows={2}
                      placeholder="Specific achievements, skills, or qualities this teacher can speak to…"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => setTeachers(p => [...p, blank()])}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
              Add another teacher
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {complete
              ? student.teacher_rec_info.map((t: any, i: number) => (
                <div key={i} className={i > 0 ? 'border-t border-gray-50 pt-4' : ''}>
                  <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                    <div><p className={lbl}>Teacher {i + 1}</p><p className="text-[13px] text-gray-900">{t.name || '—'}</p></div>
                    <div><p className={lbl}>Email</p><p className="text-[13px] text-gray-900">{t.email || '—'}</p></div>
                    <div><p className={lbl}>Subject</p><p className="text-[13px] text-gray-900">{t.subject || '—'}</p></div>
                    {t.highlights && <div className="col-span-3"><p className={lbl}>Highlights</p><p className="text-[13px] text-gray-700">{t.highlights}</p></div>}
                  </div>
                </div>
              ))
              : <p className="text-[13px] text-gray-300 italic">No teachers added yet. Common App requires 2 teacher recommendations.</p>
            }
          </div>
        )}
      </div>
    </div>
  )
}
