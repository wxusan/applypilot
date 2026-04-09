'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import StudentTabs from '@/components/students/StudentTabs'

interface Credential {
  id: string
  student_id: string
  credential_type: 'student' | 'teacher' | 'counsellor'
  label: string
  gmail_email: string
  gmail_password?: string
  has_common_app: boolean
  common_app_email?: string
  common_app_password?: string
  role?: string
  notes?: string
  last_tested_at?: string
  last_test_result?: string
  created_at: string
  updated_at?: string
}

interface Student {
  id: string
  full_name: string
}

const CREDENTIAL_LABELS: Record<string, string> = {
  student: 'Student',
  teacher: 'Teacher',
  counsellor: 'Counsellor',
}

const TEST_RESULT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  connected: { label: 'Connected', color: '#065F46', bg: '#D1FAE5' },
  '2fa_required': { label: '2FA Required', color: '#92400E', bg: '#FEF3C7' },
  failed: { label: 'Failed', color: '#991B1B', bg: '#FEE2E2' },
}

function CredentialCard({
  credential,
  onEdit,
  onDelete,
  onTest,
}: {
  credential: Credential
  onEdit: (cred: Credential) => void
  onDelete: (id: string) => void
  onTest: (id: string) => void
}) {
  const testConfig = TEST_RESULT_CONFIG[credential.last_test_result || ''] || {
    label: 'Not tested',
    color: '#6B7280',
    bg: '#F3F4F6',
  }

  const isStudent = credential.credential_type === 'student'

  return (
    <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-on-surface">{credential.label}</h3>
          <p className="text-xs text-on-surface-variant mt-1">{credential.gmail_email}</p>
          {credential.role && (
            <p className="text-xs text-primary mt-1 font-medium">{credential.role}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(credential)}
            className="p-2 hover:bg-surface-container transition-colors rounded-lg"
            title="Edit credential"
          >
            <span className="material-symbols-outlined text-base text-on-surface-variant">edit</span>
          </button>
          <button
            onClick={() => onDelete(credential.id)}
            className="p-2 hover:bg-surface-container transition-colors rounded-lg"
            title="Delete credential"
          >
            <span className="material-symbols-outlined text-base text-error">delete</span>
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-on-surface-variant">Gmail:</span>
          <span className="font-mono text-xs text-on-surface">{credential.gmail_email}</span>
        </div>

        {isStudent && (
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant">Common App:</span>
            {credential.has_common_app ? (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Existing account ✓
              </span>
            ) : (
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                Will be created
              </span>
            )}
          </div>
        )}

        {isStudent && credential.has_common_app && credential.common_app_email && (
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant">Common App email:</span>
            <span className="font-mono text-xs text-on-surface">{credential.common_app_email}</span>
          </div>
        )}

        {credential.last_tested_at && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-on-surface-variant">Last tested:</span>
            <span className="text-on-surface">{new Date(credential.last_tested_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onTest(credential.id)}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
        >
          Test Connection
        </button>
        {credential.last_test_result && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ color: testConfig.color, background: testConfig.bg }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: testConfig.color }}></span>
            {testConfig.label}
          </div>
        )}
      </div>
    </div>
  )
}

