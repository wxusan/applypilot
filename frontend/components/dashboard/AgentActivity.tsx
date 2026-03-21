import { agentTypeLabel, getStatusStyle, formatDate } from '@/lib/utils'

interface AgentJob {
  id: string
  agent_type: string
  job_type: string
  status: string
  created_at: string
  completed_at: string | null
  student: { full_name: string } | null
}

function AgentDot({ status }: { status: string }) {
  if (status === 'running') return <span className="agent-dot" />
  if (status === 'completed') return <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
  if (status === 'failed') return <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
  return <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
}

export default function AgentActivity({ jobs }: { jobs: AgentJob[] }) {
  return (
    <div className="bg-white rounded-[10px]" style={{ border: '0.5px solid #e5e7eb' }}>
      <div
        className="px-5 py-3.5"
        style={{ borderBottom: '0.5px solid #e5e7eb' }}
      >
        <h2 className="text-[15px] font-semibold text-gray-900">Agent Activity</h2>
      </div>

      <div>
        {jobs.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-[13px] text-gray-400">No recent agent activity</p>
          </div>
        ) : (
          jobs.map((job, i) => {
            const style = getStatusStyle(job.status)
            return (
              <div
                key={job.id}
                className="px-5 py-2.5 flex items-center justify-between gap-3"
                style={i < jobs.length - 1 ? { borderBottom: '0.5px solid #f3f4f6' } : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <AgentDot status={job.status} />
                  <div className="min-w-0">
                    <p className="text-[13px] text-gray-800 truncate">
                      {agentTypeLabel(job.agent_type)}
                    </p>
                    {job.student && (
                      <p className="text-[11px] text-gray-400 truncate">{job.student.full_name}</p>
                    )}
                  </div>
                </div>
                <span
                  className="text-[11px] font-medium rounded-[4px] px-2 py-0.5 shrink-0"
                  style={{ backgroundColor: style.bg, color: style.color }}
                >
                  {style.label}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
