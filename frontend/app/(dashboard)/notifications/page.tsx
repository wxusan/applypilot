// @ts-nocheck
import { createServerClient } from '@/lib/supabase-server'
import { Bell, CheckSquare, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, agentTypeLabel } from '@/lib/utils'

export default async function NotificationsPage() {
  const anonClient = createServerClient()
  const { data: { session } } = await anonClient.auth.getSession()

  const { createServiceClient } = await import('@/lib/supabase-server')
  const db = createServiceClient()

  const { data: member } = await db
    .from('agency_members')
    .select('agency_id')
    .eq('user_id', session!.user.id)
    .eq('is_active', true)
    .single()
  const agencyId = member?.agency_id as string

  // Pending approvals as notifications
  const { data: jobs } = await db
    .from('agent_jobs')
    .select(`
      id, agent_type, job_type, status, created_at,
      student:students(full_name)
    `)
    .eq('agency_id', agencyId)
    .eq('status', 'awaiting_approval')
    .order('created_at', { ascending: false })
    .limit(30)

  // Recent audit logs as activity notifications
  const { data: logs } = await db
    .from('audit_logs')
    .select('id, action, entity_type, created_at')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900">Notifications</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Agent actions and activity requiring your attention</p>
      </div>

      {/* Pending approvals */}
      {(jobs?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-[13px] font-medium text-gray-700 mb-2">Pending Approvals</h2>
          <div className="space-y-2">
            {jobs!.map(job => {
              const student = Array.isArray(job.student) ? job.student[0] : job.student
              return (
                <div
                  key={job.id}
                  className="bg-white rounded-[8px] px-4 py-3 flex items-center gap-3"
                  style={{ border: '0.5px solid #FED7AA' }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF7ED' }}>
                    <CheckSquare size={13} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-gray-900">
                      <span className="font-medium">{agentTypeLabel(job.agent_type)}</span>
                      {' needs approval: '}
                      {job.job_type.replace(/_/g, ' ')}
                      {student?.full_name && ` for ${student.full_name}`}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatDistanceToNow(new Date(job.created_at))} ago
                    </p>
                  </div>
                  <Link
                    href="/approvals"
                    className="shrink-0 text-[12px] font-medium text-brand hover:text-brand-dark transition-colors"
                  >
                    Review →
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Activity feed */}
      <div>
        <h2 className="text-[13px] font-medium text-gray-700 mb-2">Recent Activity</h2>
        {(logs?.length ?? 0) === 0 ? (
          <div
            className="bg-white rounded-[10px] p-10 text-center"
            style={{ border: '0.5px solid #e5e7eb' }}
          >
            <Bell size={24} className="mx-auto text-gray-200 mb-2" />
            <p className="text-[13px] text-gray-400">No recent activity</p>
          </div>
        ) : (
          <div className="bg-white rounded-[10px] overflow-hidden" style={{ border: '0.5px solid #e5e7eb' }}>
            {logs!.map((log, i) => (
              <div
                key={log.id}
                className="flex items-center gap-3 px-4 py-3"
                style={i < logs!.length - 1 ? { borderBottom: '0.5px solid #f3f4f6' } : undefined}
              >
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Clock size={11} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-gray-700 truncate">
                    {log.action.replace(/_/g, ' ').replace(/\./g, ' ')}
                    {log.entity_type && (
                      <span className="text-gray-400"> · {log.entity_type}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {formatDistanceToNow(new Date(log.created_at))} ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
