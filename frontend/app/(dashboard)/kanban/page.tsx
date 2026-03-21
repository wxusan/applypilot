import { createServerClient } from '@/lib/supabase-server'
import KanbanBoard from '@/components/kanban/KanbanBoard'

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

  // Fetch students with their applications; resolve assigned staff separately
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

  // Resolve assigned staff names in one query
  const staffIds = [...new Set((students ?? []).map((s) => s.assigned_staff_id).filter(Boolean))]
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

  const normalised = (students ?? []).map((s) => ({
    ...s,
    assigned_staff_name: s.assigned_staff_id ? (staffMap[s.assigned_staff_id] ?? null) : null,
  }))

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900">Pipeline Kanban</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          Drag students between columns to update their status
        </p>
      </div>
      <KanbanBoard students={normalised} />
    </div>
  )
}
