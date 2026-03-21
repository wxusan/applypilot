'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  BarChart2,
  Settings,
  LogOut,
  Kanban,
  UserCog,
} from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

interface SidebarProps {
  agency: { id: string; name: string; primary_color?: string } | null
  user: { full_name: string; email: string; role?: string } | null
  userRole: string
}

const NAV_ITEMS = [
  {
    section: 'MAIN',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/students', label: 'Students', icon: Users },
      { href: '/approvals', label: 'Approvals', icon: CheckSquare },
      { href: '/kanban', label: 'Kanban', icon: Kanban },
    ],
  },
  {
    section: 'INSIGHTS',
    items: [
      { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    ],
  },
  {
    section: 'ACCOUNT',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/settings/staff', label: 'Staff', icon: UserCog },
    ],
  },
]

export default function Sidebar({ agency, user, userRole }: SidebarProps) {
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
      className="w-[200px] shrink-0 flex flex-col h-full bg-white"
      style={{ borderRight: '0.5px solid #e5e7eb' }}
    >
      {/* Logo / Agency */}
      <div
        className="h-[52px] flex items-center px-4 gap-2"
        style={{ borderBottom: '0.5px solid #e5e7eb' }}
      >
        <div className="w-2 h-2 rounded-full bg-brand" />
        <span className="text-[15px] font-semibold text-gray-900 truncate">
          ApplyPilot
        </span>
      </div>

      {/* Agency badge */}
      {agency && (
        <div className="px-4 py-2.5">
          <span
            className="inline-block text-[11px] font-medium text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5 truncate max-w-full"
          >
            {agency.name}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
        {NAV_ITEMS.map((group) => (
          <div key={group.section}>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.5px] px-2 mb-1">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] text-[13px] transition-colors"
                      style={
                        active
                          ? { backgroundColor: '#E1F5EE', color: '#0F6E56', fontWeight: 500 }
                          : { color: '#6B7280' }
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
        className="px-4 py-3 space-y-2"
        style={{ borderTop: '0.5px solid #e5e7eb' }}
      >
        {user && (
          <div>
            <p className="text-[12px] font-medium text-gray-700 truncate">{user.full_name}</p>
            <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-[12px] text-gray-400 hover:text-gray-700 transition-colors"
        >
          <LogOut size={12} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
