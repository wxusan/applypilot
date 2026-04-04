'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@/lib/supabase-browser'
import { formatDistanceToNow } from '@/lib/utils'

interface ActivityItem {
  id: string
  action: string
  entity_type: string | null
  created_at: string
  student_name: string | null
  actor_name: string | null
}

const ACTION_ICONS: Record<string, string> = {
  'browser.started':      '🤖',
  'browser.step_completed': '✅',
  'browser.submitted':    '🎉',
  'browser.failed':       '❌',
  'email.received':       '📧',
  'email.reply_sent':     '📤',
  'email.reply_queued':   '✍️',
  'essay.created':        '📝',
  'essay.approved':       '✅',
  'essay.rejected':       '↩️',
  'student.created':      '👤',
  'student.updated':      '✏️',
  'application.created':  '📋',
  'application.updated':  '📋',
  'deadline.completed':   '✅',
  'agency.updated':       '⚙️',
  'agency.logo_uploaded': '🖼️',
  'staff.invited':        '👋',
  'staff.deactivated':    '🚫',
  'staff.reactivated':    '✅',
  'document.ocr_processed': '📄',
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    'browser.started':        'Started browser agent',
    'browser.step_completed': 'Completed step',
    'browser.submitted':      'Submitted application',
    'browser.failed':         'Browser agent failed',
    'email.received':         'Received email',
    'email.reply_sent':       'Sent email reply',
    'email.reply_queued':     'Queued email reply',
    'essay.created':          'Generated essay',
    'essay.approved':         'Approved essay',
    'essay.rejected':         'Rejected essay',
    'student.created':        'Added student',
    'student.updated':        'Updated student',
    'application.created':    'Created application',
    'application.updated':    'Updated application',
    'deadline.completed':     'Marked deadline complete',
    'agency.updated':         'Updated agency settings',
    'agency.logo_uploaded':   'Uploaded agency logo',
    'staff.invited':          'Invited staff member',
    'staff.deactivated':      'Deactivated staff',
    'staff.reactivated':      'Reactivated staff',
    'document.ocr_processed': 'Processed document (OCR)',
  }
  return labels[action] ?? action.replace(/\./g, ' › ')
}

interface Props {
  initialItems: ActivityItem[]
  agencyId: string
}

export default function ActivityFeed({ initialItems, agencyId }: Props) {
  const [items, setItems] = useState<ActivityItem[]>(initialItems)
  // Memoize the client so it's created only once, preventing subscription leaks on re-render
  const supabase = useMemo(() => createBrowserClient(), [])

  useEffect(() => {
    const channel = supabase
      .channel(`activity-feed-${agencyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
          filter: `agency_id=eq.${agencyId}`,
        },
        async (payload: any) => {
          const row = payload.new as {
            id: string
            action: string
            entity_type: string | null
            created_at: string
            user_id: string | null
            student_id: string | null
          }

          // Resolve names in parallel
          const [studentRes, userRes] = await Promise.all([
            row.student_id
              ? supabase
                  .from('students')
                  .select('full_name')
                  .eq('id', row.student_id)
                  .single()
              : Promise.resolve({ data: null }),
            row.user_id
              ? supabase
                  .from('users')
                  .select('full_name')
                  .eq('id', row.user_id)
                  .single()
              : Promise.resolve({ data: null }),
          ])

          const newItem: ActivityItem = {
            id: row.id,
            action: row.action,
            entity_type: row.entity_type,
            created_at: row.created_at,
            student_name: (studentRes.data as { full_name?: string } | null)?.full_name ?? null,
            actor_name: (userRes.data as { full_name?: string } | null)?.full_name ?? null,
          }

          setItems((prev) => [newItem, ...prev].slice(0, 10))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [agencyId])

  return (
    <div className="bg-white rounded-[10px]" style={{ border: '0.5px solid #e5e7eb' }}>
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '0.5px solid #e5e7eb' }}
      >
        <h2 className="text-[14px] font-semibold text-gray-900">Live Activity</h2>
        <span
          className="flex items-center gap-1.5 text-[10px] font-medium"
          style={{ color: '#1D9E75' }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: '#1D9E75' }}
          />
          Live
        </span>
      </div>

      <div className="divide-y divide-gray-50">
        {items.length === 0 && (
          <p className="px-4 py-5 text-[12px] text-gray-400 text-center">
            No activity yet today.
          </p>
        )}
        {items.map((item) => {
          const icon = ACTION_ICONS[item.action] ?? '•'
          const timeAgo = formatDistanceToNow(new Date(item.created_at))
          return (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 text-[14px] shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-700 leading-snug">
                  <span className="font-medium">{actionLabel(item.action)}</span>
                  {item.student_name && (
                    <span className="text-gray-400"> · {item.student_name}</span>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.actor_name && (
                    <span className="text-[10px] text-gray-400">{item.actor_name}</span>
                  )}
                  <span className="text-[10px] text-gray-300">{timeAgo} ago</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
