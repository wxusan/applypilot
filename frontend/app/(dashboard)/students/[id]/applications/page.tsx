// @ts-nocheck
import { createServerClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import StudentTabs from '@/components/students/StudentTabs'
import StudentHeader from '@/components/students/StudentHeader'
import StatusPill from '@/components/ui/StatusPill'
import AddApplicationForm from '@/components/applications/AddApplicationForm'
import ApplicationCardActions from '@/components/applications/ApplicationCardActions'
import CommonAppSectionTracker from '@/components/applications/CommonAppSectionTracker'
import FillCommonAppButton from '@/components/applications/FillCommonAppButton'
import { formatDate, deadlineClass, formatDateMono } from '@/lib/utils'

export default async function StudentApplicationsPage({
  params,
}: {
  params: { id: string }
}) {
  const { createServerClient, createServiceClient } = await import('@/lib/supabase-server')
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

  const [{ data: student }, { data: applications }] = await Promise.all([
    supabase
      .from('students')
      .select('id, full_name, status, nationality, high_school_name, graduation_year, email, telegram_username')
      .eq('id', params.id)
      .eq('agency_id', member.agency_id)
      .single(),
    supabase
      .from('applications')
      .select('*')
      .eq('student_id', params.id)
      .eq('agency_id', member.agency_id)
      .order('created_at', { ascending: false }),
  ])

  if (!student) notFound()

  const count = applications?.length ?? 0

  return (
    <div className="space-y-6">
      <StudentHeader student={student} />
      <StudentTabs studentId={params.id} active="applications" />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">
          <span className="font-bold text-primary">{count}</span>{' '}
          application{count !== 1 ? 's' : ''} in dossier
        </p>
        <AddApplicationForm studentId={params.id} />
      </div>

      {count === 0 ? (
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Empty state canvas */}
          <div className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-3xl p-1">
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm min-h-[500px] flex flex-col items-center justify-center p-12 text-center">
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150" />
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-dashed border-primary/10 rounded-full animate-pulse" />
                  <div className="absolute w-32 h-32 bg-primary/5 rounded-2xl rotate-12" />
                  <div className="absolute w-32 h-32 bg-primary/5 rounded-2xl -rotate-12" />
                  <div className="relative z-10 w-24 h-24 bg-white shadow-xl rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-primary/40">account_balance</span>
                  </div>
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary-fixed text-primary rounded-full flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-2xl">add</span>
                  </div>
                </div>
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="font-headline text-2xl font-bold text-primary mb-3">Begin the Academic Blueprint</h3>
                <p className="text-on-surface-variant leading-relaxed mb-10">
                  This student&#39;s university list is currently a blank canvas. Start architecting their future by adding target, reach, and safety institutions to their digital dossier.
                </p>
              </div>
            </div>
          </div>

          {/* Guidance panel */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div className="bg-primary-container rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute -bottom-8 -right-8 opacity-10">
                <span className="material-symbols-outlined text-[160px]">lightbulb</span>
              </div>
              <h4 className="font-headline text-lg font-bold mb-4 relative z-10">Consultant&#39;s Tip</h4>
              <p className="text-sm leading-relaxed text-on-primary-container font-medium mb-6 relative z-10">
                Research suggests that starting with a &ldquo;Safety&rdquo; list of 2-3 schools builds momentum for students early in the process.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const caStatus = (app.common_app_status ?? {}) as Record<string, string>

            return (
              <div
                key={app.id}
                className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 shadow-sm"
              >
                {/* Application header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 bg-surface-container-low/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-sm">account_balance</span>
                    </div>
                    <h3 className="text-sm font-bold text-primary truncate">
                      {app.university_name}
                    </h3>
                    <StatusPill status={app.status} />
                    <span className="text-[10px] text-on-surface-variant capitalize shrink-0 bg-surface-container px-2 py-0.5 rounded-full">
                      {app.application_type?.replace('_', ' ')}
                    </span>
                    {app.decision && (
                      <StatusPill status={app.decision} />
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {app.deadline_regular && (
                      <span className="text-xs text-on-surface-variant">
                        Regular:{' '}
                        <span className={deadlineClass(app.deadline_regular)}>
                          {formatDateMono(app.deadline_regular)}
                        </span>
                      </span>
                    )}
                    {app.deadline_financial_aid && (
                      <span className="text-xs text-on-surface-variant">
                        FA:{' '}
                        <span className={deadlineClass(app.deadline_financial_aid)}>
                          {formatDateMono(app.deadline_financial_aid)}
                        </span>
                      </span>
                    )}
                    <FillCommonAppButton
                      studentId={params.id}
                      applicationId={app.id}
                      applicationStatus={app.status}
                      universityName={app.university_name}
                    />
                    <ApplicationCardActions application={app} />
                  </div>
                </div>

                {/* Common App section progress */}
                <div className="px-6 py-4">
                  <CommonAppSectionTracker
                    applicationId={app.id}
                    initialStatus={caStatus}
                  />
                </div>

                {/* Financial / portal / notes footer */}
                {(app.scholarship_amount || app.financial_aid_amount ||
                  app.portal_url || app.application_fee_paid || app.notes) && (
                  <div className="px-6 py-3 flex items-center gap-5 flex-wrap border-t border-outline-variant/10 bg-surface-container-low/20">
                    {app.scholarship_amount != null && (
                      <span className="text-xs text-on-surface-variant">
                        Scholarship:{' '}
                        <strong className="text-on-surface">
                          ${app.scholarship_amount.toLocaleString()}
                        </strong>
                      </span>
                    )}
                    {app.financial_aid_amount != null && (
                      <span className="text-xs text-on-surface-variant">
                        FA:{' '}
                        <strong className="text-on-surface">
                          ${app.financial_aid_amount.toLocaleString()}
                        </strong>
                      </span>
                    )}
                    {app.application_fee_paid && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase">
                        Fee Paid
                      </span>
                    )}
                    {app.fee_waiver_used && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-container text-secondary uppercase">
                        Fee Waiver
                      </span>
                    )}
                    {app.portal_url && (
                      <a
                        href={app.portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        Portal
                      </a>
                    )}
                    {app.notes && (
                      <span className="text-xs text-on-surface-variant truncate max-w-[300px]">
                        {app.notes}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
