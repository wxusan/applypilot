// @ts-nocheck
import { createServerClient } from '@/lib/supabase-server'
import StatsRow from '@/components/dashboard/StatsRow'
import PipelineTable from '@/components/dashboard/PipelineTable'
import PendingApprovals from '@/components/dashboard/PendingApprovals'
import AgentActivity from '@/components/dashboard/AgentActivity'
import ActivityFeed from '@/components/dashboard/ActivityFeed'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Use service client for all data queries (bypasses RLS — server-side only)
  const { createServiceClient } = await import('@/lib/supabase-server')
  const db = createServiceClient()

  // Resolve agency_id from the session user
  const { data: member } = await db
    .from('agency_members')
    .select('agency_id')
    .eq('user_id', session!.user.id)
    .eq('is_active', true)
    .single()

  const agencyId = member?.agency_id as string

  if (!agencyId) {
    return <div className="p-6 text-red-500">Agency not found. Please contact support.</div>
  }

  // Fetch stats — all filtered by agency_id
  const [studentsRes, appRes, pendingRes, urgentRes] = await Promise.all([
    db.from('students').select('id, status', { count: 'exact' }).eq('agency_id', agencyId),
    db.from('applications').select('id, status', { count: 'exact' }).eq('agency_id', agencyId),
    db.from('agent_jobs').select('id', { count: 'exact' }).eq('agency_id', agencyId).eq('status', 'awaiting_approval'),
    db
      .from('deadlines')
      .select('id', { count: 'exact' })
      .eq('agency_id', agencyId)
      .eq('is_complete', false)
      .lte('due_date', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
  ])

  const stats = {
    totalStudents: studentsRes.count ?? 0,
    activeApplications: appRes.count ?? 0,
    pendingApprovals: pendingRes.count ?? 0,
    urgentDeadlines: urgentRes.count ?? 0,
  }

  // Pipeline data
  const { data: pipeline } = await db
    .from('students')
    .select(`
      id,
      full_name,
      status,
      season,
      applications (
        id,
        university_name,
        status,
        deadline_regular
      )
    `)
    .eq('agency_id', agencyId)
    .order('updated_at', { ascending: false })
    .limit(20)

  // Pending approvals
  const { data: approvals } = await db
    .from('agent_jobs')
    .select(`
      id,
      agent_type,
      job_type,
      approval_message,
      created_at,
      student:students (full_name)
    `)
    .eq('agency_id', agencyId)
    .eq('status', 'awaiting_approval')
    .order('created_at', { ascending: false })
    .limit(5)

  // Recent agent activity
  const { data: agentJobs } = await db
    .from('agent_jobs')
    .select(`
      id,
      agent_type,
      job_type,
      status,
      created_at,
      completed_at,
      student:students (full_name)
    `)
    .eq('agency_id', agencyId)
    .in('status', ['completed', 'running', 'failed'])
    .order('created_at', { ascending: false })
    .limit(10)

  // Initial activity feed — last 10 audit_log entries
  const { data: auditLogs } = await db
    .from('audit_logs')
    .select(`
      id,
      action,
      entity_type,
      created_at,
      student_id,
      user_id
    `)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(10)

  // Resolve names for initial items
  const studentIds = [...new Set((auditLogs ?? []).map((l) => l.student_id).filter(Boolean))]
  const userIds = [...new Set((auditLogs ?? []).map((l) => l.user_id).filter(Boolean))]

  const [studentsMap, usersMap] = await Promise.all([
    studentIds.length
      ? db.from('students').select('id, full_name').in('id', studentIds).then(({ data }) =>
          Object.fromEntries((data ?? []).map((s) => [s.id, s.full_name]))
        )
      : Promise.resolve({} as Record<string, string>),
    userIds.length
      ? db.from('users').select('id, full_name').in('id', userIds).then(({ data }) =>
          Object.fromEntries((data ?? []).map((u) => [u.id, u.full_name]))
        )
      : Promise.resolve({} as Record<string, string>),
  ])

  const activityItems = (auditLogs ?? []).map((l) => ({
    id: l.id as string,
    action: l.action as string,
    entity_type: l.entity_type as string | null,
    created_at: l.created_at as string,
    student_name: l.student_id ? (studentsMap as Record<string, string>)[l.student_id] ?? null : null,
    actor_name: l.user_id ? (usersMap as Record<string, string>)[l.user_id] ?? null : null,
  }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900">Dashboard</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          Overview of your agency pipeline
        </p>
      </div>

      <StatsRow stats={stats} />

      <PipelineTable students={pipeline ?? []} />

      <div className="grid grid-cols-2 gap-4">
        <PendingApprovals approvals={approvals ?? []} />
        <AgentActivity jobs={agentJobs ?? []} />
      </div>

      {/* Real-time activity feed */}
      <ActivityFeed initialItems={activityItems} agencyId={agencyId ?? ''} />
    </div>
  )
}
