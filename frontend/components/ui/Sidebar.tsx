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
  ChevronLeft,
  ChevronRight,
  Keyboard,
  X,
  Menu,
} from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useEffect } from 'react'

interface SidebarProps {
  agency: { id: string; name: string; primary_color?: string } | null
  user: { full_name: string; email: string; role?: string } | null
  userRole: string
  studentCount?: number
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

const SHORTCUTS = [
  { key: '⌘K', label: 'Command palette' },
  { key: '⌘/', label: 'Quick search' },
  { key: '?', label: 'Show shortcuts' },
]

export default function Sidebar({ agency, user, userRole, studentCount }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createBrowserClient(), [])
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Keyboard shortcut: ? to toggle shortcuts panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        setShowShortcuts(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const sidebarContent = (
    <>
      {/* Logo / Agency */}
      <div
        className="h-[52px] flex items-center px-4 gap-2 shrink-0"
        style={{ borderBottom: '0.5px solid #e5e7eb' }}
      >
        <div className="w-2 h-2 rounded-full bg-brand shrink-0" />
        {!collapsed && (
          <span className="text-[15px] font-semibold text-gray-900 truncate flex-1">
            ApplyPilot
          </span>
        )}
        <button
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="ml-auto w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand hidden md:flex"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
          className="ml-auto w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 transition-colors md:hidden"
        >
          <X size={13} />
        </button>
      </div>

      {/* Agency badge */}
      {agency && !collapsed && (
        <div className="px-4 py-2.5 shrink-0">
          <span className="inline-block text-[11px] font-medium text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5 truncate max-w-full">
            {agency.name}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
        {NAV_ITEMS.map((group) => (
          <div key={group.section}>
            {!collapsed && (
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.5px] px-2 mb-1">
                {group.section}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      aria-label={item.label}
                      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand ${collapsed ? 'justify-center' : ''}`}
                      style={
                        active
                          ? { backgroundColor: '#E1F5EE', color: '#0F6E56', fontWeight: 500 }
                          : { color: '#6B7280' }
                      }
                    >
                      <Icon size={14} className="shrink-0" />
                      {!collapsed && (
                        <span className="flex items-center gap-1.5 flex-1">
                          {item.label}
                          {item.href === '/students' && studentCount !== undefined && studentCount > 0 && (
                            <span
                              className="text-[9px] font-bold rounded-full px-1.5 py-0.5 min-w-[16px] text-center leading-none"
                              style={{ backgroundColor: '#E1F5EE', color: '#0F6E56' }}
                            >
                              {studentCount > 99 ? '99+' : studentCount}
                            </span>
                          )}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Shortcuts hint */}
      {!collapsed && (
        <div className="px-4 py-2 shrink-0" style={{ borderTop: '0.5px solid #f3f4f6' }}>
          <button
            onClick={() => setShowShortcuts(v => !v)}
            aria-label="Show keyboard shortcuts"
            className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Keyboard size={11} />
            Keyboard shortcuts (?)
          </button>
          {showShortcuts && (
            <div className="mt-2 space-y-1">
              {SHORTCUTS.map(s => (
                <div key={s.key} className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">{s.label}</span>
                  <kbd className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{s.key}</kbd>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User + logout */}
      <div
        className="px-4 py-3 space-y-2 shrink-0"
        style={{ borderTop: '0.5px solid #e5e7eb' }}
      >
        {user && !collapsed && (
          <div>
            <p className="text-[12px] font-medium text-gray-700 truncate">{user.full_name}</p>
            <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          aria-label="Sign out"
          title={collapsed ? 'Sign out' : undefined}
          className={`flex items-center gap-2 text-[12px] text-gray-400 hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={12} />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        className="md:hidden fixed top-3 left-3 z-50 w-8 h-8 flex items-center justify-center rounded-[6px] bg-white shadow-sm text-gray-600"
        style={{ border: '0.5px solid #e5e7eb' }}
      >
        <Menu size={15} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar (drawer) */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 flex flex-col bg-white transition-transform duration-200 w-[200px] ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ borderRight: '0.5px solid #e5e7eb' }}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col h-full bg-white shrink-0 transition-all duration-200 ${collapsed ? 'w-[52px]' : 'w-[200px]'}`}
        style={{ borderRight: '0.5px solid #e5e7eb' }}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
