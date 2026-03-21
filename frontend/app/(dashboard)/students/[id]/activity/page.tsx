import { createServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import StudentTabs from '@/components/students/StudentTabs'
import StudentHeader from '@/components/students/StudentHeader'
import { formatDate } from '@/lib/utils'
import { Activity } from 'lucide-react'

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

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  created: { bg: '#EAF3DE', color: '#3B6D11' },
  updated: { bg: '#E6F1FB', color: '#185FA5' },
  deleted: { bg: '#FCEBEB', color: '#A32D2D' },
  uploaded: { bg: '#EAF3DE', color: '#3B6D11' },
  completed: { bg: '#EAF3DE', color: '#3B6D11' },
  sent: { bg: '#E6F1FB', color: '#185FA5' },
  status_updated: { bg: '#FAEEDA', color: '#854F0B' },
}

function actionColor(action: string) {
  const suffix = action.split('.')[1] ?? ''
  return ACTION_COLORS[suffix] ?? { bg: '#F3F4F6', color: '#6B7280' }
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

  // Resolve agency for the current user (for isolation)
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

  return (
    <div className="space-y-5">
      <StudentHeader student={student} />
      <StudentTabs studentId={params.id} active="activity" />

      <div>
        <p className="text-[13px] text-gray-500">
          {logs?.length ?? 0} event{(logs?.length ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>

      {!logs || logs.length === 0 ? (
        <div
          className="bg-white rounded-[10px] p-10 text-center"
          style={{ border: '0.5px solid #e5e7eb' }}
        >
          <Activity size={24} className="mx-auto text-gray-200 mb-3" />
          <p className="text-[13px] text-gray-400">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[10px] overflow-hidden" style={{ border: '0.5px solid #e5e7eb' }}>
          <div className="divide-y divide-[#f3f4f6]">
            {logs.map((log) => {
              const { bg, color } = actionColor(log.action)
              const actor = (log.actor as { full_name: string } | null)?.full_name ?? 'System'
              const hasChanges =
                log.old_value !== null || log.new_value !== null

              return (
                <div key={log.id} className="px-5 py-3 flex items-start gap-4">
                  {/* Action badge */}
                  <div className="mt-0.5 shrink-0">
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-[3px] whitespace-nowrap"
                      style={{ backgroundColor: bg, color }}
                    >
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] text-gray-600">
                        by <span className="font-medium">{actor}</span>
                      </p>
                      {log.entity_type && log.entity_type !== 'student' && (
                        <span className="text-[11px] text-gray-400 capitalize">
                          · {log.entity_type}
                        </span>
                      )}
                    </div>

                    {hasChanges && (
                      <div className="mt-1.5 space-y-0.5">
                        {log.old_value && Object.keys(log.old_value).length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-medium text-gray-400 shrink-0 mt-0.5">FROM</span>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(log.old_value as Record<string, unknown>).map(([k, v]) => (
                                <span key={k} className="text-[10px] text-gray-500">
                                  <span className="text-gray-400">{k}:</span>{' '}
                                  {String(v ?? '—')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {log.new_value && Object.keys(log.new_value).length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-medium text-[#3B6D11] shrink-0 mt-0.5">TO</span>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(log.new_value as Record<string, unknown>).map(([k, v]) => (
                                <span key={k} className="text-[10px] text-gray-700">
                                  <span className="text-gray-400">{k}:</span>{' '}
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
                    <p className="text-[11px] text-gray-400">
                      {new Date(log.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-[10px] text-gray-300 font-mono">
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
