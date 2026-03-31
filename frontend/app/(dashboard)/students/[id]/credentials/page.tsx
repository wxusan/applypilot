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
  common_app_email?: string
  common_app_password?: string
  notes?: string
  last_tested?: string
  test_result?: string
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
  const testConfig = TEST_RESULT_CONFIG[credential.test_result || ''] || {
    label: 'Not tested',
    color: '#6B7280',
    bg: '#F3F4F6',
  }

  return (
    <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-on-surface">{credential.label}</h3>
          <p className="text-xs text-on-surface-variant mt-1">{credential.gmail_email}</p>
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

      <div className="space-y-3 mb-4 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-on-surface-variant">Gmail:</span>
          <span className="font-mono text-xs text-on-surface">{credential.gmail_email}</span>
        </div>
        {credential.common_app_email && (
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant">Common App:</span>
            <span className="font-mono text-xs text-on-surface">{credential.common_app_email}</span>
          </div>
        )}
        {credential.last_tested && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-on-surface-variant">Last tested:</span>
            <span className="text-on-surface">{new Date(credential.last_tested).toLocaleDateString()}</span>
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
        {credential.test_result && (
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
    common_app_email: credential?.common_app_email || '',
    common_app_password: '',
    notes: credential?.notes || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-on-surface mb-4">
          {isNew ? 'Add Credential' : `Edit ${credential?.label} Credentials`}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isNew && (
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase">Credential Type</label>
              <select
                value={credentialType}
                onChange={(e) => {
                  const t = e.target.value as 'student' | 'teacher' | 'counsellor'
                  setCredentialType(t)
                  setFormData({ ...formData, label: CREDENTIAL_LABELS[t] })
                }}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="counsellor">Counsellor</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase">Label</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary"
              disabled={!isNew}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase">Gmail Email</label>
            <input
              type="email"
              value={formData.gmail_email}
              onChange={(e) => setFormData({ ...formData, gmail_email: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase">Gmail Password</label>
            <input
              type="password"
              placeholder={isNew ? 'Gmail password' : 'Leave blank to keep current'}
              value={formData.gmail_password}
              onChange={(e) => setFormData({ ...formData, gmail_password: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary"
              required={isNew}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase">Common App Email</label>
            <input
              type="email"
              value={formData.common_app_email}
              onChange={(e) => setFormData({ ...formData, common_app_email: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase">Common App Password</label>
            <input
              type="password"
              placeholder="Leave blank to keep current"
              value={formData.common_app_password}
              onChange={(e) => setFormData({ ...formData, common_app_password: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary resize-none h-20"
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
              {isSubmitting ? 'Saving...' : isNew ? 'Add Credential' : 'Save'}
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
      const res = await apiFetch<{ credentials: Credential[] }>(
        `/api/credentials?student_id=${params.id}`
      )
      setCredentials(res.credentials || [])
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
        await apiFetch<Credential>(`/api/credentials/${editingCredential.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
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
            common_app_email: data.common_app_email,
            common_app_password: data.common_app_password,
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
      showToast(`Connection test: ${res.test_result}`)
    } catch (e: any) {
      showToast(e.message || 'Test failed', 'error')
    }
  }

  const credentialsByType = {
    student: credentials.filter((c) => c.credential_type === 'student'),
    teacher: credentials.filter((c) => c.credential_type === 'teacher'),
    counsellor: credentials.filter((c) => c.credential_type === 'counsellor'),
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
              Securely stores login credentials used by the automation agent
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditingCredential(null); setIsModalOpen(true) }}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:opacity-90 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add Credential
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
          <p className="text-sm text-on-surface-variant max-w-md">
            Add Gmail credentials to enable automation. You can add credentials for the student, teacher, and counsellor.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {(['student', 'teacher', 'counsellor'] as const).map((type) => (
            <div key={type}>
              <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ color: type === 'student' ? '#1D9E75' : '#6B7280' }}
                >
                  {type === 'student' ? 'person' : type === 'teacher' ? 'school' : 'groups'}
                </span>
                {CREDENTIAL_LABELS[type]}
              </h2>

              {credentialsByType[type].length === 0 ? (
                <p className="text-sm text-on-surface-variant italic">No credentials added</p>
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
