import { createServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import StudentTabs from '@/components/students/StudentTabs'
import StudentHeader from '@/components/students/StudentHeader'
import { formatDate } from '@/lib/utils'

const ACTION_LABELS: Record<string, string> = {
  'student.created': 'Student created',
  'student.updated': 'Student updated',
  'student.deleted': 'Student deleted',
  'application.created': 'Application added',
  'application.updated': 'Application updated',
  'application.deleted': 'Application deleted',
  'document.uploaded': 'Document uploaded',
  'document.status_updated': 'Document status changed',
  'document.deleted': 'Document deleted',
  'deadline.created': 'Deadline added',
  'deadline.completed': 'Deadline completed',
  'deadline.deleted': 'Deadline deleted',
  'email.sent': 'Email sent',
}

function actionStyle(action: string): { badge: string; icon: string; iconClass: string } {
  const suffix = action.split('.')[1] ?? ''
  const map: Record<string, { badge: string; icon: string; iconClass: string }> = {
    created: { badge: 'bg-emerald-100 text-emerald-700', icon: 'add_circle', iconClass: 'text-emerald-500' },
    uploaded: { badge: 'bg-emerald-100 text-emerald-700', icon: 'upload_file', iconClass: 'text-emerald-500' },
    completed: { badge: 'bg-emerald-100 text-emerald-700', icon: 'task_alt', iconClass: 'text-emerald-500' },
    updated: { badge: 'bg-secondary-container text-secondary', icon: 'edit', iconClass: 'text-secondary' },
    status_updated: { badge: 'bg-amber-100 text-amber-700', icon: 'swap_horiz', iconClass: 'text-amber-500' },
    deleted: { badge: 'bg-error-container/50 text-error', icon: 'delete', iconClass: 'text-error' },
    sent: { badge: 'bg-secondary-container text-secondary', icon: 'mail', iconClass: 'text-secondary' },
  }
  return map[suffix] ?? { badge: 'bg-surface-container text-on-surface-variant', icon: 'info', iconClass: 'text-on-surface-variant' }
}

export default async function StudentActivityPage({
  params,
}: {
  params: { id: string }
}) {
  const anonClient = createServerClient()
  const { data: { session } } = await anonClient.auth.getSession()
  if (!session) notFound()

  const supabase = createServiceClient()

  const { data: member } = await supabase
    .from('agency_members')
    .select('agency_id')
    .eq('user_id', session.user.id)
    .single()
  if (!member) notFound()

  const [{ data: student }, { data: logs }] = await Promise.all([
    supabase
      .from('students')
      .select('id, full_name, status, nationality, high_school_name, graduation_year, email, telegram_username')
      .eq('id', params.id)
      .eq('agency_id', member.agency_id)
      .single(),
    supabase
      .from('audit_logs')
      .select(
        'id, action, entity_type, entity_id, old_value, new_value, created_at, ' +
        'user_id, ip_address, actor:users!user_id(full_name)'
      )
      .eq('student_id', params.id)
      .eq('agency_id', member.agency_id)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  if (!student) notFound()

  const count = logs?.length ?? 0

  return (
    <div className="space-y-6">
      <StudentHeader student={student} />
      <StudentTabs studentId={params.id} active="activity" />

      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">
          <span className="font-bold text-primary">{count}</span>{' '}
          event{count !== 1 ? 's' : ''} recorded
        </p>
      </div>

      {count === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-16 text-center border border-outline-variant/10">
          <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-3xl">history</span>
          </div>
          <h3 className="font-headline font-bold text-xl text-primary mb-2">No Activity Yet</h3>
          <p className="text-on-surface-variant">Changes to this student&#39;s record will appear here.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="px-6 py-4 border-b border-outline-variant/10 bg-surface-container-low/30 flex items-center gap-4">
            <h3 className="font-headline font-bold text-primary">Audit Trail</h3>
            <div className="h-4 w-px bg-outline-variant/30" />
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {count} Events
            </span>
          </div>

          <div className="divide-y divide-outline-variant/10">
            {logs!.map((log) => {
              const style = actionStyle(log.action)
              const actor = (log.actor as { full_name: string } | null)?.full_name ?? 'System'
              const hasChanges = log.old_value !== null || log.new_value !== null

              return (
                <div key={log.id} className="px-6 py-4 flex items-start gap-5 hover:bg-surface-container-low/30 transition-colors">
                  {/* Icon */}
                  <div className="shrink-0 mt-0.5 w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center">
                    <span className={`material-symbols-outlined text-base ${style.iconClass}`}>{style.icon}</span>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-tighter ${style.badge}`}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        by <span className="font-semibold text-on-surface">{actor}</span>
                      </span>
                      {log.entity_type && log.entity_type !== 'student' && (
                        <span className="text-[10px] font-medium text-on-surface-variant/60 bg-surface-container px-2 py-0.5 rounded-full capitalize">
                          {log.entity_type}
                        </span>
                      )}
                    </div>

                    {hasChanges && (
                      <div className="mt-2 space-y-1.5 font-mono text-xs">
                        {log.old_value && Object.keys(log.old_value).length > 0 && (
                          <div className="flex items-start gap-2 bg-error-container/20 px-3 py-1.5 rounded-lg">
                            <span className="text-error font-bold shrink-0">−</span>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                              {Object.entries(log.old_value as Record<string, unknown>).map(([k, v]) => (
                                <span key={k} className="text-error/80">
                                  <span className="opacity-60">{k}:</span>{' '}
                                  {String(v ?? '—')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {log.new_value && Object.keys(log.new_value).length > 0 && (
                          <div className="flex items-start gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg">
                            <span className="text-emerald-600 font-bold shrink-0">+</span>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                              {Object.entries(log.new_value as Record<string, unknown>).map(([k, v]) => (
                                <span key={k} className="text-emerald-700">
                                  <span className="opacity-60">{k}:</span>{' '}
                                  <span className="font-medium">{String(v ?? '—')}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-on-surface-variant">
                      {new Date(log.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-[10px] text-on-surface-variant/60 font-mono mt-0.5">
                      {new Date(log.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
