'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { Play, Clock, CheckCircle, AlertCircle, RefreshCw, Timer } from 'lucide-react'

interface CronJob {
  id: string
  name: string
  next_run_time: string | null
  trigger: string
}

interface RunResult {
  job_id: string
  status: 'triggered' | 'error'
  message: string
}

const JOB_LABELS: Record<string, { label: string; description: string }> = {
  morning_briefing: {
    label: 'Morning Briefing',
    description: 'Runs the Coordinator Agent for all agencies — sends daily briefing summaries to counselors.',
  },
  evening_summary: {
    label: 'Evening Summary',
    description: 'Runs the Coordinator Agent in evening mode — summarizes today\'s student activity and deadlines.',
  },
  deadline_tracker_morning: {
    label: 'Deadline Tracker (Morning)',
    description: 'Scans all active applications for upcoming deadlines and notifies relevant staff.',
  },
  deadline_tracker_noon: {
    label: 'Emergency Deadlines (Noon)',
    description: 'Emergency alert pass at noon — flags deadlines within 24–48 hours.',
  },
  deadline_tracker_evening: {
    label: 'Emergency Deadlines (Evening)',
    description: 'Second emergency alert pass at 6PM — catches any missed critical deadlines.',
  },
  email_sync: {
    label: 'Email Sync',
    description: 'Syncs all connected email accounts across all agencies. Runs every hour.',
  },
}

function formatNextRun(nextRun: string | null) {
  if (!nextRun) return { text: 'Not scheduled', soon: false }
  const d = new Date(nextRun)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffMin = Math.round(diffMs / 60000)

  if (diffMs < 0) return { text: 'Overdue', soon: true }
  if (diffMin < 60) return { text: `in ${diffMin}m`, soon: true }
  const diffH = Math.floor(diffMin / 60)
  const remMin = diffMin % 60
  if (diffH < 24) return { text: `in ${diffH}h ${remMin}m`, soon: false }
  return { text: d.toLocaleString(), soon: false }
}

export default function SchedulerPage() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [runResults, setRunResults] = useState<Record<string, RunResult>>({})
  const [running, setRunning] = useState<string | null>(null)

  const loadJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<{ jobs: CronJob[] }>('/api/super-admin/scheduler')
      setJobs(data.jobs || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load scheduler.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
    // Auto-refresh every 30s so next_run_time stays fresh
    const interval = setInterval(loadJobs, 30000)
    return () => clearInterval(interval)
  }, [loadJobs])

  async function runNow(jobId: string) {
    setRunning(jobId)
    setRunResults((prev) => ({ ...prev, [jobId]: { job_id: jobId, status: 'triggered', message: 'Running…' } }))
    try {
      const result = await apiFetch<{ job_id: string; status: string; message: string }>(
        `/api/super-admin/scheduler/${jobId}/run`,
        { method: 'POST' }
      )
      setRunResults((prev) => ({
        ...prev,
        [jobId]: {
          job_id: jobId,
          status: result.status === 'triggered' ? 'triggered' : 'error',
          message: result.message || 'Job triggered.',
        },
      }))
    } catch (err: any) {
      setRunResults((prev) => ({
        ...prev,
        [jobId]: { job_id: jobId, status: 'error', message: err.message || 'Failed to trigger job.' },
      }))
    } finally {
      setRunning(null)
    }
  }

  // Sort: jobs with next_run_time first, then by next run time asc
  const sorted = [...jobs].sort((a, b) => {
    if (!a.next_run_time && !b.next_run_time) return 0
    if (!a.next_run_time) return 1
    if (!b.next_run_time) return -1
    return new Date(a.next_run_time).getTime() - new Date(b.next_run_time).getTime()
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-gray-900">Scheduler</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            All background cron jobs running on the platform. Trigger any job manually for testing or recovery.
          </p>
        </div>
        <button
          onClick={loadJobs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 bg-white rounded-[10px] border border-gray-200 shadow-sm px-5 py-4">
        <div className={`w-2 h-2 rounded-full ${jobs.length > 0 ? 'bg-[#1D9E75]' : 'bg-gray-300'} shadow-[0_0_0_3px_rgba(29,158,117,0.15)]`} />
        <span className="text-[13px] font-medium text-gray-700">
          {loading
            ? 'Connecting to scheduler…'
            : error
            ? 'Scheduler unreachable'
            : `Scheduler running · ${jobs.length} active jobs`}
        </span>
        {!loading && !error && (
          <span className="ml-auto text-[11px] text-gray-400 font-mono">Asia/Tashkent timezone</span>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[10px] px-5 py-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-red-700">Could not reach the scheduler</p>
            <p className="text-[12px] text-red-500 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Job cards */}
      {loading && jobs.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[88px] bg-gray-100 rounded-[10px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((job) => {
            const meta = JOB_LABELS[job.id]
            const { text: nextRunText, soon } = formatNextRun(job.next_run_time)
            const result = runResults[job.id]
            const isRunning = running === job.id

            return (
              <div
                key={job.id}
                className="bg-white rounded-[10px] border border-gray-200 shadow-sm px-5 py-4 flex items-start gap-4"
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-lg bg-[#E1F5EE] flex items-center justify-center shrink-0 mt-0.5">
                  <Timer size={16} className="text-[#1D9E75]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-semibold text-gray-900">
                      {meta?.label || job.name || job.id}
                    </p>
                    <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{job.id}</span>
                  </div>
                  {meta?.description && (
                    <p className="text-[12px] text-gray-400 mt-0.5 leading-relaxed">{meta.description}</p>
                  )}

                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    {/* Trigger (cron expression) */}
                    {job.trigger && (
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                        {job.trigger}
                      </span>
                    )}

                    {/* Next run */}
                    <div className="flex items-center gap-1">
                      <Clock size={11} className={soon ? 'text-amber-500' : 'text-gray-300'} />
                      <span className={`text-[11px] font-medium ${soon ? 'text-amber-600' : 'text-gray-400'}`}>
                        Next: {nextRunText}
                      </span>
                    </div>

                    {/* Run result */}
                    {result && (
                      <div className={`flex items-center gap-1.5 text-[11px] font-medium ${result.status === 'triggered' ? 'text-[#1D9E75]' : 'text-red-600'}`}>
                        {result.status === 'triggered' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                        {result.message}
                      </div>
                    )}
                  </div>
                </div>

                {/* Run Now button */}
                <button
                  onClick={() => runNow(job.id)}
                  disabled={isRunning || running !== null}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                    isRunning
                      ? 'bg-[#1D9E75]/20 text-[#1D9E75] cursor-wait'
                      : running !== null
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#E1F5EE] text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Running…
                    </>
                  ) : (
                    <>
                      <Play size={13} />
                      Run Now
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer note */}
      {!loading && !error && (
        <p className="text-[11px] text-gray-300 text-center pb-2">
          Auto-refreshes every 30 seconds. All times shown in your local timezone.
        </p>
      )}
    </div>
  )
}
