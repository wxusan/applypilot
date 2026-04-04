import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import StaffManager from '@/components/settings/StaffManager'

export default async function StaffPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const db = createServiceClient()

  const { data: member } = await db
    .from('agency_members')
    .select('role, agency_id, agency:agencies (id, name, max_staff)')
    .eq('user_id', session!.user.id)
    .single()

  if (member?.role !== 'admin') {
    redirect('/settings')
  }

  const agency = Array.isArray(member?.agency) ? member!.agency[0] : member?.agency

  const { data: staff } = await db
    .from('agency_members')
    .select(`
      id,
      role,
      is_active,
      joined_at,
      user:users ( id, full_name, email, last_active_at )
    `)
    .eq('agency_id', member.agency_id)
    .order('joined_at', { ascending: true })

  const normalised = (staff ?? []).map((m) => {
    const u = Array.isArray(m.user) ? m.user[0] : m.user
    return {
      member_id: m.id,
      role: m.role as string,
      is_active: m.is_active as boolean,
      joined_at: m.joined_at as string,
      user_id: (u as Record<string, unknown>)?.id as string ?? '',
      full_name: (u as Record<string, unknown>)?.full_name as string ?? '',
      email: (u as Record<string, unknown>)?.email as string ?? '',
      last_active_at: (u as Record<string, unknown>)?.last_active_at as string | null ?? null,
    }
  })

  const activeCount = normalised.filter((m) => m.is_active).length
  const maxStaff = agency?.max_staff ?? 2

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight">
            Team Management
          </h1>
          <p className="font-body text-on-surface-variant mt-2 text-lg">
            Orchestrate your consulting collective with precision.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Staff Table */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline text-xl font-bold text-primary">Active Members</h3>
            <span className="px-3 py-1 bg-surface-container-highest rounded-full text-xs font-semibold text-secondary">
              {activeCount} / {maxStaff} Total
            </span>
          </div>
          <StaffManager
            staff={normalised}
            maxStaff={maxStaff}
            agencyId={agency?.id ?? ''}
          />
        </div>

        {/* Sidebar stats */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-primary text-white rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
            <h3 className="font-headline text-lg font-bold mb-6">Capacity Overview</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Staff Capacity</span>
                  <span>{maxStaff > 0 ? Math.round((activeCount / maxStaff) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-fixed-dim rounded-full"
                    style={{ width: `${maxStaff > 0 ? Math.round((activeCount / maxStaff) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-8">
            <h3 className="font-headline text-lg font-bold text-primary mb-4">Quick Insights</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1 bg-primary-fixed rounded-md">
                  <span className="material-symbols-outlined text-xs text-primary">group</span>
                </div>
                <p className="text-sm text-on-surface-variant">
                  {activeCount} active team member{activeCount !== 1 ? 's' : ''} on your agency.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1 bg-primary-fixed rounded-md">
                  <span className="material-symbols-outlined text-xs text-primary">info</span>
                </div>
                <p className="text-sm text-on-surface-variant">
                  Your plan allows up to <span className="font-bold text-primary">{maxStaff}</span> staff members.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
