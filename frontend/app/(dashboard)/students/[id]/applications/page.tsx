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

  return (
    <div className="space-y-5">
      <StudentHeader student={student} />
      <StudentTabs studentId={params.id} active="applications" />

      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-500">
          {applications?.length ?? 0} application{applications?.length !== 1 ? 's' : ''}
        </p>
        <AddApplicationForm studentId={params.id} />
      </div>

      {!applications || applications.length === 0 ? (
        <div
          className="bg-white rounded-[10px] p-8 text-center"
          style={{ border: '0.5px solid #e5e7eb' }}
        >
          <p className="text-[13px] text-gray-400">No applications yet. Add the first one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const caStatus = (app.common_app_status ?? {}) as Record<string, string>

            return (
              <div
                key={app.id}
                className="bg-white rounded-[10px] overflow-hidden"
                style={{ border: '0.5px solid #e5e7eb' }}
              >
                {/* Application header */}
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: '0.5px solid #e5e7eb' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <h3 className="text-[15px] font-semibold text-gray-900 truncate">
                      {app.university_name}
                    </h3>
                    <StatusPill status={app.status} />
                    <span className="text-[11px] text-gray-400 capitalize shrink-0">
                      {app.application_type?.replace('_', ' ')}
                    </span>
                    {app.decision && (
                      <StatusPill status={app.decision} />
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {app.deadline_regular && (
                      <span className="text-[12px] text-gray-500">
                        Regular:{' '}
                        <span className={deadlineClass(app.deadline_regular)}>
                          {formatDateMono(app.deadline_regular)}
                        </span>
                      </span>
                    )}
                    {app.deadline_financial_aid && (
                      <span className="text-[12px] text-gray-500">
                        FA:{' '}
                        <span className={deadlineClass(app.deadline_financial_aid)}>
                          {formatDateMono(app.deadline_financial_aid)}
                        </span>
                      </span>
                    )}
                    {/* Fill Common App — AI browser automation */}
                    <FillCommonAppButton
                      studentId={params.id}
                      applicationId={app.id}
                      applicationStatus={app.status}
                      universityName={app.university_name}
                    />
                    {/* Edit / Delete actions */}
                    <ApplicationCardActions application={app} />
                  </div>
                </div>

                {/* Interactive Common App section progress */}
                <div className="px-5 py-4">
                  <CommonAppSectionTracker
                    applicationId={app.id}
                    initialStatus={caStatus}
                  />
                </div>

                {/* Financial / portal / notes footer */}
                {(app.scholarship_amount || app.financial_aid_amount ||
                  app.portal_url || app.application_fee_paid || app.notes) && (
                  <div
                    className="px-5 py-3 flex items-center gap-5 flex-wrap"
                    style={{ borderTop: '0.5px solid #e5e7eb' }}
                  >
                    {app.scholarship_amount != null && (
                      <span className="text-[12px] text-gray-500">
                        Scholarship:{' '}
                        <strong className="text-gray-800">
                          ${app.scholarship_amount.toLocaleString()}
                        </strong>
                      </span>
                    )}
                    {app.financial_aid_amount != null && (
                      <span className="text-[12px] text-gray-500">
                        FA:{' '}
                        <strong className="text-gray-800">
                          ${app.financial_aid_amount.toLocaleString()}
                        </strong>
                      </span>
                    )}
                    {app.application_fee_paid && (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-[3px]"
                        style={{ backgroundColor: '#EAF3DE', color: '#3B6D11' }}
                      >
                        Fee Paid
                      </span>
                    )}
                    {app.fee_waiver_used && (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-[3px]"
                        style={{ backgroundColor: '#E6F1FB', color: '#185FA5' }}
                      >
                        Fee Waiver
                      </span>
                    )}
                    {app.portal_url && (
                      <a
                        href={app.portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-[#185FA5] hover:underline"
                      >
                        Portal →
                      </a>
                    )}
                    {app.notes && (
                      <span className="text-[12px] text-gray-500 truncate max-w-[300px]">
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
