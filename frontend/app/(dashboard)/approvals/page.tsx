import { createServerClient } from '@/lib/supabase-server'
import { agentTypeLabel, formatDate } from '@/lib/utils'
import ApprovalActions from '@/components/agents/ApprovalActions'
import Link from 'next/link'

const JOB_TYPE_LABELS: Record<string, string> = {
  fill_common_app: 'Fill Common App',
  fill_university_portal: 'Fill University Portal',
  upload_document: 'Upload Document',
  send_email: 'Send Email',
  scrape_requirements: 'Scrape Requirements',
  essay_review: 'Essay Review',
  submit_application: 'Submit Application',
}

export default async function ApprovalsPage() {
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

  const { data: jobs } = await db
    .from('agent_jobs')
    .select(`
      id,
      agent_type,
      job_type,
      status,
      approval_message,
      screenshot_urls,
      output_data,
      created_at,
      student:students (id, full_name, status)
    `)
    .eq('agency_id', agencyId)
    .eq('status', 'awaiting_approval')
    .order('created_at', { ascending: false })

  const count = jobs?.length ?? 0

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-2">
          Approval Queue
        </h1>
        <p className="text-on-surface-variant text-lg">
          {count > 0 ? (
            <>
              <span className="font-bold text-primary">{count}</span> item{count !== 1 ? 's' : ''} waiting for human review
            </>
          ) : (
            'All agent tasks are up to date'
          )}
        </p>
      </div>

      {count === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-16 text-center border border-outline-variant/10">
          <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-3xl">check_circle</span>
          </div>
          <h3 className="font-headline font-bold text-xl text-primary mb-2">All Clear</h3>
          <p className="text-on-surface-variant">Nothing to review right now. Agent actions that need approval will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs!.map((job) => {
            const screenshots = (job.screenshot_urls as string[]) ?? []
            const student = Array.isArray(job.student) ? job.student[0] : job.student
            const jobLabel = JOB_TYPE_LABELS[job.job_type] ?? job.job_type.replace(/_/g, ' ')

            return (
              <div
                key={job.id}
                className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 shadow-sm"
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 bg-surface-container-low/30">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold px-3 py-1 bg-amber-100 text-amber-700 rounded-full uppercase tracking-tighter">
                      {agentTypeLabel(job.agent_type)}
                    </span>
                    <span className="text-sm font-bold text-primary capitalize">
                      {jobLabel}
                    </span>
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    {formatDate(job.created_at)}
                  </span>
                </div>

                <div className="flex items-start gap-6 p-6">
                  <div className="flex-1 min-w-0">
                    {/* Student link */}
                    {student && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs text-on-surface-variant">Student:</span>
                        <Link
                          href={`/students/${student.id}/profile`}
                          className="text-sm font-bold text-primary hover:underline"
                        >
                          {student.full_name}
                        </Link>
                        {student.status && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-full uppercase">
                            {student.status}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Approval message */}
                    {job.approval_message && (
                      <div className="mb-4 px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/10 text-sm text-on-surface whitespace-pre-wrap">
                        {job.approval_message}
                      </div>
                    )}

                    {/* Output data preview */}
                    {job.output_data && Object.keys(job.output_data as object).length > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                          Output Data
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {Object.entries(job.output_data as Record<string, unknown>)
                            .slice(0, 6)
                            .map(([k, v]) => (
                              <span key={k} className="text-xs text-on-surface-variant">
                                <span className="text-on-surface-variant/60">{k}:</span>{' '}
                                <span className="font-medium text-on-surface">{String(v ?? '—')}</span>
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Screenshots */}
                    {screenshots.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {screenshots.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline px-3 py-1 bg-primary-fixed/30 rounded-lg"
                          >
                            <span className="material-symbols-outlined text-sm">screenshot_monitor</span>
                            Screenshot {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0">
                    <ApprovalActions jobId={job.id} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
