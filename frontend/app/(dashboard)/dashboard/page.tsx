// @ts-nocheck
import { createServerClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { createServiceClient } = await import('@/lib/supabase-server')
  const db = createServiceClient()

  const { data: member } = await db
    .from('agency_members')
    .select('agency_id')
    .eq('user_id', session!.user.id)
    .eq('is_active', true)
    .single()

  const agencyId = member?.agency_id as string

  if (!agencyId) {
    return <div className="p-6 text-error">Agency not found. Please contact support.</div>
  }

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

  const { data: recentStudents } = await db
    .from('students')
    .select(`id, full_name, status, season, applications(id, university_name, status, deadline_regular)`)
    .eq('agency_id', agencyId)
    .order('updated_at', { ascending: false })
    .limit(5)

  const { data: auditLogs } = await db
    .from('audit_logs')
    .select(`id, action, entity_type, created_at, student_id, user_id`)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(8)

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

  const statCards = [
    {
      label: 'Total Students',
      value: stats.totalStudents > 0 ? stats.totalStudents.toString() : '--',
      icon: 'school',
      sub: stats.totalStudents > 0 ? 'Active students' : 'No Data Available',
    },
    {
      label: 'Acceptance Rate',
      value: '0.0%',
      icon: 'verified',
      sub: 'Awaiting Admissions',
    },
    {
      label: 'Applications',
      value: stats.activeApplications > 0 ? stats.activeApplications.toString() : '0',
      icon: 'description',
      sub: stats.activeApplications > 0 ? 'Active filings' : 'No active filings',
    },
    {
      label: 'Urgent Deadlines',
      value: stats.urgentDeadlines > 0 ? stats.urgentDeadlines.toString() : 'N/A',
      icon: 'schedule',
      sub: stats.urgentDeadlines > 0 ? 'Due in 3 days' : 'No upcoming deadlines',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight mb-2">
          Portfolio Performance
        </h2>
        <p className="text-on-surface-variant max-w-2xl leading-relaxed">
          Monitor your agency&#39;s student success metrics. Analytics will automatically populate as you onboard new students and track their application lifecycle.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-surface-container-low rounded-lg">
                <span className="material-symbols-outlined text-primary opacity-40">
                  {card.icon}
                </span>
              </div>
            </div>
            <p className="text-sm font-label text-on-surface-variant mb-1">{card.label}</p>
            <h3 className="text-2xl font-headline font-bold text-primary/30">{card.value}</h3>
            <div className="mt-4 flex items-center gap-2 text-xs text-on-surface-variant/40 italic">
              <span className="material-symbols-outlined text-xs">info</span>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Breakdown / Pipeline */}
        <div className="lg:col-span-2 bg-surface-container-low/50 rounded-xl border border-outline-variant/10">
          {(recentStudents ?? []).length > 0 ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline font-bold text-xl text-primary">Recent Students</h3>
                <Link
                  href="/students"
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {(recentStudents ?? []).map((student) => {
                  const apps = (student.applications as any[]) ?? []
                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between py-3 border-b border-outline-variant/10 last:border-0"
                    >
                      <div>
                        <Link
                          href={`/students/${student.id}/profile`}
                          className="text-sm font-medium text-on-surface hover:text-primary transition-colors"
                        >
                          {student.full_name}
                        </Link>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {apps.length} application{apps.length !== 1 ? 's' : ''}
                          {student.season ? ` · ${student.season}` : ''}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                        student.status === 'accepted' ? 'bg-[#d1fae5] text-[#065f46]' :
                        student.status === 'submitted' ? 'bg-secondary-container text-on-secondary-container' :
                        student.status === 'rejected' ? 'bg-error-container text-on-error-container' :
                        'bg-surface-container text-on-surface-variant'
                      }`}>
                        {student.status}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 pt-4 border-t border-outline-variant/10">
                <Link
                  href="/students/new"
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Add New Student
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-outline-variant/20 rounded-xl min-h-[400px]">
              <div className="relative mb-8 w-64 h-32">
                <svg className="w-full h-full opacity-20" viewBox="0 0 200 100">
                  <path
                    strokeDasharray="4 4"
                    d="M10 80 Q 50 20 90 60 T 170 10"
                    fill="none"
                    stroke="#031635"
                    strokeWidth="2"
                  />
                  <circle cx="10" cy="80" fill="#031635" r="3" />
                  <circle cx="170" cy="10" fill="#031635" r="3" />
                  <line stroke="#031635" strokeWidth="1" x1="10" x2="190" y1="90" y2="90" />
                  <line stroke="#031635" strokeWidth="1" x1="10" x2="10" y1="10" y2="90" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-primary/10">query_stats</span>
                </div>
              </div>
              <h3 className="font-headline font-bold text-xl text-primary mb-3">
                Application Breakdown
              </h3>
              <p className="text-on-surface-variant max-w-md mb-8">
                Visual reports for application statuses, reach schools, and safety targets will appear here once you begin the tracking process.
              </p>
              <Link
                href="/students/new"
                className="flex items-center gap-2 text-white px-8 py-3 rounded-lg font-semibold shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-200"
                style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
              >
                <span className="material-symbols-outlined">add_circle</span>
                Start Tracking Applications
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10">
          <h4 className="font-headline font-bold text-primary mb-6">Recent Activity</h4>
          {activityItems.length > 0 ? (
            <div className="space-y-4">
              {activityItems.map((item, idx) => (
                <div key={item.id} className={`flex gap-4 ${idx > 4 ? 'opacity-20' : idx > 2 ? 'opacity-40' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">
                      {item.entity_type === 'student' ? 'person' :
                       item.entity_type === 'application' ? 'description' : 'history'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-on-surface truncate">
                      {item.action.replace(/_/g, ' ')}
                      {item.student_name ? ` · ${item.student_name}` : ''}
                    </p>
                    <p className="text-xs text-on-surface-variant/60 mt-0.5">
                      {item.actor_name ?? 'System'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-4 opacity-30">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface-container-high rounded-full w-3/4" />
                  <div className="h-2 bg-surface-container-high rounded-full w-1/2" />
                </div>
              </div>
              <div className="flex gap-4 opacity-20">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface-container-high rounded-full w-2/3" />
                  <div className="h-2 bg-surface-container-high rounded-full w-1/3" />
                </div>
              </div>
              <div className="flex gap-4 opacity-10">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface-container-high rounded-full w-4/5" />
                  <div className="h-2 bg-surface-container-high rounded-full w-1/4" />
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-outline-variant/10 text-center">
                <p className="text-xs font-medium text-on-surface-variant italic">
                  No activity logs recorded yet.
                </p>
              </div>
            </div>
          )}

          {stats.pendingApprovals > 0 && (
            <div className="mt-6 pt-4 border-t border-outline-variant/10">
              <Link
                href="/approvals"
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium text-primary">Pending Approvals</span>
                <span className="bg-error text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.pendingApprovals}
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Floating AI Assistant */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl shadow-primary/10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span
              className="material-symbols-outlined text-white text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
          </div>
          <div className="pr-4">
            <p className="text-[10px] font-bold text-primary/40 uppercase tracking-tighter">
              Pilot Assistant
            </p>
            <p className="text-sm font-medium text-primary">
              Need help setting up your first dossier?
            </p>
          </div>
          <button className="bg-surface-container-high p-2 rounded-lg hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-primary text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  )
}
