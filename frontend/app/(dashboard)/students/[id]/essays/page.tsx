'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { apiFetch, essaysApi } from '@/lib/api'
import StudentTabs from '@/components/students/StudentTabs'

interface Student {
  id: string
  full_name: string
  graduation_year?: number | null
  high_school_name?: string | null
}

interface Essay {
  id: string
  student_id: string
  application_id?: string | null
  prompt_text: string
  content?: string | null
  word_count?: number
  version?: number
  status: string // draft | approved | submitted
  ai_score?: number | null
  ai_feedback?: string | null
  plagiarism_score?: number | null
  created_at: string
  updated_at?: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',    color: '#6B7280', bg: '#F3F4F6' },
  approved:  { label: 'Approved', color: '#065F46', bg: '#D1FAE5' },
  submitted: { label: 'Submitted',color: '#1E40AF', bg: '#DBEAFE' },
}

function ScoreRing({ score }: { score: number }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="64" height="64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#E5E7EB" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[14px] font-bold" style={{ color }}>{score}</span>
    </div>
  )
}

export default function StudentEssaysPage() {
  const params = useParams<{ id: string }>()
  const [student, setStudent] = useState<Student | null>(null)
  const [essays, setEssays] = useState<Essay[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editorContent, setEditorContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [loadingEssays, setLoadingEssays] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // New essay modal
  const [showNewModal, setShowNewModal] = useState(false)
  const [newPrompt, setNewPrompt] = useState('')
  const [newPromptType, setNewPromptType] = useState<'personal_statement' | 'supplemental'>('personal_statement')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateStatus, setGenerateStatus] = useState<string | null>(null)

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedEssay = essays.find((e) => e.id === selectedId)

  // Load student
  useEffect(() => {
    apiFetch<Student>(`/api/students/${params.id}`)
      .then(setStudent)
      .catch(() => {})
  }, [params.id])

  // Load essays
  const loadEssays = useCallback(async () => {
    setLoadingEssays(true)
    setError(null)
    try {
      const res = await essaysApi.list(params.id) as { essays: Essay[] }
      setEssays(res.essays || [])
      if (res.essays?.length && !selectedId) {
        setSelectedId(res.essays[0].id)
        setEditorContent(res.essays[0].content || '')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load essays')
    } finally {
      setLoadingEssays(false)
    }
  }, [params.id])

  useEffect(() => { loadEssays() }, [loadEssays])

  // Sync editor when selection changes
  useEffect(() => {
    if (selectedEssay) {
      setEditorContent(selectedEssay.content || '')
    }
  }, [selectedId])

  // Auto-save on content change (debounced 1.5s)
  const handleEditorChange = (val: string) => {
    setEditorContent(val)
    if (!selectedId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setIsSaving(true)
      try {
        const updated = await essaysApi.update(selectedId, { content: val }) as Essay
        setEssays((prev) => prev.map((e) => e.id === selectedId ? { ...e, ...updated } : e))
      } catch {
        // silent fail — user can see stale word count
      } finally {
        setIsSaving(false)
      }
    }, 1500)
  }

  const handleSelectEssay = (essay: Essay) => {
    setSelectedId(essay.id)
    setEditorContent(essay.content || '')
  }

  const handleApprove = async () => {
    if (!selectedId) return
    setIsApproving(true)
    try {
      const updated = await essaysApi.approve(selectedId) as Essay
      setEssays((prev) => prev.map((e) => e.id === selectedId ? { ...e, ...updated } : e))
      showToast('Essay approved!')
    } catch (e: any) {
      showToast(e.message || 'Failed to approve', 'error')
    } finally {
      setIsApproving(false)
    }
  }

  const handleGenerateDraft = async () => {
    if (!newPrompt.trim()) return
    setIsGenerating(true)
    setGenerateStatus('Sending to AI writer...')
    try {
      const res = await essaysApi.generate({
        student_id: params.id,
        prompt_text: newPrompt,
        prompt_type: newPromptType,
      }) as { job_id: string; status: string }

      setGenerateStatus('AI is writing your draft (this takes ~30 seconds)...')

      // Poll the agent job status
      let attempts = 0
      const poll = async () => {
        attempts++
        try {
          const job = await apiFetch<{ status: string; output_data?: { essay_id?: string } }>(
            `/api/agent-jobs/${res.job_id}`
          )
          if (job.status === 'awaiting_approval' || job.status === 'approved') {
            setGenerateStatus('Draft ready! Loading...')
            await loadEssays()
            // Select the new essay
            if (job.output_data?.essay_id) {
              setSelectedId(job.output_data.essay_id)
            }
            setShowNewModal(false)
            setNewPrompt('')
            showToast('AI draft created! Review it in the Approvals Hub too.')
          } else if (job.status === 'failed') {
            setGenerateStatus(null)
            showToast('AI writing failed. Check your OpenAI API key in Railway.', 'error')
            setIsGenerating(false)
            return
          } else if (attempts < 30) {
            setTimeout(poll, 2000)
            return
          } else {
            setGenerateStatus('Taking longer than expected. Check Approvals Hub.')
            setIsGenerating(false)
            setShowNewModal(false)
            return
          }
        } catch {
          if (attempts < 30) setTimeout(poll, 2000)
        }
        setIsGenerating(false)
      }
      setTimeout(poll, 3000)
    } catch (e: any) {
      showToast(e.message || 'Failed to start generation', 'error')
      setIsGenerating(false)
      setGenerateStatus(null)
    }
  }

  const wordCount = editorContent.trim() ? editorContent.trim().split(/\s+/).length : 0
  const displayName = student?.full_name ?? '...'
  const displayInitials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const gradYear = student?.graduation_year ?? '—'

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-xl text-white text-[13px] font-semibold shadow-xl transition-all ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Student Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-[15px] shrink-0"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            {displayInitials}
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-[#031635]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {displayName}
            </h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Class of {gradYear} · {student?.high_school_name ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowNewModal(true); setNewPrompt(''); setGenerateStatus(null) }}
            className="h-8 px-4 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
            New Essay
          </button>
        </div>
      </div>

      <StudentTabs studentId={params.id} active="essays" />

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] px-4 py-3 rounded-xl">
          {error} — <button onClick={loadEssays} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left: Essay List */}
        <div className="col-span-4 space-y-3">
          <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #e5e7eb' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-semibold text-[#031635] uppercase tracking-wide">
                Essays ({essays.length})
              </h3>
              <button
                onClick={() => setShowNewModal(true)}
                className="text-[11px] font-semibold text-[#031635] opacity-60 hover:opacity-100 flex items-center gap-1"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>add</span>
                New
              </button>
            </div>

            {loadingEssays ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : essays.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-gray-300 text-4xl block mb-2">edit_document</span>
                <p className="text-[12px] text-gray-400">No essays yet.</p>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="mt-3 text-[12px] font-semibold text-[#031635] underline"
                >
                  Generate first draft
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {essays.map((essay) => {
                  const cfg = STATUS_CONFIG[essay.status] ?? STATUS_CONFIG.draft
                  const isActive = essay.id === selectedId
                  const words = essay.word_count ?? 0
                  const promptPreview = essay.prompt_text.length > 60
                    ? essay.prompt_text.slice(0, 60) + '…'
                    : essay.prompt_text
                  return (
                    <button
                      key={essay.id}
                      onClick={() => handleSelectEssay(essay)}
                      className="w-full text-left px-3 py-3 rounded-lg transition-colors"
                      style={
                        isActive
                          ? { backgroundColor: 'rgba(3,22,53,0.08)', border: '1px solid rgba(3,22,53,0.15)' }
                          : { border: '0.5px solid #e5e7eb' }
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-[#031635] truncate">{promptPreview}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ color: cfg.color, backgroundColor: cfg.bg }}
                            >
                              {cfg.label}
                            </span>
                            <span className="text-[10px] text-gray-400">{words} words</span>
                          </div>
                        </div>
                        {essay.ai_score != null && (
                          <div className="shrink-0">
                            <ScoreRing score={essay.ai_score} />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* AI Stats summary */}
          {essays.length > 0 && (
            <div
              className="rounded-xl p-5"
              style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>
                  psychology
                </span>
                <span className="text-[12px] font-semibold text-white uppercase tracking-wide">
                  Essay Summary
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-blue-200">Total Essays</span>
                  <span className="text-white font-bold">{essays.length}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-blue-200">Approved</span>
                  <span className="text-white font-bold">{essays.filter((e) => e.status === 'approved').length}</span>
                </div>
                {essays.some((e) => e.ai_score != null) && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-blue-200">Avg AI Score</span>
                    <span className="text-white font-bold">
                      {Math.round(
                        essays.filter((e) => e.ai_score != null).reduce((s, e) => s + (e.ai_score ?? 0), 0) /
                        essays.filter((e) => e.ai_score != null).length
                      )}
                      /100
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Essay Editor */}
        <div className="col-span-8 space-y-4">
          {!selectedEssay ? (
            <div className="bg-white rounded-xl flex flex-col items-center justify-center min-h-[500px]" style={{ border: '0.5px solid #e5e7eb' }}>
              <span className="material-symbols-outlined text-gray-300 text-5xl mb-3">edit_document</span>
              <p className="text-[14px] text-gray-400 font-medium">Select an essay or create a new one</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-4 h-9 px-5 rounded-lg text-[12px] font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
              >
                Generate AI Draft
              </button>
            </div>
          ) : (
            <>
              {/* Editor header */}
              <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #e5e7eb' }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <p className="text-[12px] text-gray-400 uppercase tracking-wide font-semibold mb-1">
                      {selectedEssay.status === 'approved' ? 'Approved Essay' : 'Essay Prompt'}
                    </p>
                    <p className="text-[14px] font-semibold text-[#031635] leading-relaxed">
                      {selectedEssay.prompt_text}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {selectedEssay.ai_score != null && <ScoreRing score={selectedEssay.ai_score} />}
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">AI Score</p>
                      {selectedEssay.ai_score != null ? (
                        <p className="text-[11px] font-bold text-[#031635]">{selectedEssay.ai_score}/100</p>
                      ) : (
                        <p className="text-[11px] text-gray-400">—</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Feedback */}
                {selectedEssay.ai_feedback && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 px-4 py-3 rounded-r-xl mb-4">
                    <p className="text-[12px] font-semibold text-blue-900 mb-1">AI Feedback</p>
                    <p className="text-[12px] text-blue-800 leading-relaxed">{selectedEssay.ai_feedback}</p>
                  </div>
                )}

                {/* Textarea editor */}
                <textarea
                  value={editorContent}
                  onChange={(e) => handleEditorChange(e.target.value)}
                  placeholder="Start writing or generate an AI draft..."
                  className="w-full min-h-[400px] text-[13px] text-gray-700 leading-relaxed p-4 rounded-xl bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-[#031635]/20 resize-y"
                  style={{ border: '0.5px solid #e5e7eb', fontFamily: 'Georgia, serif' }}
                />

                {/* Footer bar */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] text-gray-400">
                      {wordCount} words
                    </span>
                    {isSaving && (
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '12px' }}>sync</span>
                        Saving...
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedEssay.status !== 'approved' && (
                      <button
                        onClick={handleApprove}
                        disabled={isApproving || !editorContent.trim()}
                        className="h-8 px-4 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1.5 disabled:opacity-50"
                        style={{ background: '#10B981' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check_circle</span>
                        {isApproving ? 'Approving...' : 'Approve Essay'}
                      </button>
                    )}
                    {selectedEssay.status === 'approved' && (
                      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>verified</span>
                        Approved
                      </span>
                    )}
                    <button
                      onClick={() => setShowNewModal(true)}
                      className="h-8 px-4 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1.5"
                      style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>auto_fix_high</span>
                      Generate New
                    </button>
                  </div>
                </div>
              </div>

              {/* Essay metadata */}
              <div className="bg-white rounded-xl p-4 flex items-center gap-6" style={{ border: '0.5px solid #e5e7eb' }}>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Version</p>
                  <p className="text-[12px] font-semibold text-[#031635]">v{selectedEssay.version ?? 1}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Status</p>
                  <p className="text-[12px] font-semibold text-[#031635] capitalize">{selectedEssay.status}</p>
                </div>
                {selectedEssay.plagiarism_score != null && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Originality</p>
                    <p className="text-[12px] font-semibold text-[#031635]">
                      {100 - selectedEssay.plagiarism_score}% original
                    </p>
                  </div>
                )}
                <div className="ml-auto">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Last Edited</p>
                  <p className="text-[12px] font-semibold text-[#031635]">
                    {new Date(selectedEssay.updated_at ?? selectedEssay.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Essay Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[17px] font-bold text-[#031635]">Generate AI Essay Draft</h2>
              <button
                onClick={() => { if (!isGenerating) { setShowNewModal(false); setGenerateStatus(null) } }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">Essay Type</label>
                <div className="flex gap-2">
                  {(['personal_statement', 'supplemental'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewPromptType(type)}
                      className="flex-1 py-2.5 rounded-lg text-[12px] font-semibold transition-all"
                      style={
                        newPromptType === type
                          ? { background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)', color: 'white' }
                          : { border: '0.5px solid #e5e7eb', color: '#6B7280' }
                      }
                    >
                      {type === 'personal_statement' ? 'Personal Statement' : 'Supplemental'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">
                  Essay Prompt
                </label>
                <textarea
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="Paste the essay prompt here (e.g. 'Describe a challenge you have overcome...')"
                  className="w-full h-32 text-[13px] text-gray-700 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#031635]/20 resize-none"
                  style={{ border: '0.5px solid #e5e7eb' }}
                  disabled={isGenerating}
                />
              </div>

              {generateStatus && (
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-3 rounded-xl">
                  <span className="material-symbols-outlined animate-spin text-blue-600" style={{ fontSize: '16px' }}>sync</span>
                  <p className="text-[12px] text-blue-700 font-medium">{generateStatus}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { if (!isGenerating) { setShowNewModal(false); setGenerateStatus(null) } }}
                  disabled={isGenerating}
                  className="flex-1 py-2.5 rounded-lg text-[12px] font-semibold text-gray-600 disabled:opacity-40"
                  style={{ border: '0.5px solid #e5e7eb' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateDraft}
                  disabled={isGenerating || !newPrompt.trim()}
                  className="flex-1 py-2.5 rounded-lg text-[12px] font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_fix_high</span>
                  {isGenerating ? 'Writing...' : 'Generate with AI'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
