import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import Sidebar from '@/components/ui/Sidebar'
import TopBar from '@/components/ui/TopBar'

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

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar agency={agency} user={user} userRole={member.role} />
      <div className="ml-64 flex-1 flex flex-col min-w-0">
        <TopBar agency={agency} user={user} />
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
