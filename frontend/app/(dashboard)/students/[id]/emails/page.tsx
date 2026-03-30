'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import StudentTabs from '@/components/students/StudentTabs'

interface EmailMonitor {
  id: string
  student_id: string
  received_at: string
  from_email: string
  subject: string
  classification: 'portal_activation' | 'document_request' | 'decision' | 'general_university' | 'ignore'
  university?: string
  summary?: string
  is_actioned: boolean
}

interface Student {
  id: string
  full_name: string
}

const CLASSIFICATION_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  portal_activation: {
    label: 'Portal Activation',
    color: '#2563EB',
    bg: '#DBEAFE',
    icon: 'login',
  },
  document_request: {
    label: 'Doc Request',
    color: '#D97706',
    bg: '#FEF3C7',
    icon: 'article',
  },
  decision: {
    label: 'Decision',
    color: '#059669',
    bg: '#D1FAE5',
    icon: 'check_circle',
  },
  general_university: {
    label: 'University',
    color: '#6B7280',
    bg: '#F3F4F6',
    icon: 'mail',
  },
  ignore: {
    label: 'Ignored',
    color: '#9CA3AF',
    bg: '#F9FAFB',
    icon: 'block',
  },
}

type FilterTab = 'all' | 'portal_activation' | 'document_request' | 'decision' | 'ignored'

function EmailRow({
  email,
  onAction,
  onToggleActioned,
}: {
  email: EmailMonitor
  onAction: (email: EmailMonitor, action: string) => void
  onToggleActioned: (emailId: string, isActioned: boolean) => void
}) {
  const config = CLASSIFICATION_CONFIG[email.classification] || CLASSIFICATION_CONFIG.general_university

  const renderAction = () => {
    switch (email.classification) {
      case 'portal_activation':
        return (
          <button
            onClick={() => onAction(email, 'activate_portal')}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-primary text-on-primary hover:opacity-90 transition-colors"
          >
            Activate Portal
          </button>
        )
      case 'document_request':
        return (
          <button
            onClick={() => onAction(email, 'handle_document')}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-primary text-on-primary hover:opacity-90 transition-colors"
          >
            Handle
          </button>
        )
      case 'decision':
        return (
          <button
            onClick={() => onAction(email, 'view_decision')}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-primary text-on-primary hover:opacity-90 transition-colors"
          >
            View Decision
          </button>
        )
      default:
        return null
    }
  }

  return (
    <tr className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
      <td className="px-4 py-3 text-xs text-on-surface-variant">
        {new Date(email.received_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-sm text-on-surface truncate max-w-48">{email.from_email}</td>
      <td className="px-4 py-3 text-sm text-on-surface truncate max-w-96">{email.subject}</td>
      <td className="px-4 py-3">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ color: config.color, background: config.bg }}
        >
          <span className="material-symbols-outlined text-sm">{config.icon}</span>
          {config.label}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-on-surface-variant">{email.university || '—'}</td>
      <td className="px-4 py-3 text-xs text-on-surface-variant max-w-xs truncate">{email.summary || '—'}</td>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={email.is_actioned}
          onChange={(e) => onToggleActioned(email.id, e.target.checked)}
          className="rounded cursor-pointer"
        />
      </td>
      <td className="px-4 py-3 text-right">{renderAction()}</td>
    </tr>
  )
}

