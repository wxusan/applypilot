import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import SettingsForm from '@/components/settings/SettingsForm'

export default async function SettingsPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const db = createServiceClient()
  const { data: member } = await db
    .from('agency_members')
    .select('role, agency:agencies (*), user:users (*)')
    .eq('user_id', session!.user.id)
    .single()

  const agency = Array.isArray(member?.agency) ? member!.agency[0] : member?.agency
  const user = Array.isArray(member?.user) ? member!.user[0] : member?.user

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900">Settings</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Manage your profile and agency settings</p>
      </div>

      <SettingsForm agency={agency} user={user} role={member?.role ?? 'staff'} />
    </div>
  )
}
