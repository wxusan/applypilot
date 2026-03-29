'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  is_read: boolean
  created_at: string
  metadata?: Record<string, string>
}

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  info:     { icon: 'info',           color: '#2563EB' },
  success:  { icon: 'check_circle',   color: '#059669' },
  warning:  { icon: 'warning',        color: '#D97706' },
  error:    { icon: 'error',          color: '#DC2626' },
  deadline: { icon: 'event',          color: '#7C3AED' },
  approval: { icon: 'pending_actions',color: '#D97706' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function NotificationBell() {
  const [count, setCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch unread count on mount and every 30s
  const fetchCount = useCallback(async () => {
    try {
      const res = await apiFetch<{ count: number }>('/api/notifications/unread-count')
      setCount(res.count ?? 0)
    } catch {
      // Silently fail — user might not be logged in yet
    }
  }, [])

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [fetchCount])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleOpen = async () => {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    setLoading(true)
    try {
      const data = await apiFetch<Notification[]>('/api/notifications/?limit=20')
      setNotifications(Array.isArray(data) ? data : [])
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAllRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' })
      setCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch {}
  }

  const markOneRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' })
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
      setCount((c) => Math.max(0, c - 1))
    } catch {}
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={handleOpen}
        className="relative group p-1 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors duration-200">
          notifications
        </span>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-error rounded-full border-2 border-surface flex items-center justify-center">
            <span className="text-[9px] font-bold text-white px-0.5">{count > 99 ? '99+' : count}</span>
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ border: '0.5px solid #e5e7eb' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-bold text-[#031635]">Notifications</h3>
              {count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#031635] text-white">
                  {count} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {count > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-semibold text-[#031635] hover:underline"
                >
                  Mark all read
                </button>
              )}
              <Link href="/notifications" className="text-[11px] text-gray-500 hover:text-[#031635]">
                View all
              </Link>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <span className="material-symbols-outlined animate-spin text-gray-400">sync</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-gray-300 text-4xl block mb-2">notifications_off</span>
                <p className="text-[13px] text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info
                return (
                  <button
                    key={notif.id}
                    onClick={() => !notif.is_read && markOneRead(notif.id)}
                    className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex gap-3"
                    style={{ borderBottom: '0.5px solid #f3f4f6' }}
                  >
                    {/* Icon */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: cfg.color + '15' }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '16px', color: cfg.color }}
                      >
                        {cfg.icon}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-[12px] leading-snug ${notif.is_read ? 'text-gray-600' : 'font-semibold text-[#031635]'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#031635] shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {!loading && notifications.length > 0 && (
            <div className="px-5 py-3" style={{ borderTop: '0.5px solid #e5e7eb' }}>
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-[12px] font-semibold text-[#031635] hover:underline flex items-center gap-1"
              >
                See all notifications
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>arrow_forward</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
