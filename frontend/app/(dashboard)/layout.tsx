import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import Sidebar from '@/components/ui/Sidebar'
import TopBar from '@/components/ui/TopBar'
import CommandPalette from '@/components/ui/CommandPalette'
import SessionExpiryWarning from '@/components/ui/SessionExpiryWarning'
import WhatsNewModal from '@/components/ui/WhatsNewModal'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Use service client for data queries (bypasses RLS on server)
  const { createServiceClient } = await import('@/lib/supabase-server')
  const db = createServiceClient()

  // Fetch user profile and agency — role comes from agency_members, not users
  const { data: member } = await db
    .from('agency_members')
    .select(`
      role,
      agency:agencies (
        id,
        name,
        primary_color,
        logo_url
      ),
      user:users (
        full_name,
        email
      )
    `)
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .single()

  if (!member) {
    redirect('/login')
  }

  const agency = Array.isArray(member.agency) ? member.agency[0] : member.agency
  const user = Array.isArray(member.user) ? member.user[0] : member.user

  const agencyId = (agency as { id: string })?.id ?? ''

  // Fetch pending approvals count and student count for sidebar/topbar
  const [{ count: pendingCount }, { count: studentCount }] = await Promise.all([
    db
      .from('agent_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('status', 'awaiting_approval'),
    db
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId),
  ])

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar agency={agency} user={user} userRole={member.role} studentCount={studentCount ?? 0} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar agency={agency} user={user} pendingCount={pendingCount ?? 0} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
        <CommandPalette />
        <SessionExpiryWarning />
        <WhatsNewModal />
      </div>
    </div>
  )
}
