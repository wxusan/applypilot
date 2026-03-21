import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import StaffManager from '@/components/settings/StaffManager'

export default async function StaffPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const db = createServiceClient()

  // Only admins can manage staff
  const { data: member } = await db
    .from('agency_members')
    .select('role, agency_id, agency:agencies (id, name, max_staff)')
    .eq('user_id', session!.user.id)
    .single()

  if (member?.role !== 'admin') {
    redirect('/settings')
  }

  const agency = Array.isArray(member?.agency) ? member!.agency[0] : member?.agency

  // Fetch all staff for this agency (scoped to agency)
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

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900">Staff Management</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          Invite and manage team members. Max {agency?.max_staff ?? 2} staff.
        </p>
      </div>
      <StaffManager
        staff={normalised}
        maxStaff={agency?.max_staff ?? 2}
        agencyId={agency?.id ?? ''}
      />
    </div>
  )
}
