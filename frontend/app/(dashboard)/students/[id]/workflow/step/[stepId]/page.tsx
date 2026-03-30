'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

interface WorkflowStep {
  id: string
  step_number: number
  step_name: string
  status: 'pending' | 'queued' | 'running' | 'awaiting_approval' | 'approved' | 'completed' | 'failed' | 'rejected'
  ai_content?: string
  screenshots?: string[]
  metadata?: Record<string, unknown>
  error_message?: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#6B7280', bg: '#F3F4F6' },
  queued: { label: 'Queued', color: '#2563EB', bg: '#DBEAFE' },
  running: { label: 'Running', color: '#2563EB', bg: '#DBEAFE' },
  awaiting_approval: { label: 'Awaiting Approval', color: '#D97706', bg: '#FEF3C7' },
  approved: { label: 'Approved', color: '#1D9E75', bg: '#D1FAE5' },
  completed: { label: 'Completed', color: '#065F46', bg: '#D1FAE5' },
  failed: { label: 'Failed', color: '#991B1B', bg: '#FEE2E2' },
  rejected: { label: 'Rejected', color: '#991B1B', bg: '#FEE2E2' },
}

function ImageModal({
  src,
  caption,
  onClose,
}: {
  src: string
  caption?: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl max-w-4xl w-full flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/20">
          <p className="text-sm font-medium text-on-surface-variant">{caption || 'Screenshot'}</p>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-lg">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
          <img src={src} alt={caption} className="max-w-full max-h-full object-contain" />
        </div>
      </div>
    </div>
  )
}

export default function WorkflowStepPage() {
  const params = useParams<{ id: string; stepId: string }>()
  const router = useRouter()
  const [step, setStep] = useState<WorkflowStep | null>(null)
  const [loading, setLoading] = useState(true)
  const [editedContent, setEditedContent] = useState<string | null>(null)
  const [useEditedVersion, setUseEditedVersion] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [enlargedImage, setEnlargedImage] = useState<{ src: string; caption?: string } | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    const loadStep = async () => {
      setLoading(true)
      try {
        const res = await apiFetch<WorkflowStep>(`/api/workflow-steps/${params.stepId}`)
        setStep(res)
        setEditedContent(res.ai_content || '')
      } catch (e: any) {
        showToast(e.message || 'Failed to load step', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadStep()
  }, [params.stepId])

  const wordCount = editedContent ? editedContent.trim().split(/\s+/).length : 0

  const handleApprove = async () => {
    if (!step) return
    setIsApproving(true)
    try {
      const payload: Record<string, unknown> = {}
      if (useEditedVersion && editedContent !== step.ai_content) {
        payload.edited_content = editedContent
      }
      await apiFetch<void>(`/api/workflow-steps/${step.id}/approve`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      showToast('Step approved! Continuing workflow...')
      setTimeout(() => {
        router.push(`/students/${params.id}/workflow`)
      }, 1500)
    } catch (e: any) {
      showToast(e.message || 'Failed to approve', 'error')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!step || !rejectReason.trim()) return
    setIsRejecting(true)
    try {
      await apiFetch<void>(`/api/workflow-steps/${step.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason }),
      })
      showToast('Step rejected. Returning to workflow...')
      setTimeout(() => {
        router.push(`/students/${params.id}/workflow`)
      }, 1500)
    } catch (e: any) {
      showToast(e.message || 'Failed to reject', 'error')
    } finally {
      setIsRejecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!step) {
    return (
      <div className="bg-surface-container-low rounded-2xl p-12 text-center border border-outline-variant/20">
        <p className="text-on-surface-variant">Step not found</p>
      </div>
    )
  }

  const config = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending
  const isAwaitingApproval = step.status === 'awaiting_approval'
  const canEdit = isAwaitingApproval && step.ai_content

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

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80 transition-colors"
      >
        <span className="material-symbols-outlined">arrow_back</span>
        Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-on-surface">{step.step_name}</h1>
          <div className="flex items-center gap-3 mt-3">
            <div
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ color: config.color, background: config.bg }}
            >
              {config.label}
            </div>
            <span className="text-xs text-on-surface-variant">Step {step.step_number}</span>
          </div>
        </div>
      </div>

      {/* Screenshots */}
      {step.screenshots && step.screenshots.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-on-surface uppercase">Screenshots</h2>
          <div className="grid grid-cols-2 gap-4">
            {step.screenshots.map((screenshot, idx) => (
              <div
                key={idx}
                className="cursor-pointer rounded-xl overflow-hidden border border-outline-variant/20 hover:border-primary transition-colors"
                onClick={() => setEnlargedImage({ src: screenshot, caption: `Screenshot ${idx + 1}` })}
              >
                <img
                  src={screenshot}
                  alt={`Step screenshot ${idx + 1}`}
                  className="w-full h-40 object-cover hover:opacity-75 transition-opacity"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {step.error_message && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-900 mb-2">Error</h3>
          <p className="text-sm text-red-800">{step.error_message}</p>
        </div>
      )}

      {/* AI Content / Editor */}
      {step.ai_content && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-on-surface uppercase">AI Generated Content</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant">Word Count: {wordCount}</span>
              {canEdit && (
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={useEditedVersion}
                    onChange={(e) => setUseEditedVersion(e.target.checked)}
                    className="rounded"
                  />
                  Use my edits
                </label>
              )}
            </div>

            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              disabled={!canEdit}
              className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary resize-none h-48"
            />
          </div>
        </div>
      )}

      {/* Metadata */}
      {step.metadata && Object.keys(step.metadata).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-on-surface uppercase">Step Details</h2>
          <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20 space-y-2">
            {Object.entries(step.metadata).map(([key, value]) => (
              <div key={key} className="flex justify-between items-start gap-4 text-sm">
                <span className="font-medium text-on-surface-variant capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="text-on-surface text-right">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Bar */}
      {isAwaitingApproval && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant/20 p-6 z-40">
          <div className="flex gap-3 max-w-6xl mx-auto">
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check_circle</span>
              {isApproving ? 'Approving...' : 'Approve & Proceed'}
            </button>
            {!showRejectForm ? (
              <button
                onClick={() => setShowRejectForm(true)}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">close</span>
                Reject & Stop
              </button>
            ) : (
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleReject}
                  disabled={isRejecting || !rejectReason.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isRejecting ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectForm(false)
                    setRejectReason('')
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spacer for fixed action bar */}
      {isAwaitingApproval && <div className="h-24"></div>}

      {/* Image Modal */}
      {enlargedImage && (
        <ImageModal
          src={enlargedImage.src}
          caption={enlargedImage.caption}
          onClose={() => setEnlargedImage(null)}
        />
      )}
    </div>
  )
}
