'use client'

import { useState } from 'react'

type NotificationType = 'decision' | 'deadline' | 'student' | 'message' | 'system'

interface Notification {
  id: string
  type: NotificationType
  title: string
  time: string
  description: string
  read: boolean
  actions: string[]
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'decision',
    title: 'Admission Decision Received',
    time: '2 min ago',
    description: 'Stanford University has released an admission decision for Alexander Chen. Application ID: APP-2024-0891.',
    read: false,
    actions: ['View Decision', 'Notify Student'],
  },
  {
    id: '2',
    type: 'deadline',
    title: 'Deadline in 48 Hours',
    time: '15 min ago',
    description: 'MIT Regular Decision deadline is approaching for 3 students. Documents still pending review.',
    read: false,
    actions: ['Review Now', 'Snooze'],
  },
  {
    id: '3',
    type: 'student',
    title: 'New Student Onboarded',
    time: '1 hr ago',
    description: 'Priya Sharma has completed her profile setup and is ready for application assignment.',
    read: false,
    actions: ['View Profile', 'Assign Apps'],
  },
  {
    id: '4',
    type: 'message',
    title: 'Message from UC Berkeley Admissions',
    time: '3 hrs ago',
    description: 'UC Berkeley Admissions Office sent a follow-up regarding supplemental materials for Jordan Williams.',
    read: true,
    actions: ['Read Message', 'Reply'],
  },
  {
    id: '5',
    type: 'system',
    title: 'Pilot AI Completed 12 Tasks',
    time: '5 hrs ago',
    description: 'The browser agent successfully filled 12 application sections across 4 portals. Review recommended.',
    read: true,
    actions: ['View Report'],
  },
]

const TYPE_CONFIG: Record<NotificationType, { icon: string; iconBg: string; iconColor: string }> = {
  decision: { icon: 'verified', iconBg: '#dcfce7', iconColor: '#16a34a' },
  deadline: { icon: 'event_busy', iconBg: '#fee2e2', iconColor: '#dc2626' },
  student: { icon: 'person_add', iconBg: '#dbeafe', iconColor: '#2563eb' },
  message: { icon: 'mail', iconBg: '#f3e8ff', iconColor: '#9333ea' },
  system: { icon: 'rocket_launch', iconBg: '#e0e7ff', iconColor: '#4f46e5' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [pilotDismissed, setPilotDismissed] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length
  const decisionsCount = notifications.filter((n) => n.type === 'decision').length
  const newStudentsCount = notifications.filter((n) => n.type === 'student').length

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
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
              3 Deadlines Approaching
            </p>
            <p className="text-sm mt-2" style={{ color: '#94a3b8' }}>
              MIT, Yale, and Columbia have Regular Decision deadlines within 48 hours. Immediate action required.
            </p>
            <button
              className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              Review Timeline
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
                <span className="text-sm font-medium" style={{ color: '#475569' }}>Decisions Received</span>
                <span
                  className="text-sm font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}
                >
                  {decisionsCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: '#475569' }}>New Inquiries</span>
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
          {notifications.map((notification) => {
            const cfg = TYPE_CONFIG[notification.type]
            return (
              <div
                key={notification.id}
                className="rounded-2xl p-5 transition-all"
                style={{
                  backgroundColor: notification.read ? '#f8fafc' : '#ffffff',
                  border: `1px solid ${notification.read ? '#e2e8f0' : '#e2e8f0'}`,
                  opacity: notification.read ? 0.85 : 1,
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
                          {notification.time}
                        </span>
                        {!notification.read && (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: '#dc2626' }}
                          />
                        )}
                      </div>
                    </div>
                    <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                      {notification.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      {notification.actions.map((action, i) => (
                        <button
                          key={action}
                          onClick={() => markRead(notification.id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          style={
                            i === 0
                              ? { backgroundColor: '#031635', color: '#ffffff' }
                              : { backgroundColor: '#f1f5f9', color: '#475569' }
                          }
                        >
                          {action}
                        </button>
                      ))}
                    </div>
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
            Pilot AI: <span style={{ color: '#94a3b8' }}>3 high-priority tasks remaining today</span>
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