function CredentialModal({
  credential,
  isOpen,
  onClose,
  onSave,
}: {
  credential: Credential | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<Credential> & { credential_type?: string }) => void
}) {
  const isNew = !credential?.id
  const [credentialType, setCredentialType] = useState<'student' | 'teacher' | 'counsellor'>(
    credential?.credential_type || 'student'
  )
  const [formData, setFormData] = useState({
    label: credential?.label || '',
    gmail_email: credential?.gmail_email || '',
    gmail_password: '',
    has_common_app: credential?.has_common_app ?? false,
    common_app_email: credential?.common_app_email || '',
    common_app_password: '',
    role: credential?.role || '',
    notes: credential?.notes || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when credential changes
  useEffect(() => {
    setCredentialType(credential?.credential_type || 'student')
    setFormData({
      label: credential?.label || '',
      gmail_email: credential?.gmail_email || '',
      gmail_password: '',
      has_common_app: credential?.has_common_app ?? false,
      common_app_email: credential?.common_app_email || '',
      common_app_password: '',
      role: credential?.role || '',
      notes: credential?.notes || '',
    })
  }, [credential])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave({ ...formData, credential_type: credentialType })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStudent = credentialType === 'student'
  const isTeacherOrCounsellor = credentialType === 'teacher' || credentialType === 'counsellor'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-2xl max-w-md w-full p-6 my-4">
        <h2 className="text-xl font-bold text-on-surface mb-1">
          {isNew ? 'Add Credentials' : `Edit — ${credential?.label}`}
        </h2>
        <p className="text-sm text-on-surface-variant mb-5">
          {isNew
            ? 'The platform will use these to log in automatically on behalf of this person.'
            : 'Update the stored credentials. Leave passwords blank to keep existing ones.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Credential type — only on create */}
          {isNew && (
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Who are these credentials for?
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['student', 'teacher', 'counsellor'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setCredentialType(t)
                      setFormData((f) => ({ ...f, label: CREDENTIAL_LABELS[t] }))
                    }}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all capitalize ${
                      credentialType === t
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant hover:border-primary/40'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Label */}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              {isTeacherOrCounsellor ? 'Full Name' : 'Label'}
            </label>
            <input
              type="text"
              value={formData.label}
              placeholder={isTeacherOrCounsellor ? 'e.g. Mr. Johnson' : 'Student'}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* Role — teachers and counsellors only */}
          {isTeacherOrCounsellor && (
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                {credentialType === 'teacher' ? 'Subject / Role' : 'Title'}
              </label>
              <input
                type="text"
                value={formData.role}
                placeholder={credentialType === 'teacher' ? 'e.g. Physics Teacher, AP English Teacher' : 'e.g. School Counselor, Guidance Counselor'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary"
              />
              <p className="mt-1 text-xs text-on-surface-variant">
                Used by the platform to fill in their recommender profile on Common App.
              </p>
            </div>
          )}

          {/* Gmail email */}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              Gmail Address
            </label>
            <input
              type="email"
              value={formData.gmail_email}
              placeholder="example@gmail.com"
              onChange={(e) => setFormData({ ...formData, gmail_email: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary"
              required
            />
          </div>

          {/* Gmail password */}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              Gmail Password
            </label>
            <input
              type="password"
              placeholder={isNew ? 'Enter Gmail password' : 'Leave blank to keep current'}
              value={formData.gmail_password}
              onChange={(e) => setFormData({ ...formData, gmail_password: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary"
              required={isNew}
            />
          </div>

          {/* ── Student-only: Common App section ───────────────────────── */}
          {isStudent && (
            <div className="border border-outline-variant/30 rounded-xl p-4 space-y-4 bg-surface-container-lowest">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Common App
              </p>

              {/* Has account toggle */}
              <div>
                <p className="text-sm font-medium text-on-surface mb-2">
                  Does this student already have a Common App account?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((f) => ({ ...f, has_common_app: false }))}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      !formData.has_common_app
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant hover:border-primary/40'
                    }`}
                  >
                    No — Create one
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((f) => ({ ...f, has_common_app: true }))}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      formData.has_common_app
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant hover:border-primary/40'
                    }`}
                  >
                    Yes — Log in
                  </button>
                </div>

                {!formData.has_common_app && (
                  <p className="mt-2 text-xs text-on-surface-variant bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    The platform will open Common App, register using the student's info from their profile, then check their Gmail for the activation email and confirm the account automatically.
                  </p>
                )}
              </div>

              {/* Common App credentials — only if existing account */}
              {formData.has_common_app && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                      Common App Email
                    </label>
                    <input
                      type="email"
                      value={formData.common_app_email}
                      placeholder="Usually same as Gmail"
                      onChange={(e) => setFormData({ ...formData, common_app_email: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary"
                    />
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Leave blank if it's the same as Gmail above.
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                      Common App Password
                    </label>
                    <input
                      type="password"
                      placeholder={isNew ? 'Common App password' : 'Leave blank to keep current'}
                      value={formData.common_app_password}
                      onChange={(e) => setFormData({ ...formData, common_app_password: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary"
                    />
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Leave blank if it's the same as Gmail password above.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              Notes <span className="font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary resize-none h-16"
              placeholder="Any extra info..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isNew ? 'Add Credential' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CredentialsPage() {
  const params = useParams<{ id: string }>()
  const [student, setStudent] = useState<Student | null>(null)
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadCredentials = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<Credential[]>(`/api/credentials?student_id=${params.id}`)
      setCredentials(Array.isArray(res) ? res : (res as any).credentials || [])
    } catch (e: any) {
      showToast(e.message || 'Failed to load credentials', 'error')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    apiFetch<Student>(`/api/students/${params.id}`).then(setStudent).catch(() => {})
    loadCredentials()
  }, [params.id, loadCredentials])

  const handleSaveCredential = async (data: Partial<Credential> & { credential_type?: string }) => {
    try {
      if (editingCredential?.id) {
        // Build a clean PATCH payload — never send empty strings because they
        // fail backend validation (min_length=1 on passwords, EmailStr on emails).
        const patch: Record<string, unknown> = {}
        if (data.label)                          patch.label = data.label
        if (data.gmail_email)                    patch.gmail_email = data.gmail_email
        if (data.gmail_password)                 patch.gmail_password = data.gmail_password
        if (data.has_common_app !== undefined)   patch.has_common_app = data.has_common_app
        if (data.has_common_app && data.common_app_email)    patch.common_app_email = data.common_app_email
        if (data.has_common_app && data.common_app_password) patch.common_app_password = data.common_app_password
        // Allow clearing role/notes by sending null for empty strings
        patch.role  = data.role  || null
        patch.notes = data.notes || null

        await apiFetch<Credential>(`/api/credentials/${editingCredential.id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        })
        showToast('Credential updated!')
      } else {
        await apiFetch<Credential>('/api/credentials', {
          method: 'POST',
          body: JSON.stringify({
            student_id: params.id,
            credential_type: data.credential_type || 'student',
            label: data.label,
            gmail_email: data.gmail_email,
            gmail_password: data.gmail_password,
            has_common_app: data.has_common_app ?? false,
            common_app_email: data.common_app_email || null,
            common_app_password: data.common_app_password || null,
            role: data.role || null,
            notes: data.notes,
          }),
        })
        showToast('Credential added!')
      }
      await loadCredentials()
    } catch (e: any) {
      showToast(e.message || 'Failed to save credential', 'error')
    }
  }

  const handleDeleteCredential = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this credential?')) return
    try {
      await apiFetch<void>(`/api/credentials/${id}`, { method: 'DELETE' })
      showToast('Credential deleted!')
      await loadCredentials()
    } catch (e: any) {
      showToast(e.message || 'Failed to delete credential', 'error')
    }
  }

  const handleTestCredential = async (id: string) => {
    try {
      const res = await apiFetch<{ test_result: string }>(`/api/credentials/${id}/test`, {
        method: 'POST',
      })
      await loadCredentials()
      showToast(`Connection test: ${res.status || res.test_result || 'done'}`)
    } catch (e: any) {
      showToast(e.message || 'Test failed', 'error')
    }
  }

  const credentialsByType = {
    student: credentials.filter((c) => c.credential_type === 'student'),
    teacher: credentials.filter((c) => c.credential_type === 'teacher'),
    counsellor: credentials.filter((c) => c.credential_type === 'counsellor'),
  }

  const SECTION_META = {
    student: {
      icon: 'person',
      color: '#1D9E75',
      hint: 'The student\'s Gmail and Common App access.',
    },
    teacher: {
      icon: 'school',
      color: '#185FA5',
      hint: 'Platform logs in to check for Common App invitation links.',
    },
    counsellor: {
      icon: 'groups',
      color: '#854F0B',
      hint: 'Platform logs in to check for Common App invitation links.',
    },
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-xl text-white text-[13px] font-semibold shadow-xl ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <StudentTabs studentId={params.id} active="credentials" />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <span className="material-symbols-outlined text-primary text-2xl">lock</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Credential Vault</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Give the platform login access — it handles everything else automatically.
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditingCredential(null); setIsModalOpen(true) }}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:opacity-90 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add Credentials
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      ) : credentials.length === 0 ? (
        <div className="bg-surface-container-low rounded-2xl p-12 text-center border border-outline-variant/20">
          <div className="p-4 rounded-xl bg-primary/10 inline-block mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">lock_open</span>
          </div>
          <h3 className="text-lg font-semibold text-on-surface mb-2">No credentials added yet</h3>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            Add the student's Gmail email and password. The platform will log in, handle Common App, and monitor emails automatically — no App Passwords or extra setup needed.
          </p>
          <button
            onClick={() => { setEditingCredential(null); setIsModalOpen(true) }}
            className="mt-6 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-colors inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add First Credential
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {(['student', 'teacher', 'counsellor'] as const).map((type) => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ color: SECTION_META[type].color }}
                >
                  {SECTION_META[type].icon}
                </span>
                <h2 className="text-lg font-bold text-on-surface">{CREDENTIAL_LABELS[type]}</h2>
              </div>
              <p className="text-xs text-on-surface-variant mb-4 pl-7">{SECTION_META[type].hint}</p>

              {credentialsByType[type].length === 0 ? (
                <p className="text-sm text-on-surface-variant italic pl-1">No credentials added</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {credentialsByType[type].map((cred) => (
                    <CredentialCard
                      key={cred.id}
                      credential={cred}
                      onEdit={(c) => { setEditingCredential(c); setIsModalOpen(true) }}
                      onDelete={handleDeleteCredential}
                      onTest={handleTestCredential}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CredentialModal
        credential={editingCredential}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCredential(null) }}
        onSave={handleSaveCredential}
      />
    </div>
  )
}
