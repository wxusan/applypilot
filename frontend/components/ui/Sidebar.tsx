'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

interface SidebarProps {
  agency: { id: string; name: string; primary_color?: string; logo_url?: string } | null
  user: { full_name: string; email: string; role?: string } | null
  userRole: string
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/students', label: 'Students', icon: 'group' },
  { href: '/kanban', label: 'Pipeline', icon: 'view_kanban' },
  { href: '/analytics', label: 'Analytics', icon: 'assessment' },
  { href: '/approvals', label: 'Approvals', icon: 'check_circle' },
  { href: '/reports', label: 'Reports', icon: 'summarize' },
]

const BOTTOM_NAV_ITEMS = [
  { href: '/settings', label: 'Settings', icon: 'settings' },
  { href: '/settings/staff', label: 'Team', icon: 'groups' },
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

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col bg-surface py-10 px-6 z-50 border-r border-outline-variant/10">
      {/* Logo / Agency */}
      <div className="mb-10 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
        >
          <span
            className="material-symbols-outlined text-white"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            architecture
          </span>
        </div>
        <div>
          <h2 className="font-headline font-extrabold text-primary leading-tight">
            {agency?.name ?? 'ApplyPilot'}
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant opacity-60">
            Premium Consulting
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                active
                  ? 'font-bold text-primary border-r-4 border-primary bg-surface-container-low/50'
                  : 'text-on-surface-variant opacity-60 hover:text-primary hover:bg-surface-container-low hover:opacity-100'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto pt-6 border-t border-outline-variant/10 space-y-1">
        <Link
          href="/students/new"
          className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl font-semibold text-sm mb-4 shadow-lg transition-all duration-150 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          New Student
        </Link>
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 text-sm font-medium transition-all ${
                active
                  ? 'font-bold text-primary'
                  : 'text-on-surface-variant opacity-60 hover:text-primary hover:opacity-100'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-on-surface-variant opacity-60 hover:text-primary hover:opacity-100 transition-all w-full"
        >
          <span className="material-symbols-outlined">logout</span>
          Sign out
        </button>
        {user && (
          <div className="px-4 py-2 mt-2">
            <p className="text-[12px] font-medium text-on-surface truncate">{user.full_name}</p>
            <p className="text-[11px] text-on-surface-variant opacity-60 truncate">{user.email}</p>
          </div>
        )}
      </div>
    </aside>
  )
}
