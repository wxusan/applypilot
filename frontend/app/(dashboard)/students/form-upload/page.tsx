'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ParseResponse {
  extracted: Record<string, string | number | null>
  raw_fields_found: number
  mapped_fields: number
  source_file: string
}

type FieldValues = Record<string, string>

// ── Section definitions for the review form ───────────────────────────────────

const SECTIONS = [
  {
    key: 'personal',
    label: 'Personal Information',
    icon: 'person',
    fields: [
      { key: 'full_name',        label: 'Full Name' },
      { key: 'preferred_name',   label: 'Preferred / Nick Name' },
      { key: 'date_of_birth',    label: 'Date of Birth',   type: 'date' },
      { key: 'gender',           label: 'Gender' },
      { key: 'nationality',      label: 'Country of Citizenship' },
      { key: 'country_of_birth', label: 'Country of Birth' },
      { key: 'city_of_birth',    label: 'City of Birth' },
    ],
  },
  {
    key: 'contact',
    label: 'Contact & Address',
    icon: 'contact_mail',
    fields: [
      { key: 'email',           label: 'Email Address', type: 'email' },
      { key: 'phone',           label: 'Phone Number', type: 'tel' },
      { key: 'address_street',  label: 'Street Address' },
      { key: 'address_city',    label: 'City' },
      { key: 'address_country', label: 'Country' },
      { key: 'address_zip',     label: 'Zip / Postal Code' },
    ],
  },
  {
    key: 'passport',
    label: 'Passport',
    icon: 'badge',
    fields: [
      { key: 'passport_number', label: 'Passport Number' },
      { key: 'passport_expiry', label: 'Expiry Date', type: 'date' },
    ],
  },
  {
    key: 'parents',
    label: "Parents' Information",
    icon: 'family_restroom',
    fields: [
      { key: 'father_name',       label: "Father's Full Name" },
      { key: 'father_email',      label: "Father's Email", type: 'email' },
      { key: 'father_phone',      label: "Father's Phone", type: 'tel' },
      { key: 'father_occupation', label: "Father's Occupation" },
      { key: 'father_education',  label: "Father's Education Level" },
      { key: 'mother_name',       label: "Mother's Full Name" },
      { key: 'mother_email',      label: "Mother's Email", type: 'email' },
      { key: 'mother_phone',      label: "Mother's Phone", type: 'tel' },
      { key: 'mother_occupation', label: "Mother's Occupation" },
      { key: 'mother_education',  label: "Mother's Education Level" },
    ],
  },
  {
    key: 'emergency',
    label: 'Emergency Contact',
    icon: 'emergency',
    fields: [
      { key: 'parent_name',  label: 'Contact Full Name' },
      { key: 'parent_phone', label: 'Contact Phone', type: 'tel' },
      { key: 'parent_email', label: 'Contact Email', type: 'email' },
    ],
  },
  {
    key: 'education',
    label: 'Education',
    icon: 'school',
    fields: [
      { key: 'high_school_name',    label: 'High School Name' },
      { key: 'high_school_country', label: 'School Country' },
      { key: 'school_city',         label: 'School City' },
      { key: 'graduation_year',     label: 'Graduation Year', type: 'number' },
      { key: 'gpa',                 label: 'Cumulative GPA', type: 'number' },
      { key: 'gpa_scale',           label: 'GPA Scale', type: 'number' },
      { key: 'class_rank',          label: 'Class Rank' },
    ],
  },
  {
    key: 'testScores',
    label: 'Test Scores',
    icon: 'quiz',
    fields: [
      { key: 'sat_total',   label: 'SAT Total',    type: 'number' },
      { key: 'sat_math',    label: 'SAT Math',     type: 'number' },
      { key: 'sat_reading', label: 'SAT R&W',      type: 'number' },
      { key: 'act_score',   label: 'ACT Composite', type: 'number' },
      { key: 'toefl_score', label: 'TOEFL Total',  type: 'number' },
      { key: 'ielts_score', label: 'IELTS Band',   type: 'number' },
    ],
  },
  {
    key: 'academic',
    label: 'Academic Preferences',
    icon: 'menu_book',
    fields: [
      { key: 'season',           label: 'Intended Enrollment Term' },
      { key: 'languages_at_home', label: 'Languages Spoken' },
    ],
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function FormUploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResponse | null>(null)
  const [fields, setFields] = useState<FieldValues>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [savedName, setSavedName] = useState('')

  // ── Drag helpers ─────────────────────────────────────────────────────────

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await processFile(file)
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (file) await processFile(file)
    // Reset so same file can be re-uploaded
    e.currentTarget.value = ''
  }

  // ── Upload & parse ────────────────────────────────────────────────────────

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setUploadError('Please upload a .docx file (Word document).')
      return
    }
    setUploadError(null)
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await apiFetch<ParseResponse>('/api/students/parse-form', {
        method: 'POST',
        body: formData,
      })

      setParseResult(result)
      // Convert all values to strings for the form inputs
      const initial: FieldValues = {}
      for (const [k, v] of Object.entries(result.extracted)) {
        initial[k] = v !== null && v !== undefined ? String(v) : ''
      }
      setFields(initial)
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to parse the document. Please check the file and try again.')
    } finally {
      setIsUploading(false)
    }
  }

  // ── Field change ──────────────────────────────────────────────────────────

  const handleFieldChange = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
    setSaveError(null)
  }

  // ── Save / confirm ────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    setSaveError(null)
    setIsSaving(true)

    // Build the payload — coerce numeric fields back
    const numericFields = new Set(['graduation_year', 'gpa', 'gpa_scale', 'sat_total', 'sat_math', 'sat_reading', 'act_score', 'toefl_score', 'ielts_score'])
    const payload: Record<string, any> = {}
    for (const [k, v] of Object.entries(fields)) {
      if (v === '' || v === undefined) continue
      payload[k] = numericFields.has(k) ? (Number(v) || undefined) : v
    }

    try {
      await apiFetch('/api/students', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setSavedName(payload.full_name || 'Student')
      setSuccess(true)
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save the student profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 text-center space-y-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
          style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #16a34a 100%)' }}>
          <span className="material-symbols-outlined text-white" style={{ fontSize: '40px' }}>check_circle</span>
        </div>
        <h2 className="text-3xl font-bold text-[#031635]">Profile Created!</h2>
        <p className="text-gray-500 text-lg">
          <span className="font-semibold text-[#031635]">{savedName}</span> has been added to the platform.
        </p>
        <div className="flex items-center gap-4 pt-2">
          <Link
            href="/students"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:-translate-y-0.5 transition-all"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            <span className="material-symbols-outlined text-sm">group</span>
            View All Students
          </Link>
          <button
            onClick={() => {
              setSuccess(false)
              setParseResult(null)
              setFields({})
              setSavedName('')
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-[#031635] font-semibold border hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#e5e7eb' }}
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            Upload Another
          </button>
        </div>
      </div>
    )
  }

  // ── Review form ───────────────────────────────────────────────────────────

  if (parseResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#031635] mb-1">Review Extracted Data</h1>
            <p className="text-gray-500">
              Parsed <span className="font-semibold text-[#031635]">{parseResult.source_file}</span>
              {' '}— {parseResult.mapped_fields} fields extracted from {parseResult.raw_fields_found} form answers.
              Review and edit before saving.
            </p>
          </div>
          <button
            onClick={() => { setParseResult(null); setFields({}); setUploadError(null) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-500 font-medium hover:bg-gray-100 transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            Start Over
          </button>
        </div>

        {/* Extraction summary chips */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
            {parseResult.mapped_fields} fields mapped
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>description</span>
            {parseResult.raw_fields_found} answers found in document
          </span>
        </div>

        {/* Section cards */}
        <div className="space-y-6">
          {SECTIONS.map(section => {
            // Only show sections that have at least one extracted value
            const hasData = section.fields.some(f => fields[f.key])
            return (
              <div
                key={section.key}
                className="bg-white rounded-2xl border overflow-hidden"
                style={{ borderColor: '#e5e7eb' }}
              >
                {/* Section header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: '#f3f4f6', background: '#fafafa' }}>
                  <span className="material-symbols-outlined text-[#1D9E75]" style={{ fontSize: '20px' }}>{section.icon}</span>
                  <h2 className="font-bold text-[#031635]">{section.label}</h2>
                  {!hasData && (
                    <span className="ml-auto text-xs text-gray-400 font-medium">No data extracted — fill in manually if needed</span>
                  )}
                </div>

                {/* Fields grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {section.fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {field.label}
                      </label>
                      <input
                        type={field.type || 'text'}
                        value={fields[field.key] || ''}
                        onChange={e => handleFieldChange(field.key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm text-[#031635] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 transition"
                        style={{
                          borderColor: fields[field.key] ? '#1D9E75' : '#e5e7eb',
                          background: fields[field.key] ? '#f0fdf9' : '#fff',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Error message */}
        {saveError && (
          <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <span className="material-symbols-outlined text-red-500" style={{ fontSize: '18px' }}>error</span>
            {saveError}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <button
            onClick={() => { setParseResult(null); setFields({}); setUploadError(null) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSaving || !fields.full_name}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                Saving…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">person_add</span>
                Confirm & Create Profile
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // ── Upload zone ───────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#031635] mb-2">Upload Intake Form</h1>
        <p className="text-gray-500">
          Upload a completed client intake form (.docx) — the platform will extract all answers
          and auto-populate the student profile for your review.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: 'download', step: '1', title: 'Give Client the Form', desc: 'Download the ApplyPilot intake form and share it with your client.' },
          { icon: 'edit_note', step: '2', title: 'Client Fills It Out', desc: 'Client fills in all their details and returns the Word file to you.' },
          { icon: 'auto_fix_high', step: '3', title: 'Upload & Auto-Fill', desc: 'Upload the completed form here — all fields populate automatically.' },
        ].map(item => (
          <div
            key={item.step}
            className="flex items-start gap-4 p-5 bg-white rounded-2xl border"
            style={{ borderColor: '#e5e7eb' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}>
              <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>{item.icon}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Step {item.step}</p>
              <p className="font-semibold text-[#031635] text-sm mb-1">{item.title}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer ${
          dragActive ? 'border-[#1D9E75] bg-emerald-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <span className="material-symbols-outlined text-[#1D9E75] text-6xl block animate-pulse">description</span>
            <p className="text-[#031635] font-semibold text-lg">Parsing document…</p>
            <p className="text-gray-400 text-sm">Extracting answers from your intake form</p>
          </div>
        ) : (
          <div className="space-y-3">
            <span className={`material-symbols-outlined text-6xl block ${dragActive ? 'text-[#1D9E75]' : 'text-gray-300'}`}>
              upload_file
            </span>
            <p className="text-[#031635] font-semibold text-lg">
              {dragActive ? 'Drop the file here' : 'Drag & drop your intake form'}
            </p>
            <p className="text-gray-400 text-sm">or click anywhere to browse</p>
            <p className="text-gray-400 text-xs mt-2">Accepts .docx files up to 10 MB</p>
          </div>
        )}
      </div>

      {/* Error */}
      {uploadError && (
        <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <span className="material-symbols-outlined text-red-500" style={{ fontSize: '18px' }}>error</span>
          {uploadError}
        </div>
      )}

      {/* Tip */}
      <div className="flex items-start gap-3 px-5 py-4 bg-blue-50 border border-blue-100 rounded-xl">
        <span className="material-symbols-outlined text-blue-400 flex-shrink-0" style={{ fontSize: '18px' }}>info</span>
        <p className="text-blue-700 text-sm">
          <span className="font-semibold">Tip:</span> Make sure the client used the official ApplyPilot intake form (.docx).
          Custom formats may not extract correctly. You can always edit any field before confirming.
        </p>
      </div>
    </div>
  )
}
