// @ts-nocheck
import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import StudentTabs from '@/components/students/StudentTabs'
import StudentHeader from '@/components/students/StudentHeader'
import DeadlineActions from '@/components/deadlines/DeadlineActions'
import AddDeadlineForm from '@/components/deadlines/AddDeadlineForm'
import { formatDate, deadlineClass, daysUntil } from '@/lib/utils'
import { CalendarClock } from 'lucide-react'

const DEADLINE_TYPE_LABELS: Record<string, string> = {
  application: 'Application',
  financial_aid: 'Financial Aid',
  scholarship: 'Scholarship',
  test: 'Test',
  document: 'Document',
  interview: 'Interview',
  decision: 'Decision',
  custom: 'Custom',
}

export default async function StudentDeadlinesPage({
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

  const [{ data: student }, { data: deadlines }] = await Promise.all([
    supabase
      .from('students')
      .select('id, full_name, status, nationality, high_school_name, graduation_year, email, telegram_username')
      .eq('id', params.id)
      .eq('agency_id', member.agency_id)
      .single(),
    supabase
      .from('deadlines')
      .select('*, application:applications(university_name)')
      .eq('student_id', params.id)
      .eq('agency_id', member.agency_id)
      .order('due_date', { ascending: true }),
  ])

  if (!student) notFound()

  const upcoming = (deadlines ?? []).filter((d) => !d.is_complete)
  const completed = (deadlines ?? []).filter((d) => d.is_complete)

  return (
    <div className="space-y-5">
      <StudentHeader student={student} />
      <StudentTabs studentId={params.id} active="deadlines" />

      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-500">
          {upcoming.length} upcoming · {completed.length} completed
        </p>
        <AddDeadlineForm studentId={params.id} />
      </div>

      {deadlines?.length === 0 && (
        <div
          className="bg-white rounded-[10px] p-10 text-center"
          style={{ border: '0.5px solid #e5e7eb' }}
        >
          <CalendarClock size={24} className="mx-auto text-gray-200 mb-3" />
          <p className="text-[13px] text-gray-400">No deadlines yet. Add the first one above.</p>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-[10px] overflow-hidden" style={{ border: '0.5px solid #e5e7eb' }}>
          <div className="px-5 py-3" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
            <p className="text-[12px] font-medium text-gray-500 uppercase tracking-[0.5px]">
              Upcoming
            </p>
          </div>
          <div className="divide-y divide-[#f3f4f6]">
            {upcoming.map((dl) => {
              const days = daysUntil(dl.due_date)
              const university = dl.application?.university_name
              return (
                <div key={dl.id} className="px-5 py-3 flex items-center gap-3">
                  <CalendarClock size={14} className="text-gray-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-800">{dl.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {dl.type ? DEADLINE_TYPE_LABELS[dl.type] ?? dl.type : ''}
                      {university ? ` · ${university}` : ''}
                      {dl.alert_days_before?.length > 0 && (
                        <span className="ml-2 text-gray-300">
                          alerts: {dl.alert_days_before.join(', ')}d
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={deadlineClass(dl.due_date)}>
                      {formatDate(dl.due_date)}
                    </p>
                    {days !== null && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {days === 0
                          ? 'Today'
                          : days < 0
                          ? `${Math.abs(days)}d overdue`
                          : `in ${days}d`}
                      </p>
                    )}
                  </div>
                  <DeadlineActions
                    deadline={{
                      id: dl.id,
                      title: dl.title,
                      type: dl.type,
                      due_date: dl.due_date,
                      is_complete: dl.is_complete,
                      alert_days_before: dl.alert_days_before ?? [30, 14, 7, 3, 1],
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="bg-white rounded-[10px] overflow-hidden" style={{ border: '0.5px solid #e5e7eb' }}>
          <div className="px-5 py-3" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
            <p className="text-[12px] font-medium text-gray-500 uppercase tracking-[0.5px]">
              Completed
            </p>
          </div>
          <div className="divide-y divide-[#f3f4f6]">
            {completed.map((dl) => (
              <div key={dl.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-gray-400 line-through">{dl.title}</p>
                  {dl.application?.university_name && (
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      {dl.application.university_name}
                    </p>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 font-mono shrink-0">
                  {formatDate(dl.due_date)}
                </p>
                <DeadlineActions
                  deadline={{
                    id: dl.id,
                    title: dl.title,
                    type: dl.type,
                    due_date: dl.due_date,
                    is_complete: dl.is_complete,
                    alert_days_before: dl.alert_days_before ?? [30, 14, 7, 3, 1],
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
