'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

// API notification types map to display types
type NotificationType = 'decision' | 'deadline' | 'student' | 'message' | 'system' | 'info' | 'warning' | 'error' | 'success' | 'approval'

interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  is_read: boolean
  created_at: string
  metadata?: Record<string, any>
  user_id?: string | null
}

const TYPE_CONFIG: Record<string, { icon: string; iconBg: string; iconColor: string }> = {
  decision: { icon: 'verified', iconBg: '#dcfce7', iconColor: '#16a34a' },
  deadline: { icon: 'event_busy', iconBg: '#fee2e2', iconColor: '#dc2626' },
  student: { icon: 'person_add', iconBg: '#dbeafe', iconColor: '#2563eb' },
  message: { icon: 'mail', iconBg: '#f3e8ff', iconColor: '#9333ea' },
  system: { icon: 'rocket_launch', iconBg: '#e0e7ff', iconColor: '#4f46e5' },
  info: { icon: 'info', iconBg: '#e0e7ff', iconColor: '#4f46e5' },
  warning: { icon: 'warning', iconBg: '#fef9c3', iconColor: '#ca8a04' },
  error: { icon: 'error', iconBg: '#fee2e2', iconColor: '#dc2626' },
  success: { icon: 'check_circle', iconBg: '#dcfce7', iconColor: '#16a34a' },
  approval: { icon: 'approval', iconBg: '#f3e8ff', iconColor: '#9333ea' },
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} days ago`
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [pilotDismissed, setPilotDismissed] = useState(false)

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const decisionsCount = notifications.filter((n) => n.type === 'decision' || n.type === 'approval').length
  const newStudentsCount = notifications.filter((n) => n.type === 'student').length

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiFetch<Notification[]>('/api/notifications/')
      setNotifications(data)
    } catch (err) {
      console.error('[notifications] fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  async function markAllRead() {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' })
    } catch (err) {
      console.error('[notifications] mark-all-read failed:', err)
      // Revert on failure
      fetchNotifications()
    }
  }

  async function markRead(id: string) {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' })
    } catch (err) {
      console.error('[notifications] mark-read failed:', err)
      fetchNotifications()
    }
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold" style={{ color: '#031635', fontFamily: 'Manrope, sans-serif' }}>
            Notification Center
          </h2>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Stay informed about decisions, deadlines, and student activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={markAllRead}
            className="text-sm font-medium px-4 py-2 rounded-xl border transition-colors hover:bg-gray-50"
            style={{ borderColor: '#e2e8f0', color: '#031635' }}
          >
            Mark all as read
          </button>
          <button
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#031635' }}
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filters
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left column */}
        <div className="col-span-4 flex flex-col gap-5">
          {/* Critical Priority Card */}
          <div
            className="rounded-3xl p-6"
            style={{ backgroundColor: '#1a2b4b' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[20px]" style={{ color: '#f87171' }}>
                warning
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#f87171' }}>
                Critical Priority
              </span>
            </div>
            <p className="text-2xl font-extrabold text-white mt-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {unreadCount} Unread{unreadCount !== 1 ? 's' : ''}
            </p>
            <p className="text-sm mt-2" style={{ color: '#94a3b8' }}>
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''} requiring your attention.`
                : 'All caught up! No pending notifications.'}
            </p>
            <button
              onClick={markAllRead}
              className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              Mark All Read
            </button>
          </div>

          {/* Quick Stats Card */}
          <div className="rounded-3xl p-6 bg-white" style={{ border: '1px solid #e2e8f0' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#94a3b8' }}>
              Quick Stats
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: '#475569' }}>Unread</span>
                <span
                  className="text-sm font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                >
                  {unreadCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: '#475569' }}>Decisions / Approvals</span>
                <span
                  className="text-sm font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}
                >
                  {decisionsCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: '#475569' }}>New Students</span>
                <span
                  className="text-sm font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}
                >
                  {newStudentsCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — notification feed */}
        <div className="col-span-8 flex flex-col gap-3">
          {loading && (
            <div className="flex items-center justify-center py-16" style={{ color: '#94a3b8' }}>
              <span className="material-symbols-outlined text-[28px] animate-spin mr-2">progress_activity</span>
              Loading notifications…
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl" style={{ border: '1px dashed #e2e8f0' }}>
              <span className="material-symbols-outlined text-[40px] mb-3" style={{ color: '#cbd5e1' }}>
                notifications_off
              </span>
              <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>No notifications yet</p>
            </div>
          )}

          {!loading && notifications.map((notification) => {
            const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG['info']
            return (
              <div
                key={notification.id}
                className="rounded-2xl p-5 transition-all"
                style={{
                  backgroundColor: notification.is_read ? '#f8fafc' : '#ffffff',
                  border: `1px solid #e2e8f0`,
                  opacity: notification.is_read ? 0.85 : 1,
                }}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: cfg.iconBg }}
                  >
                    <span className="material-symbols-outlined text-[20px]" style={{ color: cfg.iconColor }}>
                      {cfg.icon}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold" style={{ color: '#031635' }}>
                        {notification.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs" style={{ color: '#94a3b8' }}>
                          {timeAgo(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: '#dc2626' }}
                          />
                        )}
                      </div>
                    </div>
                    <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                      {notification.body}
                    </p>
                    {!notification.is_read && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => markRead(notification.id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          style={{ backgroundColor: '#031635', color: '#ffffff' }}
                        >
                          Mark as Read
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pilot AI floating bar */}
      {!pilotDismissed && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 rounded-2xl shadow-xl"
          style={{
            background: 'rgba(3, 22, 53, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: '480px',
          }}
        >
          <span className="material-symbols-outlined text-[22px]" style={{ color: '#facc15' }}>
            auto_awesome
          </span>
          <p className="flex-1 text-sm font-medium text-white">
            Pilot AI:{' '}
            <span style={{ color: '#94a3b8' }}>
              {unreadCount > 0 ? `${unreadCount} notification${unreadCount !== 1 ? 's' : ''} need your attention` : 'All caught up'}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPilotDismissed(true)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#94a3b8', backgroundColor: 'rgba(255,255,255,0.08)' }}
            >
              Dismiss
            </button>
            <button
              className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#facc15', color: '#031635' }}
            >
              Action Center
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
