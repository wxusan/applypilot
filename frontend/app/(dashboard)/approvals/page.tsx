// @ts-nocheck
import { createServerClient } from '@/lib/supabase-server'
import { agentTypeLabel, formatDate, formatDistanceToNow } from '@/lib/utils'
import ApprovalActions from '@/components/agents/ApprovalActions'
import BulkApproveButton from '@/components/agents/BulkApproveButton'
import { ClipboardCheck } from 'lucide-react'
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

  const jobIds = (jobs ?? []).map(j => j.id)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900">Approval Queue</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {count > 0 ? (
              <span>
                <span className="font-medium text-gray-800">{count}</span> item{count !== 1 ? 's' : ''} waiting for review
              </span>
            ) : (
              'All agent tasks are up to date'
            )}
          </p>
        </div>
        {count > 1 && <BulkApproveButton jobIds={jobIds} />}
      </div>

      {count === 0 ? (
        <div
          className="bg-white rounded-[10px] p-12 text-center"
          style={{ border: '0.5px solid #e5e7eb' }}
        >
          <ClipboardCheck size={28} className="mx-auto text-gray-200 mb-3" />
          <p className="text-[13px] font-medium text-gray-400">Nothing to review right now.</p>
          <p className="text-[12px] text-gray-300 mt-1">Agent actions that need approval will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs!.map((job) => {
            const screenshots = (job.screenshot_urls as string[]) ?? []
            const student = Array.isArray(job.student) ? job.student[0] : job.student
            const jobLabel = JOB_TYPE_LABELS[job.job_type] ?? job.job_type.replace(/_/g, ' ')

            return (
              <div
                key={job.id}
                className="bg-white rounded-[10px] overflow-hidden"
                style={{ border: '0.5px solid #e5e7eb' }}
              >
                {/* Card header */}
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: '0.5px solid #f3f4f6' }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-medium rounded-[4px] px-2 py-0.5"
                      style={{ backgroundColor: '#FAEEDA', color: '#854F0B' }}
                    >
                      {agentTypeLabel(job.agent_type)}
                    </span>
                    <span className="text-[13px] font-semibold text-gray-900 capitalize">
                      {jobLabel}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400" title={formatDate(job.created_at)}>
                    {formatDistanceToNow(new Date(job.created_at))} ago · {formatDate(job.created_at)}
                  </span>
                </div>

                <div className="flex items-start gap-5 p-5">
                  <div className="flex-1 min-w-0">
                    {/* Student link */}
                    {student && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[12px] text-gray-400">Student:</span>
                        <Link
                          href={`/students/${student.id}/profile`}
                          className="text-[13px] font-medium text-[#185FA5] hover:underline"
                        >
                          {student.full_name}
                        </Link>
                        {student.status && (
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-[3px] capitalize"
                            style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                          >
                            {student.status}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Approval message */}
                    {job.approval_message && (
                      <div
                        className="mb-3 px-3 py-2.5 rounded-[6px] text-[13px] text-gray-700 whitespace-pre-wrap"
                        style={{ backgroundColor: '#FAFAFA', border: '0.5px solid #e5e7eb' }}
                      >
                        {job.approval_message}
                      </div>
                    )}

                    {/* Output data preview */}
                    {job.output_data && Object.keys(job.output_data as object).length > 0 && (
                      <div className="mb-3">
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px] mb-1.5">
                          Output Data
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {Object.entries(job.output_data as Record<string, unknown>)
                            .slice(0, 6)
                            .map(([k, v]) => (
                              <span key={k} className="text-[12px] text-gray-600">
                                <span className="text-gray-400">{k}:</span>{' '}
                                <span className="font-medium">{String(v ?? '—')}</span>
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
                            className="text-[12px] font-medium text-[#185FA5] hover:underline"
                          >
                            📸 Screenshot {i + 1}
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
