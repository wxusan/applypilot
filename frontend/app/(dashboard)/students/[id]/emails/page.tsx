'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

interface Student {
  id: string
  full_name: string
  status: string
  graduation_year?: number | null
  high_school_name?: string | null
  email?: string | null
  nationality?: string | null
}

const MOCK_THREADS = [
  {
    id: '1',
    university: 'Stanford University',
    subject: 'Application Status Inquiry',
    preview: 'Thank you for your application to Stanford...',
    date: 'Mar 18',
    active: true,
    unread: true,
  },
  {
    id: '2',
    university: 'MIT Admissions',
    subject: 'Financial Aid Package',
    preview: 'We are pleased to offer you a financial aid...',
    date: 'Mar 15',
    active: false,
    unread: false,
  },
  {
    id: '3',
    university: 'Harvard College',
    subject: 'Interview Invitation',
    preview: 'Congratulations! We would like to invite you...',
    date: 'Mar 12',
    active: false,
    unread: false,
  },
  {
    id: '4',
    university: 'Yale University',
    subject: 'Document Request',
    preview: 'We noticed your transcript has not been received...',
    date: 'Mar 8',
    active: false,
    unread: false,
  },
]

const TABS = [
  { key: 'profile', label: 'Overview' },
  { key: 'profile', label: 'Academics' },
  { key: 'activity', label: 'Activity List' },
  { key: 'emails', label: 'Emails & Comm' },
  { key: 'essays', label: 'Essays' },
]

