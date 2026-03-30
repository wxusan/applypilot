'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

interface Student {
  id: string
  full_name: string
}

interface Application {
  id: string
  university_name: string
  status: string
}

interface AgentJob {
  id: string
  agent_type: string
  status: string
  student_id?: string | null
  application_id?: string | null
  created_at: string
  updated_at?: string | null
  screenshot_urls?: string[] | null
  output_data?: any
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  pending: { color: '#6B7280', bg: '#F3F4F6', label: 'Queued', icon: 'schedule' },
  running: { color: '#2563EB', bg: '#DBEAFE', label: 'Running', icon: 'auto_awesome' },
  awaiting_approval: { color: '#D97706', bg: '#FEF3C7', label: 'Review Needed', icon: 'assignment' },
  completed: { color: '#059669', bg: '#D1FAE5', label: 'Complete', icon: 'check_circle' },
  failed: { color: '#DC2626', bg: '#FEE2E2', label: 'Failed', icon: 'error' },
}

export default function CommonAppFillerPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [selectedApplication, setSelectedApplication] = useState<string>('')
  const [jobs, setJobs] = useState<AgentJob[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingApps, setLoadingApps] = useState(false)
  const [startingSession, setStartingSession] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedScreenshots, setExpandedScreenshots] = useState<string | null>(null)
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null)
  const [instructionsOpen, setInstructionsOpen] = useState(true)

  // Load students on mount
  useEffect(() => {
    const loadStudents = async () => {
      setLoadingStudents(true)
      try {
        const res = await apiFetch<{ students: Student[] }>('/api/students?limit=500')
        setStudents(res.students ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load students')
      } finally {
        setLoadingStudents(false)
      }
    }
    loadStudents()
  }, [])

  // Load applications when student changes
  useEffect(() => {
    if (!selectedStudent) {
      setApplications([])
      setSelectedApplication('')
      return
    }

    const loadApps = async () => {
      setLoadingApps(true)
      try {
        const res = await apiFetch<{ applications: Application[] }>(`/api/applications?student_id=${selectedStudent}`)
        setApplications(res.applications ?? [])
        setSelectedApplication('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load applications')
      } finally {
        setLoadingApps(false)
      }
    }
    loadApps()
  }, [selectedStudent])

  // Load jobs on mount and poll
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await apiFetch<{ jobs: AgentJob[]; total: number }>('/api/agent-jobs?agent_type=browser&limit=100')
        setJobs(res.jobs ?? [])
      } catch (err) {
        console.error('Failed to load jobs:', err)
      }
    }

    loadJobs()
    setLoading(false)

    const interval = setInterval(loadJobs, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleStartSession = async () => {
    if (!selectedStudent || !selectedApplication) {
      setError('Please select both a student and an application')
      return
    }

    setStartingSession(true)
    setError(null)
    try {
      const res = await apiFetch<{ job_id: string; status: string; message: string }>(
        '/api/agents/browser/start',
        {
          method: 'POST',
          body: JSON.stringify({
            student_id: selectedStudent,
            application_id: selectedApplication,
          }),
        }
      )
      // Reset form
      setSelectedStudent('')
      setSelectedApplication('')
      setApplications([])
      // Refresh jobs
      const jobsRes = await apiFetch<{ jobs: AgentJob[]; total: number }>('/api/agent-jobs?agent_type=browser&limit=100')
      setJobs(jobsRes.jobs ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session')
    } finally {
      setStartingSession(false)
    }
  }

  const handleStopJob = async (jobId: string) => {
    try {
      await apiFetch(`/api/agents/browser/${jobId}/stop`, { method: 'POST' })
      const res = await apiFetch<{ jobs: AgentJob[]; total: number }>('/api/agent-jobs?agent_type=browser&limit=100')
      setJobs(res.jobs ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop session')
    }
  }

  const handleRetryJob = async (job: AgentJob) => {
    if (!job.student_id || !job.application_id) return
    setStartingSession(true)
    setError(null)
    try {
      await apiFetch('/api/agents/browser/start', {
        method: 'POST',
        body: JSON.stringify({
          student_id: job.student_id,
          application_id: job.application_id,
        }),
      })
      const res = await apiFetch<{ jobs: AgentJob[]; total: number }>('/api/agent-jobs?agent_type=browser&limit=100')
      setJobs(res.jobs ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry session')
    } finally {
      setStartingSession(false)
    }
  }

  const studentName = students.find(s => s.id === selectedStudent)?.full_name
  const appName = applications.find(a => a.id === selectedApplication)?.university_name
  const activeJobs = jobs.filter(j => j.status === 'running' || j.status === 'awaiting_approval')
  const pastJobs = jobs.filter(j => j.status !== 'running' && j.status !== 'awaiting_approval')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#031635]" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Common App Filler
        </h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          Automated form-filling for Common App portals
        </p>
      </div>

      {/* Status Banner */}
      {(activeJobs.length > 0 || pastJobs.length > 0) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <p className="text-[13px] text-gray-700">
            <span className="font-semibold text-blue-700">{activeJobs.length}</span> session{activeJobs.length !== 1 ? 's' : ''} running
            {pastJobs.length > 0 && ` · ${pastJobs.length} recent`}
          </p>
        </div>
      )}

      {/* Start New Session Panel */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '0.5px solid #e5e7eb' }}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>play_circle</span>
          </div>
          <h2 className="text-[15px] font-bold text-[#031635]">Start New Session</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-2">Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              disabled={loadingStudents}
              className="w-full h-9 px-3 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
              style={{ border: '0.5px solid #d1d5db' }}
            >
              <option value="">
                {loadingStudents ? 'Loading students...' : 'Select a student'}
              </option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-2">Application</label>
            <select
              value={selectedApplication}
              onChange={(e) => setSelectedApplication(e.target.value)}
              disabled={!selectedStudent || loadingApps}
              className="w-full h-9 px-3 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-[#1D9E75] disabled:opacity-50"
              style={{ border: '0.5px solid #d1d5db' }}
            >
              <option value="">
                {!selectedStudent ? 'Select a student first' : loadingApps ? 'Loading...' : 'Select an application'}
              </option>
              {applications.map(a => (
                <option key={a.id} value={a.id}>{a.university_name}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleStartSession}
            disabled={!selectedStudent || !selectedApplication || startingSession}
            className="w-full h-10 rounded-lg text-[13px] font-semibold text-white transition disabled:opacity-50"
            style={{ backgroundColor: '#1D9E75' }}
          >
            {startingSession ? 'Starting...' : 'Start Filling'}
          </button>

          {selectedApplication && (
            <p className="text-[11px] text-gray-500">
              Ready to fill {appName} for {studentName}
            </p>
          )}
        </div>
      </div>

      {/* How It Works (Collapsible) */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '0.5px solid #e5e7eb' }}>
        <button
          onClick={() => setInstructionsOpen(!instructionsOpen)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>help</span>
            </div>
            <h3 className="text-[13px] font-bold text-[#031635]">How it works</h3>
          </div>
          <span
            className="material-symbols-outlined text-gray-400 transition transform"
            style={{
              fontSize: '18px',
              transform: instructionsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            expand_more
          </span>
        </button>

        {instructionsOpen && (
          <div className="px-6 py-4 border-t border-gray-100 space-y-3">
            {[
              { num: '1', title: 'Select Student & App', desc: 'Choose the student and their Common App application' },
              { num: '2', title: 'Start Filling', desc: 'Click "Start Filling" to begin automated form completion' },
              { num: '3', title: 'Review Progress', desc: 'Monitor screenshots as the AI fills each section' },
              { num: '4', title: 'Approve Changes', desc: 'Once done, review and confirm on the Approvals page' },
            ].map(({ num, title, desc }) => (
              <div key={num} className="flex gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                  style={{ backgroundColor: '#1D9E75' }}
                >
                  {num}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#031635]">{title}</p>
                  <p className="text-[11px] text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sessions Table */}
      {!loading && activeJobs.length > 0 && (
        <div>
          <h3 className="text-[14px] font-bold text-[#031635] mb-3">Active Sessions</h3>
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '0.5px solid #e5e7eb' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">University</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">Started</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeJobs.map((job) => {
                    const student = students.find(s => s.id === job.student_id)
                    const app = applications.find(a => a.id === job.application_id)
                    const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.running
                    const screenshots = job.screenshot_urls ?? []

                    return (
                      <tbody key={job.id}>
                        <tr>
                          <td className="px-6 py-4 text-[12px] text-[#031635] font-semibold">
                            {student?.full_name ?? 'Unknown'}
                          </td>
                          <td className="px-6 py-4 text-[12px] text-gray-700">
                            {app?.university_name ?? 'Unknown'}
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                              style={{ color: cfg.color, backgroundColor: cfg.bg }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                                {cfg.icon}
                              </span>
                              {cfg.label}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[12px] text-gray-500">
                            {timeAgo(job.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {screenshots.length > 0 && (
                                <button
                                  onClick={() => setExpandedScreenshots(
                                    expandedScreenshots === job.id ? null : job.id
                                  )}
                                  className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''}
                                </button>
                              )}
                              {job.status === 'running' && (
                                <button
                                  onClick={() => handleStopJob(job.id)}
                                  className="text-[11px] text-red-600 hover:text-red-700 font-medium"
                                >
                                  Stop
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Screenshot Grid */}
                        {expandedScreenshots === job.id && screenshots.length > 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-2">
                                <p className="text-[11px] font-semibold text-gray-600 uppercase">Screenshots</p>
                                <div className="grid grid-cols-4 gap-3">
                                  {screenshots.map((url, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => setSelectedScreenshot(url)}
                                      className="relative overflow-hidden rounded-lg border border-gray-200 hover:border-blue-400 transition bg-white"
                                    >
                                      <img
                                        src={url}
                                        alt={`Screenshot ${idx + 1}`}
                                        className="w-full h-20 object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {!loading && pastJobs.length > 0 && (
        <div>
          <h3 className="text-[14px] font-bold text-[#031635] mb-3">Recent Sessions</h3>
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '0.5px solid #e5e7eb' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">University</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">Completed</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pastJobs.map((job) => {
                    const student = students.find(s => s.id === job.student_id)
                    const app = applications.find(a => a.id === job.application_id)
                    const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.completed

                    return (
                      <tr key={job.id}>
                        <td className="px-6 py-4 text-[12px] text-[#031635] font-semibold">
                          {student?.full_name ?? 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-[12px] text-gray-700">
                          {app?.university_name ?? 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ color: cfg.color, backgroundColor: cfg.bg }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                              {cfg.icon}
                            </span>
                            {cfg.label}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[12px] text-gray-500">
                          {timeAgo(job.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {job.status === 'failed' && job.student_id && job.application_id && (
                              <button
                                onClick={() => handleRetryJob(job)}
                                className="text-[11px] text-amber-600 hover:text-amber-700 font-medium"
                              >
                                Retry
                              </button>
                            )}
                            {job.status === 'completed' && (
                              <span className="text-[11px] text-gray-400">Done</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '0.5px solid #e5e7eb' }}>
          <span className="material-symbols-outlined text-gray-300 text-5xl block mb-3">auto_awesome</span>
          <h3 className="text-[15px] font-bold text-[#031635] mb-2">No sessions yet</h3>
          <p className="text-[13px] text-gray-500 mb-5 max-w-md mx-auto">
            Start your first Common App form-filling session by selecting a student and application above.
          </p>
        </div>
      )}

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>close</span>
            </button>
            <img
              src={selectedScreenshot}
              alt="Screenshot"
              className="w-full h-auto rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
