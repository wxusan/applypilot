'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import StudentTabs from '@/components/students/StudentTabs'

interface Student {
  id: string
  full_name: string
  status: string
  graduation_year?: number | null
  high_school_name?: string | null
  email?: string | null
}

interface Email {
  id: string
  student_id: string
  direction: 'inbound' | 'outbound'
  from_address: string
  to_address: string
  subject: string
  body?: string | null
  ai_draft?: string | null
  received_at: string
  category?: string
  university_name?: string | null
  importance?: string
  is_read: boolean
  draft_status?: string | null
  created_at: string
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  admission:    { label: 'Admission',    color: '#1E40AF', bg: '#DBEAFE' },
  financial_aid:{ label: 'Financial Aid',color: '#065F46', bg: '#D1FAE5' },
  interview:    { label: 'Interview',    color: '#7C3AED', bg: '#EDE9FE' },
  deadline:     { label: 'Deadline',     color: '#B45309', bg: '#FEF3C7' },
  document:     { label: 'Document',     color: '#BE185D', bg: '#FCE7F3' },
  general:      { label: 'General',      color: '#374151', bg: '#F3F4F6' },
}

function formatEmailDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } else if (diffDays < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function StudentEmailsPage() {
  const params = useParams<{ id: string }>()
  const [student, setStudent] = useState<Student | null>(null)
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [loadingEmails, setLoadingEmails] = useState(true)
  const [loadingBody, setLoadingBody] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [isDraftingReply, setIsDraftingReply] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Load student
  useEffect(() => {
    apiFetch<Student>(`/api/students/${params.id}`)
      .then(setStudent)
      .catch(() => {})
  }, [params.id])

  // Load emails
  const loadEmails = useCallback(async () => {
    setLoadingEmails(true)
    setError(null)
    try {
      const res = await apiFetch<{ emails: Email[]; total: number }>(
        `/api/emails?student_id=${params.id}&limit=100`
      )
      setEmails(res.emails || [])
      if (res.emails?.length && !selectedEmail) {
        const first = res.emails[0]
        setSelectedEmail(first)
        // If body is missing, fetch full email
        if (!first.body && !first.ai_draft) {
          fetchEmailBody(first.id)
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load emails')
    } finally {
      setLoadingEmails(false)
    }
  }, [params.id])

  useEffect(() => { loadEmails() }, [loadEmails])

  const fetchEmailBody = async (emailId: string) => {
    setLoadingBody(true)
    try {
      const full = await apiFetch<Email>(`/api/emails/${emailId}`)
      setSelectedEmail(full)
      setEmails((prev) => prev.map((e) => e.id === emailId ? { ...e, ...full, is_read: true } : e))
    } catch {} finally {
      setLoadingBody(false)
    }
  }

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email)
    if (!email.body && !email.ai_draft) {
      fetchEmailBody(email.id)
    } else {
      // Mark read locally
      setEmails((prev) => prev.map((e) => e.id === email.id ? { ...e, is_read: true } : e))
    }
  }

  const handleApproveDraft = async () => {
    if (!selectedEmail) return
    setIsApproving(true)
    try {
      const updated = await apiFetch<Email>(`/api/emails/${selectedEmail.id}/approve-draft`, { method: 'POST' })
      setSelectedEmail({ ...selectedEmail, ...updated })
      setEmails((prev) => prev.map((e) => e.id === selectedEmail.id ? { ...e, ...updated } : e))
      showToast('Draft approved! Ready to send.')
    } catch (e: any) {
      showToast(e.message || 'Failed to approve draft', 'error')
    } finally {
      setIsApproving(false)
    }
  }

  const handleRequestDraft = async () => {
    if (!selectedEmail) return
    setIsDraftingReply(true)
    try {
      // Create an agent job to draft a reply
      await apiFetch('/api/agent-jobs', {
        method: 'POST',
        body: JSON.stringify({
          student_id: params.id,
          agent_type: 'writer',
          job_type: 'email_reply',
          input_data: {
            email_id: selectedEmail.id,
            subject: selectedEmail.subject,
            from_address: selectedEmail.from_address,
          },
        }),
      })
      showToast('AI is drafting a reply. Check Approvals Hub shortly.')
    } catch (e: any) {
      showToast(e.message || 'Failed to request draft', 'error')
    } finally {
      setIsDraftingReply(false)
    }
  }

  const displayName = student?.full_name ?? '...'
  const displayInitials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const gradYear = student?.graduation_year ?? '—'
  const unreadCount = emails.filter((e) => !e.is_read).length

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
          <Link
            href={`/students/${params.id}/profile`}
            className="h-8 px-4 rounded-lg text-[12px] font-medium text-gray-600 bg-white transition hover:bg-gray-50"
            style={{ border: '0.5px solid #e5e7eb', display: 'flex', alignItems: 'center' }}
          >
            View Dossier
          </Link>
        </div>
      </div>

      <StudentTabs studentId={params.id} active="emails" />

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] px-4 py-3 rounded-xl">
          {error} — <button onClick={loadEmails} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left: 4 cols */}
        <div className="col-span-4 space-y-4">
          {/* Conversation History */}
          <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #e5e7eb' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-semibold text-[#031635] uppercase tracking-wide">
                Emails
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#031635] text-white text-[9px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </h3>
              <span className="text-[11px] text-gray-400">{emails.length} total</span>
            </div>

            {loadingEmails ? (
              <div className="space-y-3">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-gray-300 text-4xl block mb-2">mail</span>
                <p className="text-[12px] text-gray-400">No emails synced yet.</p>
                <p className="text-[11px] text-gray-400 mt-1">Connect student email in Settings to sync.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
                {emails.map((email) => {
                  const isActive = email.id === selectedEmail?.id
                  const cfg = CATEGORY_CONFIG[email.category ?? 'general'] ?? CATEGORY_CONFIG.general
                  const sender = email.university_name || email.from_address.split('@')[1] || email.from_address
                  return (
                    <button
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className="w-full text-left px-3 py-3 rounded-lg transition-colors"
                      style={
                        isActive
                          ? { backgroundColor: 'rgba(3,22,53,0.08)', border: '1px solid rgba(3,22,53,0.15)' }
                          : { border: '0.5px solid transparent' }
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={`text-[12px] truncate ${email.is_read ? 'text-gray-600' : 'font-bold text-[#031635]'}`}>
                              {sender}
                            </p>
                            {!email.is_read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#031635] shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">{email.subject}</p>
                          {email.category && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-block"
                              style={{ color: cfg.color, backgroundColor: cfg.bg }}
                            >
                              {cfg.label}
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-[10px] text-gray-400">{formatEmailDate(email.received_at)}</span>
                          {email.ai_draft && (
                            <span className="block text-[9px] text-purple-600 font-bold mt-0.5">AI Draft</span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pilot Intelligence */}
          <div
            className="rounded-xl p-5"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>psychology</span>
              <span className="text-[12px] font-semibold text-white uppercase tracking-wide">Pilot Intelligence</span>
            </div>
            {emails.length > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-blue-200">Total Emails</span>
                  <span className="text-white font-bold">{emails.length}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-blue-200">Unread</span>
                  <span className="text-white font-bold">{unreadCount}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-blue-200">AI Drafts Ready</span>
                  <span className="text-white font-bold">
                    {emails.filter((e) => e.ai_draft && e.draft_status !== 'approved').length}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-blue-200 leading-relaxed">
                Connect this student&apos;s email account to start syncing communications and enabling AI-drafted replies.
              </p>
            )}
          </div>
        </div>

        {/* Right: 8 cols */}
        <div className="col-span-8 space-y-4">
          {!selectedEmail || loadingEmails ? (
            <div
              className="rounded-2xl min-h-[480px] flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(247,249,251,0.5)', border: '0.5px solid #e5e7eb' }}
            >
              {loadingEmails ? (
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined animate-spin text-gray-400 text-4xl">sync</span>
                  <p className="text-[13px] text-gray-400">Loading emails...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-gray-300 text-5xl">mail</span>
                  <p className="text-[14px] text-gray-400 font-medium">Select an email to view</p>
                </div>
              )}
            </div>
          ) : (
            <div
              className="rounded-2xl p-7 min-h-[480px] flex flex-col gap-5"
              style={{ backgroundColor: 'rgba(247,249,251,0.5)' }}
            >
              {/* Thread header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#031635] mb-1">{selectedEmail.subject}</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-[12px] text-gray-500">
                      From: <span className="font-medium">{selectedEmail.from_address}</span>
                    </p>
                    <p className="text-[12px] text-gray-400">
                      {new Date(selectedEmail.received_at).toLocaleString()}
                    </p>
                    {selectedEmail.category && (() => {
                      const cfg = CATEGORY_CONFIG[selectedEmail.category] ?? CATEGORY_CONFIG.general
                      return (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: cfg.color, backgroundColor: cfg.bg }}
                        >
                          {cfg.label}
                        </span>
                      )
                    })()}
                    {selectedEmail.importance === 'high' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        HIGH PRIORITY
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0"
                  style={{ backgroundColor: '#E6F1FB', color: '#185FA5' }}
                >
                  {selectedEmail.direction === 'inbound' ? 'INCOMING' : 'OUTGOING'}
                </span>
              </div>

              {/* Email body */}
              {loadingBody ? (
                <div className="flex items-center gap-2 py-8">
                  <span className="material-symbols-outlined animate-spin text-gray-400" style={{ fontSize: '18px' }}>sync</span>
                  <span className="text-[13px] text-gray-400">Loading message...</span>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-5 flex-1" style={{ border: '0.5px solid #e5e7eb' }}>
                  {selectedEmail.body ? (
                    <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedEmail.body}
                    </p>
                  ) : (
                    <p className="text-[13px] text-gray-400 italic">
                      Email body not available. Connect IMAP to sync full content.
                    </p>
                  )}
                </div>
              )}

              {/* AI Draft section */}
              {selectedEmail.ai_draft && (
                <div
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: '#ffffff', border: '2px solid rgba(3,22,53,0.2)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white"
                        style={{ backgroundColor: '#031635' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>auto_fix_high</span>
                        AI Draft Reply
                      </span>
                      {selectedEmail.draft_status === 'approved' && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>verified</span>
                          Approved
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
                    {selectedEmail.ai_draft}
                  </div>

                  <div
                    className="pt-4 flex items-center gap-6"
                    style={{ borderTop: '0.5px solid #e5e7eb' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '14px' }}>tune</span>
                      <span className="text-[11px] text-gray-500">
                        Tone: <span className="font-medium text-gray-700">Professional</span>
                      </span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {selectedEmail.draft_status !== 'approved' ? (
                        <button
                          onClick={handleApproveDraft}
                          disabled={isApproving}
                          className="h-8 px-4 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1.5 disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check</span>
                          {isApproving ? 'Approving...' : 'Approve Draft'}
                        </button>
                      ) : (
                        <span className="text-[12px] text-emerald-700 font-semibold">
                          ✓ Draft approved & ready to send
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer quick actions */}
              <div className="flex items-center gap-3">
                {!selectedEmail.ai_draft && selectedEmail.direction === 'inbound' && (
                  <button
                    onClick={handleRequestDraft}
                    disabled={isDraftingReply}
                    className="flex items-center gap-2 h-9 px-4 rounded-full text-[12px] font-semibold text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_fix_high</span>
                    {isDraftingReply ? 'Requesting...' : 'Draft AI Reply'}
                  </button>
                )}
                <button
                  className="flex items-center gap-2 h-9 px-4 rounded-full text-[12px] font-medium text-gray-600 bg-white transition hover:bg-gray-50"
                  style={{ border: '0.5px solid #e5e7eb' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>attach_file</span>
                  Attach Document
                </button>
                <button
                  className="flex items-center gap-2 h-9 px-4 rounded-full text-[12px] font-medium text-gray-600 bg-white transition hover:bg-gray-50"
                  style={{ border: '0.5px solid #e5e7eb' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_month</span>
                  Schedule Follow-up
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
