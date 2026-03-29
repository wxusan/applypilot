'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

interface AgentJob {
  id: string
  job_type: string
  status: string
  student_id?: string | null
  application_id?: string | null
  created_at: string
  updated_at?: string | null
  output_data?: any
}

interface Student {
  id: string
  full_name: string
  high_school_name?: string | null
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

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  running:           { color: '#059669', bg: '#D1FAE5', label: 'Running' },
  completed:         { color: '#2563EB', bg: '#DBEAFE', label: 'Completed' },
  awaiting_approval: { color: '#D97706', bg: '#FEF3C7', label: 'Awaiting Approval' },
  failed:            { color: '#DC2626', bg: '#FEE2E2', label: 'Failed' },
  cancelled:         { color: '#6B7280', bg: '#F3F4F6', label: 'Cancelled' },
}

export default function BrowserAgentPage() {
  const [jobs, setJobs] = useState<AgentJob[]>([])
  const [students, setStudents] = useState<Record<string, Student>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [jobsRes, studentsRes] = await Promise.all([
          apiFetch<{ jobs: AgentJob[]; total: number }>('/api/agent-jobs?agent_type=browser&limit=20'),
          apiFetch<{ students: Student[]; total: number }>('/api/students?limit=100'),
        ])

        const studentMap: Record<string, Student> = {}
        for (const s of studentsRes.students ?? []) {
          studentMap[s.id] = s
        }
        setStudents(studentMap)
        setJobs(jobsRes.jobs ?? [])
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const activeJobs = jobs.filter((j) => j.status === 'running' || j.status === 'awaiting_approval')
  const pastJobs = jobs.filter((j) => j.status !== 'running' && j.status !== 'awaiting_approval')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#031635]" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Browser Agent
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Automated application form-filling sessions. Start a session from a student&rsquo;s Applications tab.
          </p>
        </div>
        <Link
          href="/students"
          className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person_search</span>
          Select Student
        </Link>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '0.5px solid #e5e7eb' }}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>auto_awesome</span>
          </div>
          <h2 className="text-[15px] font-bold text-[#031635]">How to start a Browser Agent session</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Open a Student', desc: 'Go to Students and open a student profile.', icon: 'person' },
            { step: '2', title: 'Go to Applications', desc: 'Navigate to the Applications tab for that student.', icon: 'school' },
            { step: '3', title: 'Start Agent', desc: 'Click "Start Browser Agent" on an application card.', icon: 'play_circle' },
          ].map(({ step, title, desc, icon }) => (
            <div key={step} className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
              >
                {step}
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#031635] flex items-center gap-1.5">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#6B7280' }}>{icon}</span>
                  {title}
                </p>
                <p className="text-[12px] text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active sessions */}
      {loading ? (
        <div className="flex items-center gap-3 text-gray-400 py-6">
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>sync</span>
          <span className="text-[13px]">Loading agent sessions...</span>
        </div>
      ) : (
        <>
          {activeJobs.length > 0 && (
            <div>
              <h2 className="text-[14px] font-bold text-[#031635] mb-3">Active Sessions</h2>
              <div className="space-y-3">
                {activeJobs.map((job) => {
                  const student = job.student_id ? students[job.student_id] : null
                  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.running
                  return (
                    <div
                      key={job.id}
                      className="bg-white rounded-xl p-5 flex items-center gap-4"
                      style={{ border: '0.5px solid #e5e7eb' }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#031635] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>web</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-[#031635] truncate">
                          {student?.full_name ?? 'Unknown Student'}
                        </p>
                        <p className="text-[12px] text-gray-400">
                          {student?.high_school_name ?? ''} · Started {timeAgo(job.created_at)}
                        </p>
                      </div>
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                      >
                        {cfg.label}
                      </span>
                      {job.status === 'awaiting_approval' && (
                        <Link
                          href={`/approvals/${job.id}`}
                          className="h-8 px-3 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1.5 shrink-0"
                          style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
                        >
                          Review
                        </Link>
                      )}
                      {job.student_id && (
                        <Link
                          href={`/students/${job.student_id}/applications`}
                          className="h-8 px-3 rounded-lg text-[12px] font-semibold text-gray-600 flex items-center gap-1.5 shrink-0"
                          style={{ border: '0.5px solid #e5e7eb' }}
                        >
                          View
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Past sessions */}
          {pastJobs.length > 0 && (
            <div>
              <h2 className="text-[14px] font-bold text-[#031635] mb-3">Recent Sessions</h2>
              <div className="bg-white rounded-xl overflow-hidden" style={{ border: '0.5px solid #e5e7eb' }}>
                {pastJobs.map((job, idx) => {
                  const student = job.student_id ? students[job.student_id] : null
                  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.completed
                  return (
                    <div
                      key={job.id}
                      className="flex items-center gap-4 px-5 py-3.5"
                      style={{ borderTop: idx > 0 ? '0.5px solid #f3f4f6' : 'none' }}
                    >
                      <span className="material-symbols-outlined text-gray-300" style={{ fontSize: '18px' }}>web</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#031635] truncate">
                          {student?.full_name ?? 'Unknown Student'}
                        </p>
                        <p className="text-[11px] text-gray-400">{timeAgo(job.created_at)}</p>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                      >
                        {cfg.label}
                      </span>
                      {job.student_id && (
                        <Link
                          href={`/students/${job.student_id}/applications`}
                          className="text-[12px] text-gray-400 hover:text-[#031635] transition-colors"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {jobs.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '0.5px solid #e5e7eb' }}>
              <span className="material-symbols-outlined text-gray-300 text-5xl block mb-3">web</span>
              <h3 className="text-[15px] font-bold text-[#031635] mb-2">No agent sessions yet</h3>
              <p className="text-[13px] text-gray-500 mb-5 max-w-md mx-auto">
                Browser agent sessions are started from within a student&rsquo;s Applications tab. Select a student to get started.
              </p>
              <Link
                href="/students"
                className="h-10 px-6 rounded-xl text-[13px] font-semibold text-white inline-flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>people</span>
                Browse Students
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
