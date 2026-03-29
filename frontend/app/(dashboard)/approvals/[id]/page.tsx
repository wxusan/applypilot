'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiFetch, agentJobsApi } from '@/lib/api'

interface AgentJob {
  id: string
  agent_type: string
  job_type: string
  status: string
  approval_message?: string
  screenshot_urls?: string[]
  output_data?: Record<string, unknown>
  input_data?: Record<string, unknown>
  error_message?: string
  created_at: string
  started_at?: string
  completed_at?: string
  approved_at?: string
  approved_by?: string
  rejected_reason?: string
  student?: { id: string; full_name: string; status: string } | null
}

const JOB_TYPE_LABELS: Record<string, string> = {
  fill_common_app:       'Fill Common App',
  fill_university_portal:'Fill University Portal',
  upload_document:       'Upload Document',
  send_email:            'Send Email',
  scrape_requirements:   'Scrape Requirements',
  essay_review:          'Essay Review',
  essay_generation:      'Essay Generation',
  email_reply:           'Email Reply Draft',
  college_fit:           'College Fit Analysis',
  submit_application:    'Submit Application',
  deadline_reminder:     'Deadline Reminder',
}

const AGENT_TYPE_LABELS: Record<string, string> = {
  browser: 'Browser Agent',
  writer:  'Writer Agent',
  email:   'Email Agent',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:           { label: 'Pending',            color: '#6B7280', bg: '#F3F4F6', icon: 'schedule' },
  running:           { label: 'Running',            color: '#2563EB', bg: '#DBEAFE', icon: 'sync' },
  awaiting_approval: { label: 'Awaiting Approval',  color: '#D97706', bg: '#FEF3C7', icon: 'pending_actions' },
  approved:          { label: 'Approved',           color: '#059669', bg: '#D1FAE5', icon: 'check_circle' },
  rejected:          { label: 'Rejected',           color: '#DC2626', bg: '#FEE2E2', icon: 'cancel' },
  completed:         { label: 'Completed',          color: '#059669', bg: '#D1FAE5', icon: 'task_alt' },
  failed:            { label: 'Failed',             color: '#DC2626', bg: '#FEE2E2', icon: 'error' },
}