export default function EmailMonitorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [emails, setEmails] = useState<EmailMonitor[]>([])
  const [loading, setLoading] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadEmails = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<{ emails: EmailMonitor[] }>(
        `/api/email-monitor?student_id=${params.id}`
      )
      setEmails(res.emails || [])
    } catch (e: any) {
      showToast(e.message || 'Failed to load emails', 'error')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    apiFetch<Student>(`/api/students/${params.id}`).then(setStudent).catch(() => {})
    loadEmails()
  }, [params.id, loadEmails])

  const handleScanNow = async () => {
    setIsScanning(true)
    try {
      await apiFetch<void>(`/api/email-monitor/scan?student_id=${params.id}`, {
        method: 'POST',
      })
      showToast('Scanning email inbox...')
      await loadEmails()
    } catch (e: any) {
      showToast(e.message || 'Scan failed', 'error')
    } finally {
      setIsScanning(false)
    }
  }

  const handleEmailAction = async (email: EmailMonitor, action: string) => {
    try {
      await apiFetch<void>(`/api/email-monitor/${email.id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      })

      if (action === 'activate_portal') {
        router.push(`/students/${params.id}/portals`)
      } else if (action === 'handle_document') {
        router.push(`/students/${params.id}/documents`)
      }

      showToast('Action completed!')
      await loadEmails()
    } catch (e: any) {
      showToast(e.message || 'Action failed', 'error')
    }
  }

  const handleToggleActioned = async (emailId: string, isActioned: boolean) => {
    try {
      await apiFetch<void>(`/api/email-monitor/${emailId}/action`, {
        method: 'POST',
        body: JSON.stringify({ action: isActioned ? 'mark_actioned' : 'mark_pending' }),
      })
      await loadEmails()
    } catch (e: any) {
      showToast(e.message || 'Failed to update email', 'error')
    }
  }

  const filteredEmails = emails.filter((email) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'ignored') return email.classification === 'ignore'
    return email.classification === activeFilter
  })

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: emails.length },
    {
      key: 'portal_activation',
      label: 'Portal Activations',
      count: emails.filter((e) => e.classification === 'portal_activation').length,
    },
    {
      key: 'document_request',
      label: 'Document Requests',
      count: emails.filter((e) => e.classification === 'document_request').length,
    },
    {
      key: 'decision',
      label: 'Decisions',
      count: emails.filter((e) => e.classification === 'decision').length,
    },
    {
      key: 'ignored',
      label: 'Ignored',
      count: emails.filter((e) => e.classification === 'ignore').length,
    },
  ]

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

      <StudentTabs studentId={params.id} active="emails" />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <span className="material-symbols-outlined text-primary text-2xl">email</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Email Monitor</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Track university emails from the student's Gmail inbox
            </p>
          </div>
        </div>
        <button
          onClick={handleScanNow}
          disabled={isScanning}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          {isScanning ? 'Scanning...' : 'Scan Now'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-outline-variant/20">
        <div className="flex gap-6 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`pb-4 text-sm font-medium transition-all relative whitespace-nowrap ${
                activeFilter === tab.key
                  ? 'text-primary font-bold border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
              style={activeFilter === tab.key ? { marginBottom: '-1px' } : {}}
            >
              {tab.label}
              <span className="ml-2 text-xs text-on-surface-variant">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Email Table or Empty State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      ) : filteredEmails.length === 0 ? (
        <div className="bg-surface-container-low rounded-2xl p-12 text-center border border-outline-variant/20">
          <div className="p-4 rounded-xl bg-primary/10 inline-block mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">mail_outline</span>
          </div>
          <h3 className="text-lg font-semibold text-on-surface mb-2">No emails found</h3>
          <p className="text-sm text-on-surface-variant max-w-md mb-6">
            {activeFilter === 'all'
              ? 'No university emails found yet. Click "Scan Now" to check the student\'s Gmail inbox.'
              : `No ${filterTabs.find((t) => t.key === activeFilter)?.label.toLowerCase()} emails found.`}
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-outline-variant/20 overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-container-low border-b border-outline-variant/20">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase">
                  Received
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase">
                  From
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase">
                  Classification
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase">
                  University
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase">
                  Summary
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase">
                  Actioned
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-on-surface-variant uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmails.map((email) => (
                <EmailRow
                  key={email.id}
                  email={email}
                  onAction={handleEmailAction}
                  onToggleActioned={handleToggleActioned}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
