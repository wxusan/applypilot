import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import StudentTabs from '@/components/students/StudentTabs'
import StudentHeader from '@/components/students/StudentHeader'
import DeadlineActions from '@/components/deadlines/DeadlineActions'
import AddDeadlineForm from '@/components/deadlines/AddDeadlineForm'
import { formatDate, deadlineClass, daysUntil } from '@/lib/utils'

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

function getDeadlineUrgency(dueDate: string, isComplete: boolean) {
  if (isComplete) return 'complete'
  const days = daysUntil(dueDate)
  if (days === null) return 'upcoming'
  if (days < 0) return 'overdue'
  if (days <= 3) return 'soon'
  return 'upcoming'
}

function getDeadlineDateParts(dueDate: string) {
  const d = new Date(dueDate)
  return {
    month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
  }
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

  const allDeadlines = deadlines ?? []
  const upcoming = allDeadlines.filter((d) => !d.is_complete)
  const completed = allDeadlines.filter((d) => d.is_complete)

  const overdueCount = upcoming.filter((d) => {
    const days = daysUntil(d.due_date)
    return days !== null && days < 0
  }).length
  const soonCount = upcoming.filter((d) => {
    const days = daysUntil(d.due_date)
    return days !== null && days >= 0 && days <= 3
  }).length

  return (
    <div className="space-y-6">
      <StudentHeader student={student} />
      <StudentTabs studentId={params.id} active="deadlines" />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">
          <span className="font-bold text-primary">{upcoming.length}</span> upcoming
          {' · '}
          <span className="font-bold text-on-surface-variant">{completed.length}</span> completed
        </p>
        <AddDeadlineForm studentId={params.id} />
      </div>

      {allDeadlines.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-16 text-center border border-outline-variant/10">
          <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-3xl">calendar_clock</span>
          </div>
          <h3 className="font-headline font-bold text-xl text-primary mb-2">No Deadlines Yet</h3>
          <p className="text-on-surface-variant">Add the first deadline to start tracking this student&#39;s application timeline.</p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Pipeline Health */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <div className="bg-surface-container-low rounded-3xl p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-6">Pipeline Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-error rounded-full" />
                    <div>
                      <p className="text-sm font-bold text-primary">Overdue</p>
                      <p className="text-[10px] text-on-surface-variant/60">Immediate action</p>
                    </div>
                  </div>
                  <span className="text-xl font-extrabold text-error">{String(overdueCount).padStart(2, '0')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-amber-500 rounded-full" />
                    <div>
                      <p className="text-sm font-bold text-primary">Due Soon</p>
                      <p className="text-[10px] text-on-surface-variant/60">Within 72 hours</p>
                    </div>
                  </div>
                  <span className="text-xl font-extrabold text-amber-500">{String(soonCount).padStart(2, '0')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-400 rounded-full" />
                    <div>
                      <p className="text-sm font-bold text-primary">Upcoming</p>
                      <p className="text-[10px] text-on-surface-variant/60">Later this week</p>
                    </div>
                  </div>
                  <span className="text-xl font-extrabold text-blue-400">{String(upcoming.length - overdueCount - soonCount).padStart(2, '0')}</span>
                </div>
              </div>
            </div>

            {/* AI Suggestion */}
            <div className="rounded-3xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-blue-300">auto_awesome</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Pilot Insight</span>
                </div>
                <p className="text-sm font-medium leading-relaxed opacity-90">
                  Review overdue deadlines and reschedule with student approval to keep the application on track.
                </p>
              </div>
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl" />
            </div>
          </div>

          {/* Right Column: Deadlines List */}
          <div className="col-span-12 lg:col-span-9 space-y-4">
            {upcoming.length > 0 && (
              <>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-4">Upcoming Deadlines</h3>
                {upcoming.map((dl) => {
                  const urgency = getDeadlineUrgency(dl.due_date, dl.is_complete)
                  const { month, day } = getDeadlineDateParts(dl.due_date)
                  const days = daysUntil(dl.due_date)
                  const university = dl.application?.university_name
                  const typeLabel = DEADLINE_TYPE_LABELS[dl.type] ?? dl.type ?? ''

                  const borderColor = urgency === 'overdue' ? 'border-error' : urgency === 'soon' ? 'border-amber-500' : 'border-outline-variant/20'
                  const dateTextColor = urgency === 'overdue' ? 'text-error' : urgency === 'soon' ? 'text-amber-600' : 'text-on-surface-variant'
                  const dateBgColor = urgency === 'overdue' ? 'bg-error/5 border-error/10' : urgency === 'soon' ? 'bg-amber-50 border-amber-100' : 'bg-surface-container border-outline-variant/10'
                  const urgencyBadgeClass = urgency === 'overdue'
                    ? 'bg-error/10 text-error'
                    : urgency === 'soon'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-surface-container text-on-surface-variant'

                  return (
                    <div
                      key={dl.id}
                      className={`group relative bg-surface-container-lowest rounded-3xl p-6 shadow-sm border-l-8 ${borderColor} flex items-center gap-6 hover:shadow-md transition-all duration-300 border border-outline-variant/10`}
                    >
                      {/* Date badge */}
                      <div className={`flex-shrink-0 w-16 h-16 rounded-2xl ${dateBgColor} flex flex-col items-center justify-center border`}>
                        <span className={`text-[10px] font-bold uppercase ${dateTextColor}`}>{month}</span>
                        <span className={`text-2xl font-black ${dateTextColor}`}>{day}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {urgency !== 'upcoming' && (
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-tighter ${urgencyBadgeClass}`}>
                              {urgency === 'overdue' ? 'Overdue' : days !== null ? `${days}d left` : 'Soon'}
                            </span>
                          )}
                          {typeLabel && (
                            <span className="text-xs font-medium text-on-surface-variant">{typeLabel}</span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-primary">{dl.title}</h4>
                        {university && (
                          <p className="text-sm text-on-surface-variant">{university}</p>
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
              </>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-4 mt-8">Completed</h3>
                {completed.map((dl) => {
                  const { month, day } = getDeadlineDateParts(dl.due_date)
                  const university = dl.application?.university_name

                  return (
                    <div
                      key={dl.id}
                      className="group relative bg-surface-container-lowest rounded-3xl p-6 shadow-sm border-l-8 border-emerald-400 flex items-center gap-6 border border-outline-variant/10 opacity-60"
                    >
                      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold uppercase text-emerald-600">{month}</span>
                        <span className="text-2xl font-black text-emerald-600">{day}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase">Done</span>
                        </div>
                        <h4 className="text-base font-bold text-on-surface-variant line-through">{dl.title}</h4>
                        {university && (
                          <p className="text-sm text-on-surface-variant/60">{university}</p>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
