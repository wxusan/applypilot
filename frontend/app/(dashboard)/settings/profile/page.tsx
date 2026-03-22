// @ts-nocheck
import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import ProfileForm from '@/components/settings/ProfileForm'

export const metadata = { title: 'Profile Settings' }

export default async function ProfileSettingsPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const db = createServiceClient()
  const { data: user } = await db
    .from('users')
    .select('id, full_name, email')
    .eq('id', session!.user.id)
    .single()

  const { data: member } = await db
    .from('agency_members')
    .select('role, agency:agencies(id, name)')
    .eq('user_id', session!.user.id)
    .eq('is_active', true)
    .single()

  const agency = Array.isArray(member?.agency) ? member!.agency[0] : member?.agency
  const isOwner = member?.role === 'admin' || member?.role === 'owner'

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900">Profile Settings</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Manage your personal information</p>
      </div>

      <ProfileForm user={user} isOwner={isOwner} agencyId={agency?.id} />
    </div>
  )
}
