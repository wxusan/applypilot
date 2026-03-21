import { createServerClient } from '@/lib/supabase-server'
import AnalyticsCharts from '@/components/analytics/AnalyticsCharts'

export default async function AnalyticsPage() {
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

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const todayStr = new Date().toISOString().split('T')[0]

  const [studentsRes, appsRes, deadlinesRes, agentJobsRes] = await Promise.all([
    db.from('students').select('status').eq('agency_id', agencyId),
    db.from('applications').select('status, decision').eq('agency_id', agencyId),
    db.from('deadlines').select('is_complete, due_date').eq('agency_id', agencyId),
    db
      .from('agent_jobs')
      .select('status, created_at')
      .eq('agency_id', agencyId)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true }),
  ])

  // Student pipeline by status
  const studentsByStatus: Record<string, number> = {}
  for (const s of studentsRes.data ?? []) {
    studentsByStatus[s.status] = (studentsByStatus[s.status] ?? 0) + 1
  }

  // Application decisions
  const decisionCounts: Record<string, number> = {
    accepted: 0,
    rejected: 0,
    waitlisted: 0,
    pending: 0,
  }
  for (const a of appsRes.data ?? []) {
    const key = a.decision ?? 'pending'
    decisionCounts[key] = (decisionCounts[key] ?? 0) + 1
  }

  // Deadline compliance
  const allDeadlines = deadlinesRes.data ?? []
  const pastDeadlines = allDeadlines.filter((d) => d.due_date <= todayStr)
  const completedOnTime = pastDeadlines.filter((d) => d.is_complete).length
  const complianceRate =
    pastDeadlines.length > 0
      ? Math.round((completedOnTime / pastDeadlines.length) * 100)
      : null

  // Agent activity — jobs per day last 30 days
  const jobsByDay: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(Date.now() - (29 - i) * 86400000)
    jobsByDay[d.toISOString().split('T')[0]] = 0
  }
  for (const j of agentJobsRes.data ?? []) {
    const day = j.created_at.split('T')[0]
    if (day in jobsByDay) jobsByDay[day] = (jobsByDay[day] ?? 0) + 1
  }

  const totalStudents = studentsRes.data?.length ?? 0
  const totalApps = appsRes.data?.length ?? 0
  const acceptedCount = decisionCounts.accepted
  // Only count apps that have a final decision (accepted or rejected) as denominator
  const decidedCount = decisionCounts.accepted + decisionCounts.rejected
  const acceptanceRate =
    decidedCount > 0
      ? Math.round((acceptedCount / decidedCount) * 100)
      : null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900">Analytics</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Agency-wide performance overview</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Students" value={totalStudents} />
        <StatCard label="Total Applications" value={totalApps} />
        <StatCard
          label="Acceptance Rate"
          value={acceptanceRate !== null ? `${acceptanceRate}%` : '—'}
          sub={acceptanceRate !== null ? `${acceptedCount} / ${decidedCount} decided` : 'No decisions yet'}
        />
        <StatCard
          label="Deadline Compliance"
          value={complianceRate !== null ? `${complianceRate}%` : '—'}
          sub={
            complianceRate !== null
              ? `${completedOnTime} of ${pastDeadlines.length} on time`
              : 'No past deadlines'
          }
          valueColor={
            complianceRate === null ? undefined : complianceRate >= 80 ? '#166534' : complianceRate >= 60 ? '#854F0B' : '#991B1B'
          }
        />
      </div>

      {/* Charts rendered client-side */}
      <AnalyticsCharts
        studentsByStatus={studentsByStatus}
        decisionCounts={decisionCounts}
        jobsByDay={jobsByDay}
        complianceRate={complianceRate}
        completedOnTime={completedOnTime}
        totalPastDeadlines={pastDeadlines.length}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string
  value: number | string
  sub?: string
  valueColor?: string
}) {
  return (
    <div className="bg-white rounded-[10px] px-5 py-4" style={{ border: '0.5px solid #e5e7eb' }}>
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-2">{label}</p>
      <p
        className="text-[28px] font-semibold leading-none"
        style={{ color: valueColor ?? '#111827' }}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
