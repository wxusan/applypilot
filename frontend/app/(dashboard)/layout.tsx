import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import Sidebar from '@/components/ui/Sidebar'
import TopBar from '@/components/ui/TopBar'
import { ToastProvider } from '@/components/ui/Toast'

function AccessWall({ type, agencyName, expiresAt }: {
  type: 'suspended' | 'expired'
  agencyName: string
  expiresAt?: string | null
}) {
  const isSuspended = type === 'suspended'
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center space-y-5">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${isSuspended ? 'bg-orange-100' : 'bg-red-100'}`}>
          <span className={`material-symbols-outlined text-3xl ${isSuspended ? 'text-orange-500' : 'text-red-500'}`}>
            {isSuspended ? 'block' : 'schedule'}
          </span>
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-gray-900">
            {isSuspended ? 'Account Suspended' : 'Trial Ended'}
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            {isSuspended
              ? `Access to ${agencyName} has been suspended.`
              : `Your trial for ${agencyName} has expired.`}
          </p>
        </div>
        <p className="text-[13px] text-gray-600">
          {isSuspended
            ? 'Your account has been temporarily suspended. Please contact ApplyPilot support to resolve this.'
            : `Your ${expiresAt ? new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'trial'} period has ended. Please contact ApplyPilot to activate your subscription and regain full access.`}
        </p>
        <a
          href="mailto:support@applypilot.com"
          className="inline-block w-full py-3 rounded-xl text-[13px] font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
        >
          Contact Support
        </a>
        <p className="text-[11px] text-gray-400">Your data is safe and fully preserved.</p>
      </div>
    </div>
  )
}

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
        logo_url,
        subscription_status,
        subscription_expires_at
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

  // ── Access gate ──────────────────────────────────────────────
  const isSuspended = agency?.subscription_status === 'suspended'
  const isTrialExpired =
    agency?.subscription_expires_at &&
    new Date(agency.subscription_expires_at) < new Date()

  if (isSuspended) {
    return <AccessWall type="suspended" agencyName={agency?.name ?? 'your agency'} />
  }

  if (isTrialExpired) {
    return (
      <AccessWall
        type="expired"
        agencyName={agency?.name ?? 'your agency'}
        expiresAt={agency?.subscription_expires_at}
      />
    )
  }
  // ─────────────────────────────────────────────────────────────

  return (
    <ToastProvider>
      <div className="flex h-screen bg-surface">
        <Sidebar agency={agency} user={user} userRole={member.role} />
        <div className="ml-64 flex-1 flex flex-col min-w-0">
          <TopBar agency={agency} user={user} />
          <main className="flex-1 overflow-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
