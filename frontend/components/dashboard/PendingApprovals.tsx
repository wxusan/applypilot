import Link from 'next/link'
import { agentTypeLabel, formatDate } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'

interface ApprovalJob {
  id: string
  agent_type: string
  job_type: string
  approval_message: string | null
  created_at: string
  student: { full_name: string } | null
}

export default function PendingApprovals({ approvals }: { approvals: ApprovalJob[] }) {
  return (
    <div className="bg-white rounded-[10px]" style={{ border: '0.5px solid #e5e7eb' }}>
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: '0.5px solid #e5e7eb' }}
      >
        <h2 className="text-[15px] font-semibold text-gray-900">Pending Approvals</h2>
        <Link href="/approvals" className="text-[12px] text-brand hover:text-brand-dark transition">
          View all
        </Link>
      </div>

      <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
        {approvals.length === 0 ? (
          <div className="px-5 py-6 flex flex-col items-center gap-2 text-center">
            <CheckCircle size={20} className="text-gray-300" />
            <p className="text-[13px] text-gray-400">No pending approvals</p>
          </div>
        ) : (
          approvals.map((job) => (
            <div key={job.id} className="px-5 py-3" style={{ borderBottom: '0.5px solid #f3f4f6' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 truncate">
                    {agentTypeLabel(job.agent_type)} — {job.job_type.replace(/_/g, ' ')}
                  </p>
                  {job.student && (
                    <p className="text-[12px] text-gray-500 mt-0.5">{job.student.full_name}</p>
                  )}
                  {job.approval_message && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{job.approval_message}</p>
                  )}
                </div>
                <Link
                  href={`/approvals/${job.id}`}
                  className="shrink-0 h-7 px-3 rounded-[6px] text-[12px] font-medium text-white flex items-center"
                  style={{ backgroundColor: '#1D9E75' }}
                >
                  Review
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