export default function StudentEmailsPage() {
  const params = useParams<{ id: string }>()
  const [student, setStudent] = useState<Student | null>(null)
  const [activeThread, setActiveThread] = useState('1')
  const [isDrafting] = useState(true)

  useEffect(() => {
    apiFetch<Student>(`/api/students/${params.id}`)
      .then((s) => setStudent(s))
      .catch(() => {
        // Fall back to mock
        setStudent({
          id: params.id,
          full_name: 'Amara Vance',
          status: 'writing',
          graduation_year: 2025,
          high_school_name: 'Stanford University Aspirant',
        })
      })
  }, [params.id])

  const displayName = student?.full_name ?? 'Amara Vance'
  const displayInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const gradYear = student?.graduation_year ?? 2025

  return (
    <div className="space-y-5">
      {/* Student Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
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
              Class of {gradYear} • {student?.high_school_name ?? 'Stanford University Aspirant'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="h-8 px-4 rounded-lg text-[12px] font-medium text-gray-600 bg-white transition hover:bg-gray-50"
            style={{ border: '0.5px solid #e5e7eb' }}
          >
            View Dossier
          </button>
          <button
            className="h-8 px-4 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_fix_high</span>
            Start AI Review
          </button>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex" style={{ borderBottom: '1.5px solid #e5e7eb' }}>
        {TABS.map((tab, i) => {
          const isActive = tab.label === 'Emails & Comm'
          return (
            <Link
              key={i}
              href={`/students/${params.id}/${tab.key}`}
              className="px-4 py-2.5 text-[13px] transition-colors whitespace-nowrap"
              style={
                isActive
                  ? {
                      color: '#031635',
                      fontWeight: 600,
                      borderBottom: '2px solid #031635',
                      marginBottom: '-1.5px',
                    }
                  : { color: '#9CA3AF' }
              }
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left: 4 cols */}
        <div className="col-span-4 space-y-4">
          {/* Conversation History */}
          <div className="bg-white rounded-xl p-6" style={{ border: '0.5px solid #e5e7eb' }}>
            <h3 className="text-[13px] font-semibold text-[#031635] mb-4 uppercase tracking-wide">
              Conversation History
            </h3>
            <div className="space-y-2">
              {MOCK_THREADS.map((thread) => {
                const isActive = thread.id === activeThread
                return (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThread(thread.id)}
                    className="w-full text-left px-3 py-3 rounded-lg transition-colors"
                    style={
                      isActive
                        ? {
                            backgroundColor: 'rgba(3, 22, 53, 0.08)',
                            border: '1px solid rgba(3, 22, 53, 0.15)',
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className="text-[12px] font-semibold truncate"
                          style={{ color: isActive ? '#031635' : '#374151' }}
                        >
                          {thread.university}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{thread.subject}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{thread.preview}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className="text-[10px] text-gray-400">{thread.date}</span>
                        {thread.unread && (
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: '#031635' }}
                          />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pilot Intelligence */}
          <div
            className="rounded-xl p-5"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>
                psychology
              </span>
              <span className="text-[12px] font-semibold text-white uppercase tracking-wide">
                Pilot Intelligence
              </span>
            </div>
            <p className="text-[12px] text-blue-200 leading-relaxed">
              Amara consistently responds within 2 hours. Stanford emails flagged as high priority.
              Tone preference: formal with personal warmth. Recommend following up on fin aid within 48h.
            </p>
            <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="material-symbols-outlined text-blue-300" style={{ fontSize: '14px' }}>
                trending_up
              </span>
              <span className="text-[11px] text-blue-300">Response rate: 94%</span>
            </div>
          </div>
        </div>

        {/* Right: 8 cols */}
        <div className="col-span-8 space-y-4">
          {/* Email Thread Area */}
          <div
            className="rounded-2xl p-8 min-h-[480px] flex flex-col gap-6"
            style={{ backgroundColor: 'rgba(247, 249, 251, 0.5)' }}
          >
            {/* Thread header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-[#031635]">Application Status Inquiry</h3>
                <p className="text-[12px] text-gray-400 mt-0.5">Stanford University · Mar 18, 2025</p>
              </div>
              <span
                className="text-[10px] font-semibold px-2 py-1 rounded-full"
                style={{ backgroundColor: '#E6F1FB', color: '#185FA5' }}
              >
                ACTIVE THREAD
              </span>
            </div>

            {/* Incoming message */}
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
              >
                AV
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[13px] font-semibold text-gray-800">Amara Vance</span>
                  <span className="text-[11px] text-gray-400">9:42 AM</span>
                </div>
                <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #e5e7eb' }}>
                  <p className="text-[13px] text-gray-700 leading-relaxed">
                    Hi, I wanted to follow up on my application status for the Class of 2025 admission cycle.
                    I submitted all required documents last week and wanted to confirm everything was received
                    and inquire about the next steps in the review process.
                  </p>
                </div>
              </div>
            </div>

            {/* Pilot Drafting Overlay */}
            {isDrafting && (
              <div
                className="rounded-2xl p-6"
                style={{
                  backgroundColor: '#ffffff',
                  border: '2px solid rgba(3, 22, 53, 0.2)',
                }}
              >
                {/* Drafting badge */}
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white"
                    style={{ backgroundColor: '#031635' }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '13px' }}
                    >
                      auto_fix_high
                    </span>
                    Pilot is drafting...
                  </span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{
                          backgroundColor: '#031635',
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Draft content */}
                <div className="space-y-3 text-[13px] text-gray-700 leading-relaxed">
                  <p>Dear Amara,</p>
                  <p>
                    Thank you for reaching out regarding your application to{' '}
                    <span
                      className="px-1 rounded"
                      style={{ backgroundColor: 'rgba(3, 22, 53, 0.08)', color: '#031635', fontWeight: 500 }}
                    >
                      Stanford University
                    </span>
                    . I have confirmed that all your submitted documents have been received and are currently
                    under review by the admissions committee.
                  </p>
                  <p>
                    Your application is flagged as{' '}
                    <span
                      className="px-1 rounded"
                      style={{ backgroundColor: '#EAF3DE', color: '#3B6D11', fontWeight: 500 }}
                    >
                      complete and competitive
                    </span>
                    . The committee typically completes reviews within{' '}
                    <span
                      className="px-1 rounded"
                      style={{ backgroundColor: '#E6F1FB', color: '#185FA5', fontWeight: 500 }}
                    >
                      3–4 weeks
                    </span>
                    , and you can expect to receive a decision by mid-April.
                  </p>
                  <p>Please don't hesitate to reach out if you have any further questions.</p>
                  <p>Warm regards,</p>
                </div>

                {/* Metadata row */}
                <div
                  className="mt-5 pt-4 flex items-center gap-6"
                  style={{ borderTop: '0.5px solid #e5e7eb' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '14px' }}>
                      tune
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Tone Profile:{' '}
                      <span className="font-medium text-gray-700">Formal + Warm</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '14px' }}>
                      database
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Context Usage:{' '}
                      <span className="font-medium text-gray-700">84%</span>
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      className="h-8 px-3 rounded-lg text-[12px] text-gray-500 transition hover:bg-gray-50"
                      style={{ border: '0.5px solid #e5e7eb' }}
                    >
                      Discard
                    </button>
                    <button
                      disabled
                      className="h-8 px-4 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1.5 opacity-50 cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>send</span>
                      Review &amp; Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer quick actions */}
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 h-9 px-4 rounded-full text-[12px] font-medium text-gray-600 bg-white transition hover:bg-gray-50"
              style={{ border: '0.5px solid #e5e7eb' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>attach_file</span>
              Attach Progress Report
            </button>
            <button
              className="flex items-center gap-2 h-9 px-4 rounded-full text-[12px] font-medium text-gray-600 bg-white transition hover:bg-gray-50"
              style={{ border: '0.5px solid #e5e7eb' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_month</span>
              Suggest Meeting Time
            </button>
          </div>
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition hover:shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
            bolt
          </span>
        </button>
      </div>
    </div>
  )
}
