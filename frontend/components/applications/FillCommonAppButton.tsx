'use client'
// @ts-nocheck

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@/lib/supabase-browser'
import { browserAgentApi } from '@/lib/api'

interface Props {
  studentId: string
  applicationId: string
  applicationStatus: string
  universityName: string
}

type JobStatus =
  | 'idle'
  | 'pending'
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'rejected'

const STATUS_LABELS: Record<JobStatus, string> = {
  idle:             'Fill Common App',
  pending:          'Starting…',
  running:          'Running…',
  awaiting_approval:'Awaiting Approval',
  completed:        'Submitted ✓',
  failed:           'Failed — Retry',
  rejected:         'Rejected — Retry',
}

const STATUS_COLORS: Record<JobStatus, string> = {
  idle:             '#1D9E75',
  pending:          '#6B7280',
  running:          '#185FA5',
  awaiting_approval:'#D97706',
  completed:        '#166534',
  failed:           '#B91C1C',
  rejected:         '#B91C1C',
}

const STATUS_BG: Record<JobStatus, string> = {
  idle:             '#EAF3DE',
  pending:          '#F3F4F6',
  running:          '#E6F1FB',
  awaiting_approval:'#FEF3C7',
  completed:        '#DCFCE7',
  failed:           '#FEE2E2',
  rejected:         '#FEE2E2',
}

const ACTIVE_STATUSES: JobStatus[] = ['pending', 'running', 'awaiting_approval']

export default function FillCommonAppButton({
  studentId,
  applicationId,
  applicationStatus,
  universityName,
}: Props) {
  const [jobStatus, setJobStatus] = useState<JobStatus>(
    applicationStatus === 'submitted' ? 'completed' : 'idle'
  )
  const [jobId, setJobId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmPending, setConfirmPending] = useState(false)

  // Memoize client so it's created only once — prevents subscription leaks on re-render
  const supabase = useMemo(() => createBrowserClient(), [])

  // ── Subscribe to Realtime updates for this application's browser jobs ──
  useEffect(() => {
    if (!applicationId) return

    const channel = supabase
      .channel(`browser-job-${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_jobs',
          filter: `application_id=eq.${applicationId}`,
        },
        (payload: any) => {
          const row = payload.new as { status?: string; id?: string; agent_type?: string }
          if (row.agent_type !== 'browser') return
          const newStatus = row.status as JobStatus
          if (newStatus) {
            setJobStatus(newStatus)
            if (row.id) setJobId(row.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [applicationId, supabase])

  // ── Check for an active job on mount ──────────────────────────────────
  useEffect(() => {
    if (applicationStatus === 'submitted') {
      setJobStatus('completed')
      return
    }

    supabase
      .from('agent_jobs')
      .select('id, status')
      .eq('application_id', applicationId)
      .eq('agent_type', 'browser')
      .in('status', ACTIVE_STATUSES)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }: any) => {
        const jobs = data as any[] | null
        if (jobs && jobs.length > 0) {
          setJobId(jobs[0].id)
          setJobStatus(jobs[0].status as JobStatus)
        }
      })
  }, [applicationId, applicationStatus, supabase])

  const handleClick = useCallback(async () => {
    if (applicationStatus === 'submitted' || jobStatus === 'completed') return

    // Two-step confirm for running / awaiting states
    if (ACTIVE_STATUSES.includes(jobStatus)) return

    if (!confirmPending) {
      setConfirmPending(true)
      setTimeout(() => setConfirmPending(false), 3000)
      return
    }

    setConfirmPending(false)
    setLoading(true)
    setError(null)

    try {
      const result = await browserAgentApi.start(studentId, applicationId)
      setJobId(result.job_id)
      setJobStatus('pending')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start browser agent'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [applicationStatus, jobStatus, confirmPending, studentId, applicationId])

  const isDisabled =
    loading ||
    applicationStatus === 'submitted' ||
    jobStatus === 'completed' ||
    ACTIVE_STATUSES.includes(jobStatus)

  const label = confirmPending
    ? 'Click again to confirm'
    : loading
    ? 'Starting…'
    : STATUS_LABELS[jobStatus] ?? 'Fill Common App'

  const color = STATUS_COLORS[jobStatus] ?? '#1D9E75'
  const bg = STATUS_BG[jobStatus] ?? '#EAF3DE'

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        title={
          ACTIVE_STATUSES.includes(jobStatus)
            ? 'Browser agent is active — check Telegram for approval requests'
            : jobStatus === 'awaiting_approval'
            ? 'Waiting for your approval in Telegram'
            : confirmPending
            ? `Confirm: start filling Common App for ${universityName}?`
            : `Start AI browser to fill Common App for ${universityName}`
        }
        style={{
          backgroundColor: isDisabled ? '#F3F4F6' : bg,
          color: isDisabled ? '#9CA3AF' : color,
          border: `1px solid ${isDisabled ? '#E5E7EB' : color}30`,
          borderRadius: '6px',
          padding: '5px 12px',
          fontSize: '12px',
          fontWeight: 500,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Spinner for active states */}
        {ACTIVE_STATUSES.includes(jobStatus) && jobStatus !== 'pending' && (
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              border: `2px solid ${color}40`,
              borderTop: `2px solid ${color}`,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        )}
        {/* Robot icon for idle */}
        {!ACTIVE_STATUSES.includes(jobStatus) && (
          <span style={{ fontSize: 13 }}>
            {jobStatus === 'completed' ? '✓' : jobStatus.includes('ailed') || jobStatus === 'rejected' ? '↺' : '🤖'}
          </span>
        )}
        {label}
      </button>

      {/* Status detail row */}
      {(jobStatus === 'awaiting_approval' || error) && (
        <p style={{ fontSize: 11, color: error ? '#B91C1C' : '#D97706', margin: 0 }}>
          {error || '⏳ Check Telegram to approve the next step'}
        </p>
      )}

      {jobStatus === 'running' && (
        <p style={{ fontSize: 11, color: '#185FA5', margin: 0 }}>
          Browser is filling the form — approval request coming soon
        </p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
