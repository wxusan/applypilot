'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { agentJobsApi } from '@/lib/api'
import { Check, X } from 'lucide-react'

export default function ApprovalActions({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleApprove = async () => {
    setLoading('approve')
    setError(null)
    try {
      await agentJobsApi.approve(jobId)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please enter a reason for rejection.')
      return
    }
    setLoading('reject')
    setError(null)
    try {
      await agentJobsApi.reject(jobId, rejectReason)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(null)
    }
  }

  if (showRejectForm) {
    return (
      <div className="shrink-0 flex flex-col gap-2 min-w-[200px]">
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Reason for rejection…"
          rows={2}
          className="w-full px-3 py-2 text-[12px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-brand resize-none"
          style={{ border: '0.5px solid #d1d5db' }}
        />
        {error && <p className="text-[11px] text-danger-text">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleReject}
            disabled={loading === 'reject'}
            className="flex-1 h-8 rounded-[6px] text-[12px] font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-60"
            style={{ backgroundColor: '#A32D2D' }}
          >
            <X size={12} />
            {loading === 'reject' ? 'Rejecting…' : 'Reject'}
          </button>
          <button
            onClick={() => { setShowRejectForm(false); setError(null) }}
            className="flex-1 h-8 rounded-[6px] text-[12px] text-gray-500"
            style={{ border: '0.5px solid #e5e7eb' }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="shrink-0 flex flex-col gap-2">
      {error && <p className="text-[11px] text-danger-text">{error}</p>}
      <button
        onClick={handleApprove}
        disabled={!!loading}
        className="h-9 px-4 rounded-[6px] text-[13px] font-medium text-white flex items-center gap-2 disabled:opacity-60"
        style={{ backgroundColor: '#1D9E75' }}
      >
        <Check size={13} />
        {loading === 'approve' ? 'Approving…' : 'Approve'}
      </button>
      <button
        onClick={() => setShowRejectForm(true)}
        disabled={!!loading}
        className="h-9 px-4 rounded-[6px] text-[13px] text-gray-500 flex items-center gap-2 disabled:opacity-60"
        style={{ border: '0.5px solid #e5e7eb' }}
      >
        <X size={13} />
        Reject
      </button>
    </div>
  )
}
