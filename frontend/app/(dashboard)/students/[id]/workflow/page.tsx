'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import StudentTabs from '@/components/students/StudentTabs'

interface UniversityRound {
  name: string
  round: 'ED' | 'EA' | 'RD' | 'ED2' | 'REA'
}

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

interface Workflow {
  id: string
  student_id: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed'
  universities: UniversityRound[]
  steps: WorkflowStep[]
  created_at: string
}

interface Student {
  id: string
  full_name: string
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

const ROUNDS = ['ED', 'EA', 'RD', 'ED2', 'REA'] as const

function NewWorkflowModal({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean
  onClose: () => void
  onCreate: (universities: UniversityRound[]) => void
}) {
  const [universityInput, setUniversityInput] = useState('')
  const [universities, setUniversities] = useState<UniversityRound[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddUniversity = () => {
    if (!universityInput.trim()) return
    const name = universityInput.trim()
    if (!universities.find((u) => u.name.toLowerCase() === name.toLowerCase())) {
      setUniversities([...universities, { name, round: 'RD' }])
      setUniversityInput('')
    }
  }

  const handleUpdateRound = (index: number, round: typeof ROUNDS[number]) => {
    const updated = [...universities]
    updated[index].round = round
    setUniversities(updated)
  }

  const handleRemoveUniversity = (index: number) => {
    setUniversities(universities.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (universities.length === 0) return
    setIsSubmitting(true)
    try {
      await onCreate(universities)
      setUniversities([])
      setUniversityInput('')
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl max-w-2xl w-full p-6">
        <h2 className="text-xl font-bold text-on-surface mb-4">Start New Workflow</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase">
              University List (one per line)
            </label>
            <textarea
              value={universityInput}
              onChange={(e) => setUniversityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleAddUniversity()
                }
              }}
              placeholder="Harvard University"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:border-primary resize-none h-24"
            />
            <button
              type="button"
              onClick={handleAddUniversity}
              className="mt-2 text-sm font-medium text-primary hover:text-primary/80"
            >
              + Add University
            </button>
          </div>

          {universities.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase">Selected Universities</label>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {universities.map((u, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-surface-container-low p-3 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-on-surface">{u.name}</p>
                    </div>
                    <select
                      value={u.round}
                      onChange={(e) => handleUpdateRound(idx, e.target.value as typeof ROUNDS[number])}
                      className="px-2 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface text-xs focus:outline-none"
                    >
                      {ROUNDS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveUniversity(idx)}
                      className="p-2 hover:bg-surface-container transition-colors rounded-lg"
                    >
                      <span className="material-symbols-outlined text-error text-base">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              disabled={universities.length === 0 || isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function WorkflowTimeline({ workflow }: { workflow: Workflow }) {
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const completedCount = workflow.steps.filter((s) => s.status === 'completed').length
  const totalCount = workflow.steps.length

  const handleApproveClick = (stepId: string) => {
    router.push(`/students/${params.id}/workflow/step/${stepId}`)
  }

  return (
    <div className="space-y-6">
      {/* Workflow Status Bar */}
      <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ color: '#1D9E75' }}
            >
              smart_toy
            </span>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase">Workflow Status</p>
              <p className="text-sm font-bold text-on-surface">{workflow.status}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {workflow.status === 'active' && (
              <button className="px-3 py-2 rounded-lg text-sm font-medium bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors">
                Pause
              </button>
            )}
            {workflow.status === 'paused' && (
              <button className="px-3 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:opacity-90 transition-colors">
                Resume
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-on-surface-variant">Progress</span>
            <span className="font-semibold text-on-surface">
              {completedCount} of {totalCount} steps
            </span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="relative">
        {workflow.steps.map((step, idx) => {
          const config = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending
          const isAwaitingApproval = step.status === 'awaiting_approval'
          const isFailed = step.status === 'failed'
          const isRunning = step.status === 'running'

          return (
            <div key={step.id} className="flex gap-6 mb-8 relative">
              {/* Timeline connector */}
              {idx < workflow.steps.length - 1 && (
                <div className="absolute left-6 top-16 w-1 h-12 bg-outline-variant/20"></div>
              )}

              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 relative z-10"
                  style={{ color: config.color, background: config.bg }}
                >
                  {isRunning ? (
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    step.step_number
                  )}
                </div>
              </div>

              {/* Step content */}
              <div
                className={`flex-1 p-4 rounded-xl border transition-all ${
                  isAwaitingApproval
                    ? 'bg-amber-50 border-amber-300 shadow-sm animate-pulse'
                    : isFailed
                      ? 'bg-red-50 border-red-300'
                      : 'bg-surface-container-low border-outline-variant/20'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-on-surface">{step.step_name}</h3>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ color: config.color, background: config.bg }}
                  >
                    {config.label}
                  </div>
                </div>

                {step.error_message && (
                  <div className="mb-3 p-3 bg-red-100 text-red-800 rounded-lg text-xs">
                    {step.error_message}
                  </div>
                )}

                {isRunning && (
                  <p className="text-sm text-on-surface-variant mb-3">Agent working...</p>
                )}

                <div className="flex gap-2">
                  {isAwaitingApproval && (
                    <button
                      onClick={() => handleApproveClick(step.id)}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:opacity-90 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      Review & Approve
                    </button>
                  )}
                  {isFailed && (
                    <button className="px-3 py-2 rounded-lg text-sm font-medium bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors">
                      Retry
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function WorkflowPage() {
  const params = useParams<{ id: string }>()
  const [student, setStudent] = useState<Student | null>(null)
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadWorkflow = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<Workflow[]>(
        `/api/workflows?student_id=${params.id}`
      )
      setWorkflow(Array.isArray(res) ? (res[0] || null) : null)
    } catch (e: any) {
      showToast(e.message || 'Failed to load workflow', 'error')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    apiFetch<Student>(`/api/students/${params.id}`).then(setStudent).catch(() => {})
    loadWorkflow()
  }, [params.id, loadWorkflow])

  const handleCreateWorkflow = async (universities: UniversityRound[]) => {
    try {
      const res = await apiFetch<Workflow>('/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          student_id: params.id,
          universities,
        }),
      })
      setWorkflow(res)
      showToast('Workflow created!')
    } catch (e: any) {
      showToast(e.message || 'Failed to create workflow', 'error')
    }
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

      <StudentTabs studentId={params.id} active="workflow" />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <span className="material-symbols-outlined text-primary text-2xl">smart_toy</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Automation Workflow</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Manage your college application automation
            </p>
          </div>
        </div>
        {!workflow && !loading && (
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:opacity-90 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Start New Workflow
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      ) : !workflow ? (
        <div className="bg-surface-container-low rounded-2xl p-12 text-center border border-outline-variant/20">
          <div className="p-4 rounded-xl bg-primary/10 inline-block mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">smart_toy</span>
          </div>
          <h3 className="text-lg font-semibold text-on-surface mb-2">No workflow created yet</h3>
          <p className="text-sm text-on-surface-variant max-w-md mb-6">
            Create a workflow to start automating college applications.
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:opacity-90 transition-colors"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Start New Workflow
          </button>
        </div>
      ) : (
        <WorkflowTimeline workflow={workflow} />
      )}

      <NewWorkflowModal isOpen={showNewModal} onClose={() => setShowNewModal(false)} onCreate={handleCreateWorkflow} />
    </div>
  )
}
