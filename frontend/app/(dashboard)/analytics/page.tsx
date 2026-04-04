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

  const studentsByStatus: Record<string, number> = {}
  for (const s of (studentsRes.data as any[] | null) ?? []) {
    studentsByStatus[s.status] = (studentsByStatus[s.status] ?? 0) + 1
  }

  const decisionCounts: Record<string, number> = {
    accepted: 0,
    rejected: 0,
    waitlisted: 0,
    pending: 0,
  }
  for (const a of (appsRes.data as any[] | null) ?? []) {
    const key = a.decision ?? 'pending'
    decisionCounts[key] = (decisionCounts[key] ?? 0) + 1
  }

  const allDeadlines = (deadlinesRes.data as any[] | null) ?? []
  const pastDeadlines = allDeadlines.filter((d) => d.due_date <= todayStr)
  const completedOnTime = pastDeadlines.filter((d) => d.is_complete).length
  const complianceRate =
    pastDeadlines.length > 0
      ? Math.round((completedOnTime / pastDeadlines.length) * 100)
      : null

  const jobsByDay: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(Date.now() - (29 - i) * 86400000)
    jobsByDay[d.toISOString().split('T')[0]] = 0
  }
  for (const j of (agentJobsRes.data as any[] | null) ?? []) {
    const day = j.created_at.split('T')[0]
    if (day in jobsByDay) jobsByDay[day] = (jobsByDay[day] ?? 0) + 1
  }

  const totalStudents = studentsRes.data?.length ?? 0
  const totalApps = appsRes.data?.length ?? 0
  const acceptedCount = decisionCounts.accepted
  const decidedCount = decisionCounts.accepted + decisionCounts.rejected
  const acceptanceRate =
    decidedCount > 0
      ? Math.round((acceptedCount / decidedCount) * 100)
      : null

  const kpiCards = [
    {
      label: 'Total Students',
      value: totalStudents > 0 ? totalStudents.toLocaleString() : '--',
      icon: 'group',
      sub: null,
    },
    {
      label: 'Acceptance Rate',
      value: acceptanceRate !== null ? `${acceptanceRate}%` : '--',
      icon: 'verified',
      sub: acceptanceRate !== null ? `${acceptedCount} / ${decidedCount} decided` : 'No decisions yet',
    },
    {
      label: 'Applications',
      value: totalApps > 0 ? totalApps.toLocaleString() : '--',
      icon: 'description',
      sub: null,
    },
    {
      label: 'Deadline Compliance',
      value: complianceRate !== null ? `${complianceRate}%` : '--',
      icon: 'schedule',
      sub: complianceRate !== null
        ? `${completedOnTime} of ${pastDeadlines.length} on time`
        : 'No past deadlines',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-2">
          Performance Dossier
        </h1>
        <p className="text-on-surface-variant font-body text-lg">
          Real-time analytical overview of current consultancy cycle and student success metrics.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border-b-4 border-primary/10"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-on-surface-variant font-label text-xs font-semibold uppercase tracking-widest">
                {card.label}
              </span>
              <span className="material-symbols-outlined text-primary/40">{card.icon}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-headline font-bold text-primary">{card.value}</span>
              {card.sub && (
                <span className="text-xs font-bold text-on-surface-variant">{card.sub}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
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
