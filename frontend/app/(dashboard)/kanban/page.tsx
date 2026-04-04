import { createServerClient } from '@/lib/supabase-server'
import KanbanBoard from '@/components/kanban/KanbanBoard'

const STATUS_COLORS: Record<string, string> = {
  intake: 'bg-primary',
  forms: 'bg-primary/80',
  writing: 'bg-primary/60',
  review: 'bg-primary/40',
  submitted: 'bg-primary/25',
  accepted: 'bg-tertiary-fixed-dim',
  rejected: 'bg-outline-variant',
}

export default async function KanbanPage() {
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

  const { data: students } = await db
    .from('students')
    .select(`
      id,
      full_name,
      status,
      season,
      assigned_staff_id,
      applications (
        id,
        university_name,
        status,
        deadline_regular
      )
    `)
    .eq('agency_id', agencyId)
    .order('updated_at', { ascending: false })

  const staffIds = Array.from(new Set((students ?? []).map((s: any) => s.assigned_staff_id).filter(Boolean)))
  const staffMap: Record<string, string> = {}
  if (staffIds.length > 0) {
    const { data: staffUsers } = await db
      .from('users')
      .select('id, full_name')
      .in('id', staffIds)
    for (const u of staffUsers ?? []) {
      staffMap[u.id] = u.full_name
    }
  }

  const normalised = (students ?? []).map((s: any) => ({
    ...s,
    assigned_staff_name: s.assigned_staff_id ? (staffMap[s.assigned_staff_id] ?? null) : null,
  }))

  // Calculate pipeline distribution
  const statusCounts: Record<string, number> = {}
  for (const s of normalised) {
    statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1
  }
  const total = normalised.length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-headline font-extrabold tracking-tight text-primary">
            Student Pipeline
          </h2>
          <p className="text-on-surface-variant mt-1">
            Lifecycle tracking · {total} student{total !== 1 ? 's' : ''} active
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-surface-container-lowest rounded-xl px-4 py-2 flex items-center gap-4 shadow-sm border border-outline-variant/10">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Season</span>
              <span className="font-semibold text-primary text-sm">All Seasons</span>
            </div>
          </div>
          <button className="bg-surface-container-highest p-3 rounded-xl hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>
      </div>

      {/* Distribution Bar */}
      {total > 0 && (
        <div className="bg-surface-container-low p-4 rounded-2xl mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Pipeline Distribution
            </span>
            <span className="text-xs text-on-surface-variant">Total: {total} Active Students</span>
          </div>
          <div className="h-3 flex w-full rounded-full overflow-hidden bg-surface-container-highest">
            {['intake', 'forms', 'writing', 'review', 'submitted', 'accepted', 'rejected'].map((status) => {
              const pct = total > 0 ? ((statusCounts[status] ?? 0) / total) * 100 : 0
              if (pct === 0) return null
              return (
                <div
                  key={status}
                  className={`h-full ${STATUS_COLORS[status] ?? 'bg-outline-variant'}`}
                  style={{ width: `${pct}%` }}
                  title={`${status}: ${statusCounts[status]}`}
                />
              )
            })}
          </div>
          <div className="flex gap-6 mt-3 overflow-x-auto">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2 whitespace-nowrap">
                <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status] ?? 'bg-outline-variant'}`} />
                <span className="text-[11px] font-medium capitalize">
                  {status} ({Math.round((count / total) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard students={normalised} />
      </div>
    </div>
  )
}
