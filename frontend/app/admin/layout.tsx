import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
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

  // Verify Super Admin status directly from users table
  const { data: user } = await db
    .from('users')
    .select('role, full_name, email')
    .eq('id', session.user.id)
    .single()

  if (!user || user.role !== 'super_admin') {
    redirect('/dashboard') // Boot them to the normal dashboard if they aren't the owner
  }

  return (
    <div className="flex h-screen bg-[#F5F5F5]">
      <AdminSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[52px] bg-white border-b border-gray-200 flex items-center px-6">
          <h1 className="text-[14px] font-medium text-gray-800">ApplyPilot Internal Master Control</h1>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
