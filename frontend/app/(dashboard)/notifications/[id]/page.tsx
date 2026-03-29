'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  is_read: boolean
  created_at: string
  metadata?: Record<string, any> | null
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  deadline:  { icon: 'event_busy',       color: '#DC2626', bg: '#FEE2E2', label: 'Deadline' },
  approval:  { icon: 'approval',         color: '#7C3AED', bg: '#EDE9FE', label: 'Approval' },
  warning:   { icon: 'warning',          color: '#D97706', bg: '#FEF3C7', label: 'Warning' },
  error:     { icon: 'error',            color: '#DC2626', bg: '#FEE2E2', label: 'Error' },
  success:   { icon: 'check_circle',     color: '#059669', bg: '#D1FAE5', label: 'Success' },
  info:      { icon: 'info',             color: '#2563EB', bg: '#DBEAFE', label: 'Info' },
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

export default function NotificationDetailPage() {
  const params = useParams<{ id: string }>()
  const [notification, setNotification] = useState<Notification | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch all notifications and find matching ID (no individual GET endpoint)
    apiFetch<Notification[]>('/api/notifications/?limit=100')
      .then((list) => {
        const found = list.find((n) => n.id === params.id)
        if (found) {
          setNotification(found)
          // Mark as read
          if (!found.is_read) {
            apiFetch(`/api/notifications/${params.id}/read`, { method: 'POST' }).catch(() => {})
          }
        } else {
          setError('Notification not found')
        }
      })
      .catch((e: any) => setError(e.message || 'Failed to load notification'))
      .finally(() => setLoading(false))
  }, [params.id])

  const cfg = notification ? (TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.info) : TYPE_CONFIG.info

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-400">
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>sync</span>
          <span className="text-[14px]">Loading notification...</span>
        </div>
      </div>
    )
  }

  if (error || !notification) {
    return (
      <div className="space-y-4">
        <Link href="/notifications" className="flex items-center gap-2 text-gray-500 hover:text-[#031635] transition-colors text-[13px] font-medium w-fit">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Back to Notifications
        </Link>
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '0.5px solid #e5e7eb' }}>
          <span className="material-symbols-outlined text-gray-300 text-5xl block mb-3">notifications_off</span>
          <h3 className="text-[15px] font-bold text-[#031635] mb-2">Notification not found</h3>
          <p className="text-[13px] text-gray-500 mb-5">This notification may have been deleted or expired.</p>
          <Link
            href="/notifications"
            className="h-10 px-6 rounded-xl text-[13px] font-semibold text-white inline-flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            View All Notifications
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Link href="/notifications" className="flex items-center gap-2 text-gray-500 hover:text-[#031635] transition-colors text-[13px] font-medium w-fit">
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
        Back to Notifications
      </Link>

      {/* Main card */}
      <div
        className="bg-white rounded-2xl p-8"
        style={{ border: `1px solid ${cfg.color}30`, borderLeftWidth: 4, borderLeftColor: cfg.color }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: cfg.bg }}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ color: cfg.color }}>
              {cfg.icon}
            </span>
          </div>
          <div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ color: cfg.color, backgroundColor: cfg.bg }}
            >
              {cfg.label.toUpperCase()}
            </span>
          </div>
          <span className="text-[12px] text-gray-400 ml-auto">{timeAgo(notification.created_at)}</span>
        </div>

        <h1 className="text-[20px] font-bold text-[#031635] mb-4 leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {notification.title}
        </h1>

        <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
          {notification.body}
        </p>

        {notification.metadata && Object.keys(notification.metadata).length > 0 && (
          <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: '#f9fafb', border: '0.5px solid #e5e7eb' }}>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Details</p>
            <div className="space-y-2">
              {Object.entries(notification.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between text-[13px]">
                  <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="font-semibold text-[#031635]">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {notification.metadata?.student_id && (
            <Link
              href={`/students/${notification.metadata.student_id}/profile`}
              className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white inline-flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
              View Student
            </Link>
          )}
          {notification.metadata?.job_id && (
            <Link
              href={`/approvals/${notification.metadata.job_id}`}
              className="h-9 px-4 rounded-lg text-[13px] font-semibold text-gray-600 inline-flex items-center gap-2"
              style={{ border: '0.5px solid #e5e7eb' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>approval</span>
              Review Approval
            </Link>
          )}
          <Link
            href="/notifications"
            className="h-9 px-4 rounded-lg text-[13px] font-semibold text-gray-500 inline-flex items-center gap-2 ml-auto"
            style={{ border: '0.5px solid #e5e7eb' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
            All Notifications
          </Link>
        </div>
      </div>

      {/* Timestamp */}
      <p className="text-[12px] text-gray-400 text-center">
        Received {new Date(notification.created_at).toLocaleString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric',
          hour: 'numeric', minute: '2-digit',
        })}
      </p>
    </div>
  )
}
