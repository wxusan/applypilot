import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import SettingsNav from '@/components/settings/SettingsNav'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  let role = 'staff'
  if (session?.user?.id) {
    const db = createServiceClient()
    const { data: member } = await db
      .from('agency_members')
      .select('role')
      .eq('user_id', session.user.id)
      .single()
    role = member?.role ?? 'staff'
  }

  return (
    <div>
      <SettingsNav role={role} />
      {children}
    </div>
  )
}