export default function ApprovalDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [job, setJob] = useState<AgentJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    setLoading(true)
    apiFetch<AgentJob>(`/api/agent-jobs/${params.id}`)
      .then((data) => {
        setJob(data)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message || 'Failed to load job')
        setLoading(false)
      })
  }, [params.id])

  const handleApprove = async () => {
    if (!job) return
    setIsApproving(true)
    try {
      const updated = await agentJobsApi.approve(job.id) as AgentJob
      setJob({ ...job, ...updated })
      showToast('Job approved!')
      setTimeout(() => router.push('/approvals'), 1500)
    } catch (e: any) {
      showToast(e.message || 'Failed to approve', 'error')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!job || !rejectReason.trim()) return
    setIsRejecting(true)
    try {
      await agentJobsApi.reject(job.id, rejectReason)
      setJob({ ...job, status: 'rejected', rejected_reason: rejectReason })
      setShowRejectModal(false)
      showToast('Job rejected.')
      setTimeout(() => router.push('/approvals'), 1500)
    } catch (e: any) {
      showToast(e.message || 'Failed to reject', 'error')
    } finally {
      setIsRejecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-gray-400 text-4xl">sync</span>
          <p className="text-[13px] text-gray-400">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] px-4 py-3 rounded-xl">
          {error || 'Job not found'}
        </div>
        <Link href="/approvals" className="text-[13px] text-[#031635] font-semibold underline">
          ← Back to Approvals
        </Link>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending
  const jobLabel = JOB_TYPE_LABELS[job.job_type] ?? job.job_type.replace(/_/g, ' ')
  const agentLabel = AGENT_TYPE_LABELS[job.agent_type] ?? job.agent_type
  const student = Array.isArray(job.student) ? job.student[0] : job.student
  const screenshots = job.screenshot_urls ?? []

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-xl text-white text-[13px] font-semibold shadow-xl ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Breadcrumb + Header */}
      <div>
        <nav className="flex items-center gap-2 text-[12px] text-gray-400 mb-3">
          <Link href="/approvals" className="hover:text-[#031635]">Approvals</Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-[#031635] font-semibold">{jobLabel}</span>
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-[#031635]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {jobLabel}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{statusCfg.icon}</span>
                {statusCfg.label}
              </span>
              <span className="text-[12px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                {agentLabel}
              </span>
              {student && (
                <Link
                  href={`/students/${student.id}/profile`}
                  className="text-[12px] font-semibold text-[#031635] hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>person</span>
                  {student.full_name}
                </Link>
              )}
            </div>
          </div>

          {/* Action buttons for awaiting_approval */}
          {job.status === 'awaiting_approval' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowRejectModal(true)}
                className="h-9 px-4 rounded-lg text-[12px] font-semibold text-red-600 flex items-center gap-1.5"
                style={{ border: '1px solid #FECACA', backgroundColor: '#FEF2F2' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>close</span>
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="h-9 px-5 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1.5 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check</span>
                {isApproving ? 'Approving...' : 'Approve'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Main content */}
        <div className="col-span-8 space-y-4">
          {/* Approval message */}
          {job.approval_message && (
            <div className="bg-white rounded-xl p-6" style={{ border: '0.5px solid #e5e7eb' }}>
              <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-3">Agent Output</h3>
              <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg" style={{ border: '0.5px solid #e5e7eb' }}>
                {job.approval_message}
              </div>
            </div>
          )}

          {/* Output data */}
          {job.output_data && Object.keys(job.output_data).length > 0 && (
            <div className="bg-white rounded-xl p-6" style={{ border: '0.5px solid #e5e7eb' }}>
              <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-3">Output Data</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(job.output_data).map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-lg p-3" style={{ border: '0.5px solid #e5e7eb' }}>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">{k.replace(/_/g, ' ')}</p>
                    <p className="text-[13px] font-semibold text-[#031635]">{String(v ?? '—')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screenshots */}
          {screenshots.length > 0 && (
            <div className="bg-white rounded-xl p-6" style={{ border: '0.5px solid #e5e7eb' }}>
              <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-3">
                Screenshots ({screenshots.length})
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {screenshots.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative rounded-xl overflow-hidden"
                    style={{ border: '0.5px solid #e5e7eb' }}
                  >
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-300 text-4xl">screenshot_monitor</span>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="bg-white/90 text-[#031635] text-[11px] font-bold px-3 py-1.5 rounded-full">
                        View Full
                      </span>
                    </div>
                    <div className="p-2 text-[11px] text-gray-500">Screenshot {i + 1}</div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Input data */}
          {job.input_data && Object.keys(job.input_data).length > 0 && (
            <div className="bg-white rounded-xl p-6" style={{ border: '0.5px solid #e5e7eb' }}>
              <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-3">Input Data</h3>
              <div className="space-y-2">
                {Object.entries(job.input_data).map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <span className="text-[12px] text-gray-400 min-w-[140px] shrink-0">{k.replace(/_/g, ' ')}</span>
                    <span className="text-[12px] font-medium text-[#031635]">{String(v ?? '—')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {job.error_message && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h3 className="text-[12px] font-bold text-red-700 uppercase tracking-wide mb-2">Error Details</h3>
              <p className="text-[13px] text-red-700 font-mono">{job.error_message}</p>
            </div>
          )}

          {/* Rejection reason */}
          {job.status === 'rejected' && job.rejected_reason && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <h3 className="text-[12px] font-bold text-orange-700 uppercase tracking-wide mb-2">Rejection Reason</h3>
              <p className="text-[13px] text-orange-700">{job.rejected_reason}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-4">
          {/* Job metadata */}
          <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #e5e7eb' }}>
            <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-4">Job Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Job ID</p>
                <p className="text-[11px] font-mono text-gray-600 mt-0.5 break-all">{job.id}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Created</p>
                <p className="text-[12px] font-medium text-[#031635] mt-0.5">
                  {new Date(job.created_at).toLocaleString()}
                </p>
              </div>
              {job.started_at && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Started</p>
                  <p className="text-[12px] font-medium text-[#031635] mt-0.5">
                    {new Date(job.started_at).toLocaleString()}
                  </p>
                </div>
              )}
              {job.completed_at && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Completed</p>
                  <p className="text-[12px] font-medium text-[#031635] mt-0.5">
                    {new Date(job.completed_at).toLocaleString()}
                  </p>
                </div>
              )}
              {job.approved_at && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Approved</p>
                  <p className="text-[12px] font-medium text-emerald-700 mt-0.5">
                    {new Date(job.approved_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-xl p-5 space-y-2" style={{ border: '0.5px solid #e5e7eb' }}>
            <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-3">Quick Links</h3>
            {student && (
              <Link
                href={`/students/${student.id}/profile`}
                className="flex items-center gap-2 text-[12px] font-medium text-[#031635] hover:underline"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                View Student Profile
              </Link>
            )}
            {student && (
              <Link
                href={`/students/${student.id}/essays`}
                className="flex items-center gap-2 text-[12px] font-medium text-[#031635] hover:underline"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit_document</span>
                Student Essays
              </Link>
            )}
            <Link
              href="/approvals"
              className="flex items-center gap-2 text-[12px] font-medium text-gray-500 hover:text-[#031635]"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_back</span>
              Back to Queue
            </Link>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7">
            <h2 className="text-[17px] font-bold text-[#031635] mb-2">Reject Job</h2>
            <p className="text-[13px] text-gray-500 mb-5">Please provide a reason for rejecting this agent action.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Incorrect information, needs revision..."
              className="w-full h-28 text-[13px] text-gray-700 p-3 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
              style={{ border: '0.5px solid #e5e7eb' }}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2.5 rounded-lg text-[12px] font-semibold text-gray-600"
                style={{ border: '0.5px solid #e5e7eb' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isRejecting || !rejectReason.trim()}
                className="flex-1 py-2.5 rounded-lg text-[12px] font-semibold text-white disabled:opacity-50"
                style={{ background: '#DC2626' }}
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
