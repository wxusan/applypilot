'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ShieldAlert,
  Building2,
  Activity,
  LogOut,
  CreditCard,
  Timer,
  Users,
  Settings2,
} from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

interface AdminSidebarProps {
  user: { full_name: string; email: string } | null
}

const NAV_ITEMS = [
  {
    section: 'PLATFORM OWNER',
    items: [
      { href: '/admin', label: 'Global Overview', icon: Activity, exact: true },
      { href: '/admin/agencies', label: 'Agency Management', icon: Building2, exact: false },
      { href: '/admin/automation', label: 'Billing & Oversight', icon: CreditCard, exact: false },
      { href: '/admin/audit', label: 'Audit Matrix', icon: ShieldAlert, exact: false },
      { href: '/admin/scheduler', label: 'Scheduler', icon: Timer, exact: false },
      { href: '/admin/contacts', label: 'People DB', icon: Users, exact: false },
      { href: '/admin/plans', label: 'Plan Config', icon: Settings2, exact: false },
    ],
  },
]

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createBrowserClient(), [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="w-[200px] shrink-0 flex flex-col h-full bg-[#111111]"
      style={{ borderRight: '1px solid #222' }}
    >
      {/* Logo */}
      <div
        className="h-[52px] flex items-center px-4 gap-2"
        style={{ borderBottom: '1px solid #222' }}
      >
        <ShieldAlert size={16} className="text-red-500" />
        <span className="text-[14px] font-semibold text-white tracking-widest truncate uppercase">
          SUPER ADMIN
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {NAV_ITEMS.map((group) => (
          <div key={group.section}>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-[1px] px-2 mb-2">
              {group.section}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-[6px] text-[13px] transition-colors"
                      style={
                        active
                          ? { backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 500 }
                          : { color: '#888' }
                      }
                    >
                      <Icon size={14} />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div
        className="px-4 py-4 space-y-3"
        style={{ borderTop: '1px solid #222' }}
      >
        {user && (
          <div>
            <p className="text-[12px] font-medium text-gray-300 truncate">{user.full_name}</p>
            <p className="text-[11px] text-gray-600 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-[12px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          <LogOut size={12} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
